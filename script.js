// script.js
import { ComplementCloud } from './complementCloud.js';
import { ColorMatching } from './colorMatching.js';
import { VisualSpectrum } from './visualSpectrum.js';
import { initializeSliders } from './sliders.js';

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

async function initObjects() {

    environments.complementCloud = new ComplementCloud('complementCloud', 'complementCloudDiv', 50);
    await environments.complementCloud.ready;

    environments.visualSpectrum = new VisualSpectrum('visualSpectrum', 'blank-chart');
    await environments.visualSpectrum.ready;

    environments.colorMatching = new ColorMatching('colorMatching', 'colorMatchingDiv');
    await environments.colorMatching.ready;

    initializeSliders('#sliders', 0.717955252861182, 0.6260300163584603,
        environments.complementCloud,
        environments.colorMatching.composer.passes[1].uniforms.RGB1931_slider_color.value
        );

    environments.colorMatching.setUpMatching(environments.visualSpectrum, environments.complementCloud);

}

function animate(time) {

    requestAnimationFrame(animate);

    if (environments.visualSpectrum.render) {environments.complementCloud.render(time);}
    if (environments.colorMatching.render) {environments.colorMatching.render(time);}
    if (environments.visualSpectrum.render) {environments.visualSpectrum.render(time);}
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