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

function packFloatToUint8Array(value, array, index) {
    const floatView = new Float32Array(1);
    const intView = new Uint32Array(floatView.buffer);
    const byteView = new Uint8Array(floatView.buffer);

    floatView[0] = value;
    // JavaScript is little-endian, so we need to reverse the order of bytes
    array[index] = byteView[3];
    array[index + 1] = byteView[2];
    array[index + 2] = byteView[1];
    array[index + 3] = byteView[0];
}

function packFloatToVec4i2(value) {
    value = new Float32Array([value])[0];
    var msk = 1/256;
    var bitSh = [16777216, 65536, 256.0, 1.0];
    var bitMsk = [0.0, msk, msk, msk];
    var shifted = [value*bitSh[0]%1,value*bitSh[1]%1,value*bitSh[2]%1,value*bitSh[3]%1];    
    var masked = [shifted[0]*bitMsk[0],shifted[0]*bitMsk[1],shifted[1]*bitMsk[2],shifted[2]*bitMsk[3]];    
    var res = [Math.round((shifted[0]-masked[0])*255),Math.round((shifted[1]-masked[1])*255),Math.round((shifted[2]-masked[2])*255),Math.round((shifted[3]-masked[3])*255)];
    return res;
};

function packFloatToVec4i(value, array, index) {
    value = new Float32Array([value])[0];
    var msk = 1/256;
    var bitSh = [16777216, 65536, 256.0, 1.0];
    var bitMsk = [0.0, msk, msk, msk];
    var shifted = [value*bitSh[0]%1,value*bitSh[1]%1,value*bitSh[2]%1,value*bitSh[3]%1];    
    var masked = [shifted[0]*bitMsk[0],shifted[0]*bitMsk[1],shifted[1]*bitMsk[2],shifted[2]*bitMsk[3]];    

    array[index] = Math.round((shifted[0]-masked[0])*255);
    array[index + 1] = Math.round((shifted[1]-masked[1])*255);
    array[index + 2] = Math.round((shifted[2]-masked[2])*255);
    array[index + 3] = Math.round((shifted[3]-masked[3])*255);
};

export async function loadVisualSpectrum2(csvFile) {
    //console.log(packFloatToVec4i2(0.4242));
    // Example usage
    const spectralDataRr = new Uint8Array(4);
    packFloatToUint8Array(0.4242, spectralDataRr, 0);

    console.log(spectralDataRr); // Should output: [62, 217, 48, 190]

    let threeJSData = [];

    const data = await d3.csv(csvFile);
    let modifiedData = data.slice(0, 3200); // 390.0 to 709.9
    modifiedData.forEach((row) => {
        threeJSData.push(parseFloat(row.X), parseFloat(row.Y), parseFloat(row.Z));
    });

    const spectrumWidth = threeJSData.length / 3;
    const spectralDataR = new Uint8Array(spectrumWidth * 4);
    const spectralDataG = new Uint8Array(spectrumWidth * 4);
    const spectralDataB = new Uint8Array(spectrumWidth * 4);

    for (let i = 0; i < spectrumWidth; i++) {
        packFloatToUint8Array(threeJSData[3 * i], spectralDataR, 4 * i);
        packFloatToUint8Array(threeJSData[3 * i + 1], spectralDataG, 4 * i);
        packFloatToUint8Array(threeJSData[3 * i + 2], spectralDataB, 4 * i);
    }

    console.log('spectralDataR', spectralDataR.slice(1000, 1016)); // Log first few values
    console.log('spectralDataG', spectralDataG.slice(1000, 1016)); // Log first few values
    console.log('spectralDataB', spectralDataB.slice(1000, 1016)); // Log first few values

    const visualSpectrumR = new THREE.DataTexture(spectralDataR, spectrumWidth, 1, THREE.RGBAFormat, THREE.UnsignedByteType);
    visualSpectrumR.magFilter = THREE.LinearFilter;
    visualSpectrumR.minFilter = THREE.LinearFilter;
    visualSpectrumR.wrapS = THREE.ClampToEdgeWrapping;
    visualSpectrumR.wrapT = THREE.ClampToEdgeWrapping;
    visualSpectrumR.needsUpdate = true;

    const visualSpectrumG = new THREE.DataTexture(spectralDataG, spectrumWidth, 1, THREE.RGBAFormat, THREE.UnsignedByteType);
    visualSpectrumG.magFilter = THREE.LinearFilter;
    visualSpectrumG.minFilter = THREE.LinearFilter;
    visualSpectrumG.wrapS = THREE.ClampToEdgeWrapping;
    visualSpectrumG.wrapT = THREE.ClampToEdgeWrapping;
    visualSpectrumG.needsUpdate = true;

    const visualSpectrumB = new THREE.DataTexture(spectralDataB, spectrumWidth, 1, THREE.RGBAFormat, THREE.UnsignedByteType);
    visualSpectrumB.magFilter = THREE.LinearFilter;
    visualSpectrumB.minFilter = THREE.LinearFilter;
    visualSpectrumB.wrapS = THREE.ClampToEdgeWrapping;
    visualSpectrumB.wrapT = THREE.ClampToEdgeWrapping;
    visualSpectrumB.needsUpdate = true;

    return {
        visualSpectrumR,
        visualSpectrumG,
        visualSpectrumB
    };
}