export function gamma(a) {
    return .0031308 >= a ? 12.92 * a : 1.055 * Math.pow(a, .4166666666666667) - .055;
}

export function mix(x, y, a) {
    return a*y + (1-a)*x;
}

export function RGB1931toXYZ(vec) {
    const [r,g,b] = vec;
    return [0.49*r+0.31*g+0.2*b,
        0.17697*r+0.8124*g+0.01063*b,
        0.*r+0.01*g+0.99*b];
}

export function XYZtoP3(vec) {
    const [r,g,b] = vec;
    return [2.4934969*r-0.9313836*g-0.4027108*b,
        -0.8294890*r+1.7626641*g+0.0236247*b,
        0.0358458*r-0.0761724*g+0.9568845*b];

}

export function CSSconvert(c, primary, alpha, gray) {
    const new0 = mix(gray, 0, alpha);
    const [maxR, maxG, maxB] = XYZtoP3(RGB1931toXYZ(primary));
    const actR = mix(gray, maxR, alpha);
    const actG = mix(gray, maxG, alpha);
    const actB = mix(gray, maxB, alpha);
    return `color(display-p3 ${gamma(mix(new0, actR, c))} ${gamma(mix(new0, actG, c))} ${gamma(mix(new0, actB, c))})`
}