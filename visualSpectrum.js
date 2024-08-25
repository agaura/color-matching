import * as THREE from 'three';
import { loadTextureFromArray, loadTexturesFromArray, loadVisualSpectrumArray, addShaderOverlay, getPath, loadShader, calibrateCanvas } from './utils.js';

export class VisualSpectrum {

    canvas = null;
    scene = null;
    camera = null;
    renderer = null;
    composer = null;
    spectrum = null;
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

        this.drawAxis(); // Add axis
        this.calibrateResize(); // Redraw the axis on window resize
        
    }

    async addObjects() {
    
        this.spectrum = loadTextureFromArray(await loadVisualSpectrumArray(getPath('lin2012xyz2e_fine_7sf.csv')));
        const spectra = loadTexturesFromArray(await loadVisualSpectrumArray(getPath('lin2012xyz2e_fine_7sf.csv')));

        // Get shaders
        const colorShader = await loadShader('shaders/colors.glsl');
        const randomShader = await loadShader('shaders/random.glsl');
        const baseVertexShader = await loadShader('shaders/visualSpectrum/vertex.glsl');
        const baseFragmentShader = await loadShader('shaders/visualSpectrum/fragment.glsl');

        const vertexShader = baseVertexShader;
        const fragmentShader = randomShader + colorShader + baseFragmentShader;

        this.composer = await addShaderOverlay(this.scene, this.camera, this.renderer, 
            {
                tDiffuse: { value: null }, // tDiffuse is the texture of the rendered scene
                time: { value: .0 },
                alpha: { value: 0.717955252861182 }, // 0.7715569276056665 for greatest diversity
                gray: { value: 0.6260300163584603 }, // 0.8015956245904453 for greatest diversity
                dimmingFactor: {value: 2.1230881684358494},
                spectrumX: {value: spectra.X},
                spectrumY: {value: spectra.Y},
                spectrumZ: {value: spectra.Z}
            },
            vertexShader,
            fragmentShader);
    }

    drawAxis() {

        const containerWidth = document.getElementById('chart-container').clientWidth;
        const svgWidth = containerWidth;
        const svgHeight = 20;
    
        const svg = d3.select("#axis-svg");
        svg.attr('width', svgWidth)
           .attr('height', svgHeight);
    
        const scale = d3.scaleLinear()
                        .range([20, svgWidth - 20])
                        .domain([390, 710]);
    
        const axis = d3.axisBottom(scale);
    
        svg.selectAll("*").remove(); // Clear previous axis elements
        svg.append("g")
           .call(axis);

    }

    // TODO: I might be able to fix this so that the canvas doesn't need to overly a container, and just have the canvas do everything on its own in CSS
    calibrateResize() {    

        var rect = this.canvas.parentElement.getBoundingClientRect();
        this.renderer.setSize(rect.width, rect.height);

        window.addEventListener('resize', () => {
            
            var rect = this.canvas.parentElement.getBoundingClientRect();
            this.renderer.setSize(rect.width, rect.height);

            this.drawAxis();
        }); // Redraw the axis on window resize

    }

    render(time) {

        if (this.composer) {
            this.composer.passes[1].uniforms.time.value = time;
            this.composer.render();
        }

    }

}
