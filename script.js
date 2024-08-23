// script.js
import * as THREE from 'three';
import { ComplementCloud } from './complementCloud.js';
import { getPath, loadShader, initEnvironment, loadVisualSpectrum, loadVisualSpectrum2, loadVisualSpectrumArray, loadTextureFromArray, loadTexturesFromArray } from './utils.js';
import { initializeSliders } from './sliders.js';
import { EffectComposer } from 'https://unpkg.com/three@0.162.0/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'https://unpkg.com/three@0.162.0/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'https://unpkg.com/three@0.162.0/examples/jsm/postprocessing/ShaderPass';

let currentSlide = 0;
const slides = [
    { title: "Slide 1", body: "This is the first slide.", objects: ['cube', 'pyramid'] },
    { title: "Slide 2", body: "This is the second slide.", objects: ['pyramid'] },
    { title: "Slide 3", body: "This is the third slide.", objects: ['pyramid', 'cylinder'] }
];

const environments = {
    complementCloud: {},
    colorMatching: {},
    visualSpectrum: {}
}

async function addShaderOverlay(environment, uniforms, vertex, fragment) {
    environment.composer = new EffectComposer(environment.renderer);
    environment.composer.addPass(new RenderPass(environment.scene, environment.camera));

    const shader = {
        uniforms: uniforms,
        vertexShader: vertex,
        fragmentShader: fragment
    };
    
    const pass = new ShaderPass(shader);
    environment.composer.addPass(pass);
}


const XYZtoRGB1931 = new THREE.Matrix3().set(8041697/3400850, -3049000/3400850, -1591847/3400850,
    -1752003/3400850, 4851000/3400850, 301853/3400850,
    17697/3400850, -49000/3400850, 3432153/3400850);

function fillSpectrum(spectrum, cloudEnvironment) {

    cloudEnvironment.matchesDrawn = 9600/3;
    cloudEnvironment.spectrum.geometry.attributes.position.needsUpdate = true;

    for (let i = 0; i < cloudEnvironment.matchesDrawn; i++) {
        cloudEnvironment.spectrum.geometry.attributes.position.setXYZ(i,
            spectrum.image.data[4*i],
            spectrum.image.data[4*i+1],
            spectrum.image.data[4*i+2]);
    }

    cloudEnvironment.spectrum.geometry.setDrawRange( 0, cloudEnvironment.matchesDrawn );
}

function checkMatch(spectrum, matchEnvironment, cloudEnvironment) {
    
    const XYZdefaultTargetColor = matchEnvironment.targetColor.value;
    const XYZdisplayTargetColor = matchEnvironment.composer.passes[1].uniforms.XYZ_target_color.value;
    const RGB1931displayTargetColor = XYZdisplayTargetColor.clone().applyMatrix3(XYZtoRGB1931).divideScalar(2.1230881684358494);
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

function setUpMatching(spectrum, canvasName, matchingEnvironment, cloudEnvironment) {
    const canvas = document.getElementById(canvasName);
    const XYZdisplayTargetColor = matchingEnvironment.composer.passes[1].uniforms.XYZ_target_color.value;
    const XYZdefaultTargetColor = matchingEnvironment.targetColor.value;

    // display as the target color whatever color is being hovered over
    canvas.addEventListener('mousemove', function(event) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const proportion = x / canvas.width;
        const i = 4*Math.round(proportion * (spectrum.image.data.length/4 - 1));

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
        checkMatch(spectrum, matchingEnvironment, cloudEnvironment));

}

async function initializeColorMatching(environment, canvasName, divName) {

    initEnvironment(environment, document.getElementById(canvasName), document.getElementById(divName));

    environment.targetColor = {
        type: "3f",
        value: new THREE.Vector3(0., 0., 0.)
    };

    // Get shaders
    const colorShader = await loadShader('shaders/colors.glsl');
    const randomShader = await loadShader('shaders/random.glsl');
    const baseVertexShader = await loadShader('shaders/colorMatching/vertex.glsl');
    const baseFragmentShader = await loadShader('shaders/colorMatching/fragment.glsl');

    const vertexShader = baseVertexShader;
    const fragmentShader = randomShader + colorShader + baseFragmentShader;

    await addShaderOverlay(environment, 
        {
            tDiffuse: { value: null }, // tDiffuse is the texture of the rendered scene
            time: { value: .0 },
            alpha: { value: 0.717955252861182 },
            gray: { value: 0.6260300163584603 },
            scale: { value: 2.1230881684358494 },
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

function drawAxis() {
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

async function initializeVisualSpectrum(environment, canvasName, divName) {
    initEnvironment(environment, document.getElementById(canvasName), document.getElementById(divName));
    environment.spectrum = loadTextureFromArray(await loadVisualSpectrumArray(getPath('lin2012xyz2e_fine_7sf.csv')));
    const spectra = loadTexturesFromArray(await loadVisualSpectrumArray(getPath('lin2012xyz2e_fine_7sf.csv')));
    //const spectra = await loadVisualSpectrum2(getPath('lin2012xyz2e_fine_7sf.csv'));

    // Get shaders
    const colorShader = await loadShader('shaders/colors.glsl');
    const randomShader = await loadShader('shaders/random.glsl');
    const baseVertexShader = await loadShader('shaders/visualSpectrum/vertex.glsl');
    const baseFragmentShader = await loadShader('shaders/visualSpectrum/fragment.glsl');

    const vertexShader = baseVertexShader;
    const fragmentShader = randomShader + colorShader + baseFragmentShader;

    await addShaderOverlay(environment, 
        {
            tDiffuse: { value: null }, // tDiffuse is the texture of the rendered scene
            time: { value: .0 },
            alpha: { value: 0.717955252861182 }, // 0.7715569276056665 for greatest diversity
            gray: { value: 0.6260300163584603 }, // 0.8015956245904453 for greatest diversity
            dimmingFactor: {value: 2.1230881684358494},
            //spectrum: {value: environment.spectrum},
            spectrumX: {value: spectra.X},
            spectrumY: {value: spectra.Y},
            spectrumZ: {value: spectra.Z}
        },
        vertexShader,
        fragmentShader);

    drawAxis(); // Add axis
    window.addEventListener('resize', drawAxis); // Redraw the axis on window resize
    
    //console.log(environment.spectrum.source.data.data);
    
    //document.getElementById("top-left").innerHTML = "hello";


}

async function initObjects() {

    //await initializeComplementCloud(environments.complementCloud, 'complementCloud', 'complementCloudDiv');
    environments.complementCloud = new ComplementCloud('complementCloud', 'complementCloudDiv', 50);
    await environments.complementCloud.ready;
    //console.log(await environments.complementCloud.ready);
    await initializeVisualSpectrum(environments.visualSpectrum, 'visualSpectrum', 'blank-chart');
    await initializeColorMatching(environments.colorMatching,'colorMatching','colorMatchingDiv');
    initializeSliders('#sliders', 0.717955252861182, 0.6260300163584603,
        environments.complementCloud,
        environments.colorMatching.composer.passes[1].uniforms.RGB1931_slider_color.value
        );
    setUpMatching(environments.visualSpectrum.spectrum, 'visualSpectrum', environments.colorMatching, environments.complementCloud);

}

function animate(time) {
    requestAnimationFrame(animate);
    if (environments.complementCloud.outerCloud) {environments.complementCloud.render(time);}

    if (environments.colorMatching.composer) {
        environments.colorMatching.composer.passes[1].uniforms.time.value = time;
        environments.colorMatching.composer.render();
    }

    if (environments.visualSpectrum.composer) {
        environments.visualSpectrum.composer.passes[1].uniforms.time.value = time;
        environments.visualSpectrum.composer.render();
    }
}

function renderSlide(slideIndex) {
    // Update slide content and visibility based on `slideIndex`.
    // Use Three.js to handle canvas rendering.

    // Start the rendering loop
    animate();
}

function createSlideContent(slide) {
    // Create and return slide HTML content based on the slide data.
}

function setupNavigation() {
    // Setup event listeners for your navigation buttons.

    document.getElementById('next').addEventListener('click', () => {
        //console.log(environments.complementCloud.outerCloud.material.uniforms.mode.value);
        environments.complementCloud.incrementMode(1);
    });

    document.getElementById('prev').addEventListener('click', () => {
        environments.complementCloud.incrementMode(-1);
    });
}

document.addEventListener("DOMContentLoaded", function() {
    initObjects().catch(error => console.error(error));
    renderSlide(currentSlide);
    setupNavigation();
});