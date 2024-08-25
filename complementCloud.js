import * as THREE from 'three';
import { lookupTable } from './coordinates.js';
import { loadShader, loadVisualSpectrumArray, loadTextureFromArray, loadTexturesFromArray, getPath, calibrateCanvas } from './utils.js';
import { Motion } from './motion.js';

function createPointCube(scale) {
    const positions = [];

    const cube_height = scale;
    const cube_width = scale;
    const cube_depth = scale;

    for (let i = 0; i < cube_height; i++){
        for (let j = 0; j < cube_width; j++) {
            for (let k = 0; k < cube_depth; k++) {
                
                const x = scale * Math.random() / (cube_height);
                const y = scale * Math.random() / (cube_width);
                const z = scale * Math.random() / (cube_depth);

                positions.push(x, y, z);
            }
        }
    }

    return positions;
}

export class ComplementCloud {
    scale = null;
	object = null;
    motion = null;
    scene = null;
    camera = null;
    renderer = null;
    canvas = null;
    matchesDrawn = null;
    outerCloud = null;
    P3Cloud = null;
    sRGBCloud = null;
    spectrum = null;
    mode = null;
    ready = null; // this is actually a promise (?) thingy

    constructor(canvasName, divName, sideLength) {
        this.mode = 0;
        this.canvas = document.getElementById(canvasName);

        this.initializeCamera();
        this.initializeRenderer();

        this.scale = sideLength * Math.pow(Math.max(screen.width, screen.height)/1920,1/8);
        this.scene = new THREE.Scene();
        //this.addObjects();

        this.ready = this.addObjects();

        this.calibrateResize(document.getElementById(divName));
    }

    setIdealX(val) {
        this.outerCloud.material.uniforms.ideal.value.setX(val);
        this.P3Cloud.material.uniforms.ideal.value.setX(val);
        this.sRGBCloud.material.uniforms.ideal.value.setX(val);
    }

    setIdealY(val) {
        this.outerCloud.material.uniforms.ideal.value.setY(val);
        this.P3Cloud.material.uniforms.ideal.value.setY(val);
        this.sRGBCloud.material.uniforms.ideal.value.setY(val);
    }

    setIdealZ(val) {
        this.outerCloud.material.uniforms.ideal.value.setZ(val);
        this.P3Cloud.material.uniforms.ideal.value.setZ(val);
        this.sRGBCloud.material.uniforms.ideal.value.setZ(val);
    }

    async fillSpectrum() {

        this.matchesDrawn = 9600/3;
        let spectralData = loadTextureFromArray(await loadVisualSpectrumArray(getPath('lin2012xyz2e_fine_7sf.csv')));
        this.spectrum.geometry.attributes.position.needsUpdate = true;
        let spectrum = spectralData;
    
        for (let i = 0; i < this.matchesDrawn; i++) {
            this.spectrum.geometry.attributes.position.setXYZ(i,
                spectrum.image.data[4*i],
                spectrum.image.data[4*i+1],
                spectrum.image.data[4*i+2]);
        }
    
        this.spectrum.geometry.setDrawRange( 0, this.matchesDrawn );
    }

    resetSpectum() {
        this.matchesDrawn = 0;    
        this.spectrum.geometry.setDrawRange( 0, 0 );
    }

    render(time) {

        // only render if there is something to render
        if (this.outerCloud) {
            
            this.outerCloud.material.uniforms.time.value = time;
            this.P3Cloud.material.uniforms.time.value = time;
            this.sRGBCloud.material.uniforms.time.value = time;
            this.spectrum.material.uniforms.time.value = time;

            this.motion.selfMove();

            this.renderer.render(this.scene, this.camera);
        }
    }

    createShaderMaterial(vertexShader, fragmentShader, cloudID) {
        let spectra = loadTexturesFromArray(lookupTable);

        return new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms: {
                spectrumLookup: {value: loadTextureFromArray(lookupTable)},
                spectrumLookupX: {value: spectra.X},
                spectrumLookupY: {value: spectra.Y},
                spectrumLookupZ: {value: spectra.Z},
                ideal: {
                    type: "3f",
                    value: new THREE.Vector3(0., 0., 0.)
                },
                time: { value: 0. },
                mode: {value: 0},
                cloudID: {value: cloudID}
            }
        });
    }

    createGeometry(array) {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(array, 3));
        geometry.computeBoundingSphere();
        return geometry;
    }

    async addObjects() {
    
        // Get shaders
        const colorShader = await loadShader('shaders/colors.glsl');
        const randomShader = await loadShader('shaders/random.glsl');
        const placementShader = await loadShader('shaders/complementCloud/placement.glsl');
        const baseVertexShader = await loadShader('shaders/complementCloud/vertex.glsl');
        const baseSpectrumVertexShader = await loadShader('shaders/complementCloud/spectrumVertex.glsl');
        const baseFragmentShader = await loadShader('shaders/complementCloud/fragment.glsl');

        const vertexShader = randomShader + colorShader + placementShader + baseVertexShader;
        const spectrumVertexShader = randomShader + colorShader + placementShader + baseSpectrumVertexShader;
        const fragmentShader = randomShader + colorShader + baseFragmentShader;
    
        // Create materials
        const colorSpaceMaterial = this.createShaderMaterial(vertexShader,fragmentShader, 0);
        const P3SpaceMaterial = this.createShaderMaterial(vertexShader,fragmentShader, 1);
        const sRGBSpaceMaterial = this.createShaderMaterial(vertexShader,fragmentShader, 2);
        const spectrumMaterial = this.createShaderMaterial(spectrumVertexShader,fragmentShader, 0);
    
        // Create cloud geometry
        const cloudGeometry = this.createGeometry(createPointCube(this.scale));
        const P3Geometry = this.createGeometry(createPointCube(this.scale));
        const sRGBGeometry = this.createGeometry(createPointCube(this.scale));
        const spectrumGeometry = this.createGeometry(new Array(9600).fill(0));
    
        // Create the clouds
        this.outerCloud = new THREE.Points(cloudGeometry, colorSpaceMaterial);
        this.P3Cloud = new THREE.Points(P3Geometry, P3SpaceMaterial);
        this.sRGBCloud = new THREE.Points(sRGBGeometry, sRGBSpaceMaterial);
        this.spectrum = new THREE.Points(spectrumGeometry, spectrumMaterial);
    
        // Group them together
        this.object = new THREE.Group();
        this.object.add(this.outerCloud);
        this.object.add(this.P3Cloud);
        this.object.add(this.sRGBCloud);
        this.object.add(this.spectrum);
    
        // Place and display it
        this.object.scale.set(0.33, 0.33, 0.33);
        this.object.position.x = 0;
        this.object.position.y = 0;
        this.object.position.z = -1;
        this.scene.add(this.object);
        
        // Select which points should be drawn
        this.matchesDrawn = 0;
        let drawCount = this.scale * this.scale * this.scale * (Math.pow(this.canvas.width/screen.width * 2 * screen.width/1920,2));
        this.outerCloud.geometry.setDrawRange(0, drawCount );
        this.P3Cloud.geometry.setDrawRange(0, drawCount );
        this.sRGBCloud.geometry.setDrawRange(0, drawCount );

        // these clouds should start off invisible
        //this.outerCloud.visible = false;
        this.P3Cloud.visible = false;
        this.sRGBCloud.visible = false;
        
        // Enable motion
        this.motion = new Motion(this.object, this.canvas);
    }

    initializeCamera() {
        this.camera = new THREE.OrthographicCamera( 2 / - 2, 2 / 2, 2 / 2, 2 / - 2, 0, 1000 );
        this.camera.position.set(0, 0, 0);
        this.camera.zoom = 2;
        this.camera.updateProjectionMatrix();
    }

    initializeRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true, premultipliedAlpha: true,
            antialias: true});
        //THREE.ColorManagement.workingColorSpace = THREE.LinearDisplayP3ColorSpace; // I think this isn't necessary
        this.renderer.outputColorSpace = THREE.DisplayP3ColorSpace
    }

    calibrateResize() {

        var rect = this.canvas.parentElement.getBoundingClientRect();
        this.renderer.setSize(rect.width, rect.height);
    
        window.addEventListener('resize', () => {

            var rect = this.canvas.parentElement.getBoundingClientRect();
            this.renderer.setSize(rect.width, rect.height);

            // note, there are 3603/3 points in the complement spectral band, and 9600/3 in the regular one
            let drawCount = this.scale * this.scale * this.scale * (Math.pow(this.canvas.width/screen.width * 2 * screen.width/1920,2));
            this.outerCloud.geometry.setDrawRange(0, drawCount);
            this.P3Cloud.geometry.setDrawRange(0, drawCount);
            this.sRGBCloud.geometry.setDrawRange(0, drawCount);
        });
    }

    incrementMode(val) {
        this.mode += val;

        this.outerCloud.material.uniforms.mode.value = this.mode;
        this.P3Cloud.material.uniforms.mode.value = this.mode;
        this.sRGBCloud.material.uniforms.mode.value = this.mode;
        this.spectrum.material.uniforms.mode.value = this.mode;

        switch(this.mode) {
            case 0:
                this.resetSpectum();
                break;
            case 1:
                this.fillSpectrum();
                break;
            case 2:
                this.spectrum.visible = true;
                break;
            case 3:
                this.spectrum.visible = false;
                break;
            case 6:
                this.P3Cloud.visible = false;
                this.sRGBCloud.visible = false;
                break;
            case 7:
                this.P3Cloud.visible = true;
                this.sRGBCloud.visible = true;
                break;
        }
    }
}