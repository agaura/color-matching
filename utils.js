export function getPath(fileName) {
    const host = window.location.hostname;
    const isGitHub = host.includes('github.io');

    console.log(host);
    console.log(isGitHub);

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