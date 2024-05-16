// script.js
import * as THREE from 'three';
import { getPath, loadShader } from './utils.js';
import { setupMotion } from './motion.js';
import { initializeSliders } from './sliders.js';
import { lookupTable } from './coordinates.js';
import { EffectComposer } from 'https://unpkg.com/three@0.162.0/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'https://unpkg.com/three@0.162.0/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'https://unpkg.com/three@0.162.0/examples/jsm/postprocessing/ShaderPass';

let currentSlide = 0;
const slides = [
    { title: "Slide 1", body: "This is the first slide.", objects: ['cube', 'pyramid'] },
    { title: "Slide 2", body: "This is the second slide.", objects: ['pyramid'] },
    { title: "Slide 3", body: "This is the third slide.", objects: ['pyramid', 'cylinder'] }
];

const objects = {
    cube: null,
    pyramid: null,
    cylinder: null
};

const environments = {
    complementCloud: {},
    colorMatching: {},
    visualSpectrum: {}
}

async function initEnvironment(environment, canvasElement, container) {

    // Add canvas
    environment.canvas = canvasElement;

    // Create scene
    environment.scene = new THREE.Scene();
    
    // Create camera
    environment.camera = new THREE.OrthographicCamera( 2 / - 2, 2 / 2, 2 / 2, 2 / - 2, 0, 1000 );
    environment.camera.position.set(0, 0, 0);
    environment.camera.zoom = 2;
    environment.camera.updateProjectionMatrix();

    // Create renderer
    environment.renderer = new THREE.WebGLRenderer({
        canvas: canvasElement,
        alpha: true, premultipliedAlpha: true,
        antialias: true});
    //THREE.ColorManagement.workingColorSpace = THREE.LinearDisplayP3ColorSpace; // I think this isn't necessary
    environment.renderer.outputColorSpace = THREE.DisplayP3ColorSpace

    // Resize
    var rect = container.getBoundingClientRect();
    environment.canvas.style.top = `${rect.top}px`;
    environment.canvas.style.left = `${rect.left}px`;
    environment.renderer.setSize(rect.width, rect.height);

    window.addEventListener('resize', () => {
        rect = container.getBoundingClientRect();
        environment.canvas.style.top = `${rect.top}px`;
        environment.canvas.style.left = `${rect.left}px`;
        environment.renderer.setSize(rect.width, rect.height);
    });
}

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

async function addObjects(environment) {

    // Create the data texture
    const width = lookupTable.length/3;
    const data = new Float32Array(width*4);
    for (let i = 0; i < width; i++) {

        data[4*i] = lookupTable[3*i] * 1;
        data[4*i+1] = lookupTable[3*i+1] * 1;
        data[4*i+2] = lookupTable[3*i+2] * 1;
        data[4*i+3] = 1;
    }

    const texture = new THREE.DataTexture(data, width, 1, THREE.RGBAFormat, THREE.FloatType);
    texture.magFilter = THREE.LinearFilter; // this allows linear interpolation
    texture.needsUpdate = true;

    // Get shaders
    const colorShader = await loadShader('shaders/colors.glsl');
    const randomShader = await loadShader('shaders/random.glsl');
    const placementShader = await loadShader('shaders/complementCloud/placement.glsl');
    const vertexShader = await loadShader('shaders/complementCloud/vertex.glsl');
    const spectrumVertexShader = await loadShader('shaders/complementCloud/spectrumVertex.glsl');
    const fragmentShader = await loadShader('shaders/complementCloud/fragment.glsl');

    // Create material
    const colorSpaceMaterial = new THREE.ShaderMaterial({
        vertexShader: colorShader + randomShader + placementShader + vertexShader,
        fragmentShader: colorShader + fragmentShader,
        uniforms: {
            spectrumLookup: {value: texture},
            ideal: {
                type: "3f",
                value: new THREE.Vector3(0., 0., 0.)
            },
            time: { value: .0 },
            mode: {value: 0},
            cloudID: {value: 0}
        }
    });

    // Create material
    const P3SpaceMaterial = new THREE.ShaderMaterial({
        vertexShader: colorShader + randomShader + placementShader + vertexShader,
        fragmentShader: colorShader + fragmentShader,
        uniforms: {
            spectrumLookup: {value: texture},
            ideal: {
                type: "3f",
                value: new THREE.Vector3(0., 0., 0.)
            },
            time: { value: .0 },
            mode: {value: 0},
            cloudID: {value: 1}
        }
    });

    // Create material
    const sRGBSpaceMaterial = new THREE.ShaderMaterial({
        vertexShader: colorShader + randomShader + placementShader + vertexShader,
        fragmentShader: colorShader + fragmentShader,
        uniforms: {
            spectrumLookup: {value: texture},
            ideal: {
                type: "3f",
                value: new THREE.Vector3(0., 0., 0.)
            },
            time: { value: .0 },
            mode: {value: 0},
            cloudID: {value: 2}
        }
    });

    // Create sprectrum material
    const spectrumMaterial = new THREE.ShaderMaterial({
        vertexShader: colorShader + randomShader + placementShader + spectrumVertexShader,
        fragmentShader: colorShader + fragmentShader,
        uniforms: {
            spectrumLookup: {value: texture},
            ideal: {
                type: "3f",
                value: new THREE.Vector3(0., 0., 0.)
            },
            time: { value: .0 },
            mode: {value: 0}
        }
    });

    // Create points in cloud
    // XXXXX this needs to be fixed, these should use the actual spectrum positions if anything and not the complement spectrum as that one is longer 
    //const positions = [...lookupTable];

    const scale = 60 * Math.pow(screen.width/1920,2/3);

    // Create cloud geometry
    const cloudGeometry = new THREE.BufferGeometry();
    cloudGeometry.setAttribute('position', new THREE.Float32BufferAttribute(createPointCube(scale), 3));
    cloudGeometry.computeBoundingSphere();

    const P3Geometry = new THREE.BufferGeometry();
    P3Geometry.setAttribute('position', new THREE.Float32BufferAttribute(createPointCube(scale), 3));
    P3Geometry.computeBoundingSphere();

    const sRGBGeometry = new THREE.BufferGeometry();
    sRGBGeometry.setAttribute('position', new THREE.Float32BufferAttribute(createPointCube(scale), 3));
    sRGBGeometry.computeBoundingSphere();

    const spectrumGeometry = new THREE.BufferGeometry();
    spectrumGeometry.setAttribute('position', new THREE.Float32BufferAttribute(new Array(9600).fill(0), 3));
    spectrumGeometry.computeBoundingSphere();

    // Display and place the object
    //environment.object = new THREE.Points(cloudGeometry, colorSpaceMaterial);

    environment.object = new THREE.Group();
    environment.outerCloud = new THREE.Points(cloudGeometry, colorSpaceMaterial);
    environment.P3Cloud = new THREE.Points(P3Geometry, P3SpaceMaterial);
    environment.sRGBCloud = new THREE.Points(sRGBGeometry, sRGBSpaceMaterial);
    environment.spectrum = new THREE.Points(spectrumGeometry, spectrumMaterial);

    environment.object.add(environment.outerCloud);
    environment.object.add(environment.P3Cloud);
    environment.object.add(environment.sRGBCloud);
    environment.object.add(environment.spectrum);

    environment.scene.add(environment.object);
    environment.object.scale.set(0.33, 0.33, 0.33);
    environment.object.position.x = 0;
    environment.object.position.y = 0;
    environment.object.position.z = -1;
    
    // Select which points should be drawn
    environment.matchesDrawn = 0;    
    environment.drawCount = scale*scale*scale * (Math.pow(environment.canvas.width/screen.width * 2 * screen.width/1920,2));
    environment.outerCloud.geometry.setDrawRange(0, environment.drawCount );
    environment.P3Cloud.geometry.setDrawRange(0, environment.drawCount );
    environment.sRGBCloud.geometry.setDrawRange(0, environment.drawCount );

    window.addEventListener('resize', () => {
        // note, there are 3603/3 points in the complement spectral band, and 9600/3 in the regular one
        environment.drawCount = scale*scale*scale * (Math.pow(environment.canvas.width/screen.width * 2 * screen.width/1920,2));
        environment.outerCloud.geometry.setDrawRange(0, environment.drawCount);
        environment.P3Cloud.geometry.setDrawRange(0, environment.drawCount);
        environment.sRGBCloud.geometry.setDrawRange(0, environment.drawCount);
        //console.log(environment.matchesDrawn);
    });
        
}

async function addShaderOverlay(environment, uniforms, vertexFile, fragmentFile) {
    environment.composer = new EffectComposer(environment.renderer);
    environment.composer.addPass(new RenderPass(environment.scene, environment.camera));

    const shader = {
        uniforms: uniforms,
        vertexShader: await loadShader(vertexFile),
        fragmentShader: await loadShader(fragmentFile)
    };
    
    const pass = new ShaderPass(shader);
    environment.composer.addPass(pass);
}

async function loadVisualSpectrum(csvFile) {
    let threeJSData = [];

    // Await the asynchronous loading and processing of the CSV file
    const data = await d3.csv(csvFile);
    let modifiedData = data.slice(0, 3200); // 390.0 to 709.9
    modifiedData.forEach((row) => {
        threeJSData.push(parseFloat(row.X), parseFloat(row.Y), parseFloat(row.Z));
    });

    const spectrumWidth = threeJSData.length / 3;
    const spectralData = new Float32Array(spectrumWidth * 4);
    for (let i = 0; i < spectrumWidth; i++) {
        spectralData[4 * i] = threeJSData[3 * i] * 1;
        spectralData[4 * i + 1] = threeJSData[3 * i + 1] * 1;
        spectralData[4 * i + 2] = threeJSData[3 * i + 2] * 1;
        spectralData[4 * i + 3] = 1; // Alpha channel
    }

    // Create the data texture
    const visualSpectrum = new THREE.DataTexture(spectralData, spectrumWidth, 1, THREE.RGBAFormat, THREE.FloatType);
    visualSpectrum.magFilter = THREE.LinearFilter; // This allows linear interpolation
    visualSpectrum.needsUpdate = true;

    return visualSpectrum;
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
    
    const matchColor = matchEnvironment.composer.passes[1].uniforms.matchColor.value;
    const convertedMatchColor = matchColor.clone().applyMatrix3(XYZtoRGB1931).divideScalar(2.1230881684358494);
    const attemptColor = matchEnvironment.composer.passes[1].uniforms.sliderColor.value;

    if (convertedMatchColor.distanceTo(attemptColor) < 0.1) {

        cloudEnvironment.spectrum.geometry.attributes.position.needsUpdate = true;
        cloudEnvironment.spectrum.geometry.attributes.position.setXYZ(cloudEnvironment.matchesDrawn, matchColor.x, matchColor.y, matchColor.z);
        cloudEnvironment.matchesDrawn++
        cloudEnvironment.spectrum.geometry.setDrawRange( 0, cloudEnvironment.matchesDrawn);

        const proportion = Math.random();
        const i = 4*Math.round(proportion * (spectrum.image.data.length/4 - 1));

        matchColor.setX(spectrum.image.data[i]);
        matchColor.setY(spectrum.image.data[i+1]);
        matchColor.setZ(spectrum.image.data[i+2]);

        matchEnvironment.matchColor.value.setX(spectrum.image.data[i]);
        matchEnvironment.matchColor.value.setY(spectrum.image.data[i+1]);
        matchEnvironment.matchColor.value.setZ(spectrum.image.data[i+2]);
    }

}

function setUpMatching(spectrum, canvasName, matchingEnvironment, cloudEnvironment) {
    const canvas = document.getElementById(canvasName);

    canvas.addEventListener('mousemove', function(event) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const proportion = x / canvas.width;
        const i = 4*Math.round(proportion * (spectrum.image.data.length/4 - 1));

        matchingEnvironment.composer.passes[1].uniforms.matchColor.value.setX(spectrum.image.data[i]);
        matchingEnvironment.composer.passes[1].uniforms.matchColor.value.setY(spectrum.image.data[i+1]);
        matchingEnvironment.composer.passes[1].uniforms.matchColor.value.setZ(spectrum.image.data[i+2]);
    });

    canvas.addEventListener('pointerup', function() {
        matchingEnvironment.matchColor.value.setX(matchingEnvironment.composer.passes[1].uniforms.matchColor.value.x);
        matchingEnvironment.matchColor.value.setY(matchingEnvironment.composer.passes[1].uniforms.matchColor.value.y);
        matchingEnvironment.matchColor.value.setZ(matchingEnvironment.composer.passes[1].uniforms.matchColor.value.z);
    });

    canvas.addEventListener('mouseleave', function() {
        matchingEnvironment.composer.passes[1].uniforms.matchColor.value.setX(matchingEnvironment.matchColor.value.x);
        matchingEnvironment.composer.passes[1].uniforms.matchColor.value.setY(matchingEnvironment.matchColor.value.y);
        matchingEnvironment.composer.passes[1].uniforms.matchColor.value.setZ(matchingEnvironment.matchColor.value.z);
    });

    document.getElementById('matchBtn').addEventListener('click', () =>
        checkMatch(spectrum, matchingEnvironment, cloudEnvironment));

}

async function initializeComplementCloud(environment, canvasName, divName) {
    initEnvironment(environment, document.getElementById(canvasName), document.getElementById(divName));
    await addObjects(environment);
    setupMotion(environment);
}

async function initializeColorMatching(environment, canvasName, divName) {
    initEnvironment(environment, document.getElementById(canvasName), document.getElementById(divName));
    await addShaderOverlay(environment, 
        {
            tDiffuse: { value: null }, // tDiffuse is the texture of the rendered scene
            time: { value: .0 },
            alpha: { value: 0.717955252861182 },
            gray: { value: 0.6260300163584603 },
            scale: {value: 2.1230881684358494},
            sliderColor: {
                type: "3f",
                value: new THREE.Vector3(0., 0., 0.)
            },
            matchColor: {
                type: "3f",
                value: new THREE.Vector3(0., 0., 0.)
            }
        },
        'shaders/colorMatching/vertex.glsl',
        'shaders/colorMatching/fragment.glsl');
    environment.matchColor = {
        type: "3f",
        value: new THREE.Vector3(0., 0., 0.)
    };
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
    environment.spectrum = await loadVisualSpectrum(getPath('lin2012xyz2e_fine_7sf.csv'));

    await addShaderOverlay(environment, 
        {
            tDiffuse: { value: null }, // tDiffuse is the texture of the rendered scene
            time: { value: .0 },
            alpha: { value: 0.717955252861182 },
            gray: { value: 0.6260300163584603 },
            scale: {value: 2.1230881684358494},
            spectrum: {value: environment.spectrum}
        },
        getPath('shaders/visualSpectrum/vertex.glsl'),
        getPath('shaders/visualSpectrum/fragment.glsl'));

    drawAxis(); // Add axis
    window.addEventListener('resize', drawAxis); // Redraw the axis on window resize
}

async function initObjects() {

    await initializeComplementCloud(environments.complementCloud, 'complementCloud', 'complementCloudDiv');
    await initializeVisualSpectrum(environments.visualSpectrum, 'visualSpectrum', 'blank-chart');
    await initializeColorMatching(environments.colorMatching,'colorMatching','colorMatchingDiv');
    initializeSliders('#sliders', 0.717955252861182, 0.6260300163584603,
        environments.complementCloud.outerCloud.material.uniforms.ideal.value,
        environments.colorMatching.composer.passes[1].uniforms.sliderColor.value
        );
    setUpMatching(environments.visualSpectrum.composer.passes[1].uniforms.spectrum.value, 'visualSpectrum', environments.colorMatching, environments.complementCloud);

}

function animate(time) {
    requestAnimationFrame(animate);
    if (environments.complementCloud.object) {
        environments.complementCloud.outerCloud.material.uniforms.time.value = time;
        environments.complementCloud.P3Cloud.material.uniforms.time.value = time;
        environments.complementCloud.sRGBCloud.material.uniforms.time.value = time;
        environments.complementCloud.spectrum.material.uniforms.time.value = time;
    }
    if (environments.complementCloud.motion) {environments.complementCloud.motion.selfMove();}
        
    // Render the scene
    environments.complementCloud.renderer.render(environments.complementCloud.scene, environments.complementCloud.camera);

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
        environments.complementCloud.outerCloud.material.uniforms.mode.value ++;
        environments.complementCloud.P3Cloud.material.uniforms.mode.value ++;
        environments.complementCloud.sRGBCloud.material.uniforms.mode.value ++;
        environments.complementCloud.spectrum.material.uniforms.mode.value ++;
        if (environments.complementCloud.outerCloud.material.uniforms.mode.value == 1) {
            fillSpectrum(environments.visualSpectrum.composer.passes[1].uniforms.spectrum.value, environments.complementCloud);
        }
    });

    document.getElementById('prev').addEventListener('click', () => {
        environments.complementCloud.outerCloud.material.uniforms.mode.value -= 1;
        environments.complementCloud.P3Cloud.material.uniforms.mode.value -= 1;
        environments.complementCloud.sRGBCloud.material.uniforms.mode.value -= 1;
        environments.complementCloud.spectrum.material.uniforms.mode.value -= 1;});
}

document.addEventListener("DOMContentLoaded", function() {
    initObjects().catch(error => console.error(error));
    renderSlide(currentSlide);
    setupNavigation();
});