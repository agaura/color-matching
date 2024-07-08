import * as THREE from 'three';

export function getPath(fileName) {
    const host = window.location.hostname;
    const isGitHub = host.includes('github.io');

    //console.log(host);
    //console.log(isGitHub);

    if (isGitHub) {
        console.log(`/color-matching/${fileName}`);
        return `../color-matching/${fileName}`;
    } else {
        return `../${fileName}`;
    }
}

export async function loadShader(url) {
    const response = await fetch(getPath(url));
    if (!response.ok) {
        throw new Error(`Failed to load shader: ${url}`);
    }
    return response.text();
}

export async function initializeEnvironment(environment, container) {

    // Create scene
    environment.scene = new THREE.Scene();
    
    // Create camera
    environment.camera = new THREE.OrthographicCamera( 2 / - 2, 2 / 2, 2 / 2, 2 / - 2, 0, 1000 );
    environment.camera.position.set(0, 0, 0);
    environment.camera.zoom = 2;
    environment.camera.updateProjectionMatrix();

    // Create renderer
    environment.renderer = new THREE.WebGLRenderer({
        canvas: environment.canvas,
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

export function initEnvironment(environment, canvasElement, container) {

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

export function createPointCube(scale) {
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

export async function loadVisualSpectrum(csvFile) {
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

/*
export function loadVisualSpectrum(csvFile) {

    const spectrumWidth = 3200;
    const spectralData = new Float32Array(spectrumWidth * 4);
    for (let i = 0; i < spectrumWidth; i++) {
        spectralData[4 * i] = i / spectrumWidth * 1;
        spectralData[4 * i + 1] = 0;
        spectralData[4 * i + 2] = 0;
        spectralData[4 * i + 3] = 1; // Alpha channel
    }

    // Create the data texture
    const visualSpectrum = new THREE.DataTexture(spectralData, spectrumWidth, 1, THREE.RGBAFormat, THREE.FloatType);
    visualSpectrum.magFilter = THREE.LinearFilter; // This allows linear interpolation
    visualSpectrum.needsUpdate = true;

    return visualSpectrum;
}*/

/*
export function loadVisualSpectrum(csvFile) {

    const spectrumWidth = 3200;
    const spectralData = new Uint8Array(spectrumWidth * 4);
    for (let i = 0; i < spectrumWidth; i++) {
        spectralData[4 * i] = Math.floor( i / spectrumWidth * 255 );
        spectralData[4 * i + 1] = 0;
        spectralData[4 * i + 2] = 0;
        spectralData[4 * i + 3] = 255; // Alpha channel
    }

    // Create the data texture
    const visualSpectrum = new THREE.DataTexture(spectralData, spectrumWidth, 1);
    visualSpectrum.magFilter = THREE.LinearFilter; // This allows linear interpolation
    visualSpectrum.needsUpdate = true;

    return visualSpectrum;
}*/

/*
export async function loadVisualSpectrum(csvFile) {
    let threeJSData = [];

    // Await the asynchronous loading and processing of the CSV file
    const data = await d3.csv(csvFile);
    let modifiedData = data.slice(0, 3200); // 390.0 to 709.9
    modifiedData.forEach((row) => {
        threeJSData.push(parseFloat(row.X), parseFloat(row.Y), parseFloat(row.Z));
    });

    const spectrumWidth = threeJSData.length / 3;
    const spectralData = new Uint8Array(spectrumWidth * 4);
    for (let i = 0; i < spectrumWidth; i++) {
        spectralData[4 * i] = Math.floor( threeJSData[3 * i] * 255 );
        spectralData[4 * i + 1] = Math.floor( threeJSData[3 * i + 1] * 255 );
        spectralData[4 * i + 2] = Math.floor( threeJSData[3 * i + 2] * 255 );
        spectralData[4 * i + 3] = 1; // Alpha channel
    }

    // Create the data texture
    const visualSpectrum = new THREE.DataTexture(spectralData, spectrumWidth, 1);
    visualSpectrum.magFilter = THREE.LinearFilter; // This allows linear interpolation
    visualSpectrum.needsUpdate = true;

    return visualSpectrum;
}*/

/*
export async function loadVisualSpectrum(csvFile) {
    let threeJSData = [];

    // Await the asynchronous loading and processing of the CSV file
    const data = await d3.csv(csvFile);
    let modifiedData = data.slice(0, 300); // 390.0 to 709.9
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
}*/