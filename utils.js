import * as THREE from 'three';

function getElementOffset(element) {
    let top = 0, left = 0;
    while (element) {
        top += element.offsetTop - element.scrollTop + element.clientTop;
        left += element.offsetLeft - element.scrollLeft + element.clientLeft;
        element = element.offsetParent;
    }
    return { top, left };
}

export function calibrateCanvas(canvas, renderer, container) {
    var rect = container.getBoundingClientRect();
    let { top, left } = getElementOffset(container);
    canvas.style.top = `${top}px`;
    canvas.style.left = `${left}px`;
    renderer.setSize(rect.width, rect.height);
}

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
    calibrateCanvas(environment.canvas, environment.renderer, container);

    window.addEventListener('resize', () => {
        calibrateCanvas(environment.canvas, environment.renderer, container);
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

export async function loadVisualSpectrumArray(csvFile) {
    let array = [];

    // Await the asynchronous loading and processing of the CSV file
    const data = await d3.csv(csvFile);
    let modifiedData = data.slice(0, 3200); // 390.0 to 709.9
    modifiedData.forEach((row) => {
        array.push(parseFloat(row.X), parseFloat(row.Y), parseFloat(row.Z));
    });

    return array;
}

export function loadTextureFromArray(data) {

    const spectrumWidth = data.length / 3;
    const spectralData = new Float32Array(spectrumWidth * 4);
    for (let i = 0; i < spectrumWidth; i++) {
        spectralData[4 * i] = data[3 * i] * 1;
        spectralData[4 * i + 1] = data[3 * i + 1] * 1;
        spectralData[4 * i + 2] = data[3 * i + 2] * 1;
        spectralData[4 * i + 3] = 1; // Alpha channel
    }

    // Create the data texture
    const visualSpectrum = new THREE.DataTexture(spectralData, spectrumWidth, 1, THREE.RGBAFormat, THREE.FloatType);
    visualSpectrum.magFilter = THREE.LinearFilter; // This allows linear interpolation
    visualSpectrum.needsUpdate = true;

    return visualSpectrum;
}

export function loadTexturesFromArray(data) {

    const spectrumWidth = data.length / 3;
    const spectralDataX = new Uint8Array(spectrumWidth * 4);
    const spectralDataY = new Uint8Array(spectrumWidth * 4);
    const spectralDataZ = new Uint8Array(spectrumWidth * 4);

    for (let i = 0; i < spectrumWidth; i++) {
        packFloatToUint8Array(data[3 * i], spectralDataX, 4 * i);
        packFloatToUint8Array(data[3 * i + 1], spectralDataY, 4 * i);
        packFloatToUint8Array(data[3 * i + 2], spectralDataZ, 4 * i);
    }

    const X = new THREE.DataTexture(spectralDataX, spectrumWidth, 1, THREE.RGBAFormat, THREE.UnsignedByteType);
    X.magFilter = THREE.NearestFilter;
    X.minFilter = THREE.NearestFilter;
    X.wrapS = THREE.ClampToEdgeWrapping;
    X.wrapT = THREE.ClampToEdgeWrapping;
    X.needsUpdate = true;

    const Y = new THREE.DataTexture(spectralDataY, spectrumWidth, 1, THREE.RGBAFormat, THREE.UnsignedByteType);
    Y.magFilter = THREE.NearestFilter;
    Y.minFilter = THREE.NearestFilter;
    Y.wrapS = THREE.ClampToEdgeWrapping;
    Y.wrapT = THREE.ClampToEdgeWrapping;
    Y.needsUpdate = true;

    const Z = new THREE.DataTexture(spectralDataZ, spectrumWidth, 1, THREE.RGBAFormat, THREE.UnsignedByteType);
    Z.magFilter = THREE.NearestFilter;
    Z.minFilter = THREE.NearestFilter;
    Z.wrapS = THREE.ClampToEdgeWrapping;
    Z.wrapT = THREE.ClampToEdgeWrapping;
    Z.needsUpdate = true;

    return {
        X,
        Y,
        Z
    };
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

function packFloatToUint8Array(value, array, index) {
    const floatView = new Float32Array(1);
    //const intView = new Uint32Array(floatView.buffer);
    const byteView = new Uint8Array(floatView.buffer);

    floatView[0] = value;
    // JavaScript is little-endian, so we need to reverse the order of bytes
    array[index] = byteView[3];
    array[index + 1] = byteView[2];
    array[index + 2] = byteView[1];
    array[index + 3] = byteView[0];
}

export async function loadVisualSpectrum2(csvFile) {
    let threeJSData = [];

    const data = await d3.csv(csvFile);
    let modifiedData = data.slice(0, 3200); // 390.0 to 709.9
    modifiedData.forEach((row) => {
        threeJSData.push(parseFloat(row.X), parseFloat(row.Y), parseFloat(row.Z));
    });

    const spectrumWidth = threeJSData.length / 3;
    const spectralDataX = new Uint8Array(spectrumWidth * 4);
    const spectralDataY = new Uint8Array(spectrumWidth * 4);
    const spectralDataZ = new Uint8Array(spectrumWidth * 4);

    for (let i = 0; i < spectrumWidth; i++) {
        packFloatToUint8Array(threeJSData[3 * i], spectralDataX, 4 * i);
        packFloatToUint8Array(threeJSData[3 * i + 1], spectralDataY, 4 * i);
        packFloatToUint8Array(threeJSData[3 * i + 2], spectralDataZ, 4 * i);
    }

    const visualSpectrumX = new THREE.DataTexture(spectralDataX, spectrumWidth, 1, THREE.RGBAFormat, THREE.UnsignedByteType);
    visualSpectrumX.magFilter = THREE.NearestFilter;
    visualSpectrumX.minFilter = THREE.NearestFilter;
    visualSpectrumX.wrapS = THREE.ClampToEdgeWrapping;
    visualSpectrumX.wrapT = THREE.ClampToEdgeWrapping;
    visualSpectrumX.needsUpdate = true;

    const visualSpectrumY = new THREE.DataTexture(spectralDataY, spectrumWidth, 1, THREE.RGBAFormat, THREE.UnsignedByteType);
    visualSpectrumY.magFilter = THREE.NearestFilter;
    visualSpectrumY.minFilter = THREE.NearestFilter;
    visualSpectrumY.wrapS = THREE.ClampToEdgeWrapping;
    visualSpectrumY.wrapT = THREE.ClampToEdgeWrapping;
    visualSpectrumY.needsUpdate = true;

    const visualSpectrumZ = new THREE.DataTexture(spectralDataZ, spectrumWidth, 1, THREE.RGBAFormat, THREE.UnsignedByteType);
    visualSpectrumZ.magFilter = THREE.NearestFilter;
    visualSpectrumZ.minFilter = THREE.NearestFilter;
    visualSpectrumZ.wrapS = THREE.ClampToEdgeWrapping;
    visualSpectrumZ.wrapT = THREE.ClampToEdgeWrapping;
    visualSpectrumZ.needsUpdate = true;

    return {
        visualSpectrumX,
        visualSpectrumY,
        visualSpectrumZ
    };
}