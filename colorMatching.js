import * as THREE from 'three';
import { addShaderOverlay, loadShader, calibrateCanvas } from './utils.js';

const XYZtoRGB1931 = new THREE.Matrix3().set(8041697/3400850, -3049000/3400850, -1591847/3400850,
    -1752003/3400850, 4851000/3400850, 301853/3400850,
    17697/3400850, -49000/3400850, 3432153/3400850);

function checkMatch(spectrum, matchEnvironment, cloudEnvironment) {
    
    const XYZdefaultTargetColor = matchEnvironment.targetColor.value;
    const XYZdisplayTargetColor = matchEnvironment.composer.passes[1].uniforms.XYZ_target_color.value;
    const RGB1931displayTargetColor = XYZdisplayTargetColor.clone().applyMatrix3(XYZtoRGB1931).divideScalar(1.965183286767108);
    const RGB1931sliderColor = matchEnvironment.composer.passes[1].uniforms.RGB1931_slider_color.value;

    if (RGB1931displayTargetColor.distanceTo(RGB1931sliderColor) < 0.1) {

        // add correct match to the cloud
        cloudEnvironment.spectrum.geometry.attributes.position.needsUpdate = true;
        cloudEnvironment.spectrum.geometry.attributes.position.setXYZ(cloudEnvironment.matchesDrawn, XYZdisplayTargetColor.x, XYZdisplayTargetColor.y, XYZdisplayTargetColor.z);
        cloudEnvironment.matchesDrawn++
        cloudEnvironment.spectrum.geometry.setDrawRange( 0, cloudEnvironment.matchesDrawn);

        // find random color to match with
        const proportion = Math.random();
        const i = 4 * Math.round(proportion * (spectrum.image.data.length/4 - 1));

        // set default target color (used as memory for when hovering over the spectrum)
        XYZdefaultTargetColor.set(
            spectrum.image.data[i],
            spectrum.image.data[i+1],
            spectrum.image.data[i+2]);

        // display the target color
        XYZdisplayTargetColor.set(
            spectrum.image.data[i],
            spectrum.image.data[i+1],
            spectrum.image.data[i+2]);
    }
}

export class ColorMatching {

    targetColor = {
        type: "3f",
        value: new THREE.Vector3(0., 0., 0.)
    };

    canvas = null;
    scene = null;
    camera = null;
    renderer = null;
    composer = null;
    ready = null; // this is actually a promise (?) thingy

    constructor(canvasName) {

        // Add canvas
        this.canvas = document.getElementById(canvasName);

        // Create scene
        this.scene = new THREE.Scene();
        
        // Create camera
        this.camera = new THREE.OrthographicCamera( 2 / - 2, 2 / 2, 2 / 2, 2 / - 2, 0, 1000 );
        this.camera.position.set(0, 0, 0);
        this.camera.zoom = 2;
        this.camera.updateProjectionMatrix();

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true, premultipliedAlpha: true,
            antialias: true});
        this.renderer.outputColorSpace = THREE.DisplayP3ColorSpace

        this.ready = this.addObjects();

        this.calibrateResize(); // Redraw the axis on window resize
        
    }

    async addObjects() {

        // Get shaders
        const colorShader = await loadShader('shaders/colors.glsl');
        const randomShader = await loadShader('shaders/random.glsl');
        const baseVertexShader = await loadShader('shaders/colorMatching/vertex.glsl');
        const baseFragmentShader = await loadShader('shaders/colorMatching/fragment.glsl');

        const vertexShader = baseVertexShader;
        const fragmentShader = randomShader + colorShader + baseFragmentShader;

        this.composer = await addShaderOverlay(this.scene, this.camera, this.renderer, 
            {
                tDiffuse: { value: null }, // tDiffuse is the texture of the rendered scene
                time: { value: .0 },
                alpha: { value: 0.697737144559289 }, //alpha: { value: 0.717955252861182 },
                gray: { value: 0.6602703073367381 }, //gray: { value: 0.6260300163584603 },
                scale: { value: 1.965183286767108 }, //scale: { value: 2.1230881684358494 },
                RGB1931_slider_color: {
                    type: "3f",
                    value: new THREE.Vector3(0., 0., 0.)
                },
                XYZ_target_color: {
                    type: "3f",
                    value: new THREE.Vector3(0., 0., 0.)
                },
                realistic: { value: 1. }
            },
            vertexShader,
            fragmentShader);
    }

    // TODO: I might be able to fix this so that the canvas doesn't need to overly a container, and just have the canvas do everything on its own in CSS
    calibrateResize() {    

        var rect = this.canvas.parentElement.getBoundingClientRect();
        this.renderer.setSize(rect.width, rect.height);

        window.addEventListener('resize', () => {
            var rect = this.canvas.parentElement.getBoundingClientRect();
            this.renderer.setSize(rect.width, rect.height);
        });

    }

    checkMatch(spectrum, matchEnvironment, cloudEnvironment) {
    
        const XYZdefaultTargetColor = matchEnvironment.targetColor.value;
        const XYZdisplayTargetColor = matchEnvironment.composer.passes[1].uniforms.XYZ_target_color.value;
        const RGB1931displayTargetColor = XYZdisplayTargetColor.clone().applyMatrix3(XYZtoRGB1931).divideScalar(1.965183286767108);
        const RGB1931sliderColor = matchEnvironment.composer.passes[1].uniforms.RGB1931_slider_color.value;
    
        if (RGB1931displayTargetColor.distanceTo(RGB1931sliderColor) < 0.1) {
    
            // add correct match to the cloud
            cloudEnvironment.spectrum.geometry.attributes.position.needsUpdate = true;
            cloudEnvironment.spectrum.geometry.attributes.position.setXYZ(cloudEnvironment.matchesDrawn, XYZdisplayTargetColor.x, XYZdisplayTargetColor.y, XYZdisplayTargetColor.z);
            cloudEnvironment.matchesDrawn++
            cloudEnvironment.spectrum.geometry.setDrawRange( 0, cloudEnvironment.matchesDrawn);
    
            // find random color to match with
            const proportion = Math.random();
            const i = 4 * Math.round(proportion * (spectrum.image.data.length/4 - 1));
    
            // set default target color (used as memory for when hovering over the spectrum)
            XYZdefaultTargetColor.set(
                spectrum.image.data[i],
                spectrum.image.data[i+1],
                spectrum.image.data[i+2]);
    
            // display the target color
            XYZdisplayTargetColor.set(
                spectrum.image.data[i],
                spectrum.image.data[i+1],
                spectrum.image.data[i+2]);
        }
    }

    setUpMatching(spectrumEnvironment, cloudEnvironment) {

        const spectrum = spectrumEnvironment.spectrum;
        const canvas = spectrumEnvironment.canvas;
        const XYZdisplayTargetColor = this.composer.passes[1].uniforms.XYZ_target_color.value;
        const XYZdefaultTargetColor = this.targetColor.value;

        // display as the target color whatever color is being hovered over
        canvas.addEventListener('mousemove', function(event) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - Math.floor(rect.left);
        const proportion = x / (Math.ceil(rect.right) - Math.floor(rect.left));
        const i = 4 * Math.round(proportion * (spectrum.image.data.length/4 - 1));

        XYZdisplayTargetColor.set(
            spectrum.image.data[i],
            spectrum.image.data[i+1],
            spectrum.image.data[i+2]);
        });

        // set the target color to the color being hovered over when clicked upon
        canvas.addEventListener('pointerup', function() {
        XYZdefaultTargetColor.set(
            XYZdisplayTargetColor.x,
            XYZdisplayTargetColor.y,
            XYZdisplayTargetColor.z);
        });

        // return the target color to its default color when no longer hovering
        canvas.addEventListener('mouseleave', function() {
        XYZdisplayTargetColor.set(
            XYZdefaultTargetColor.x,
            XYZdefaultTargetColor.y,
            XYZdefaultTargetColor.z);
        });

        // when the match button is clicked, check if the slider color and target color match
        document.getElementById('matchBtn').addEventListener('click', () =>
        checkMatch(spectrum, this, cloudEnvironment));

    }

    render(time) {

        if (this.composer) {
            this.composer.passes[1].uniforms.time.value = time;
            this.composer.render();
        }

    }

}
