uniform sampler2D tDiffuse;
uniform sampler2D spectrum;
uniform sampler2D spectrumX;
uniform sampler2D spectrumY;
uniform sampler2D spectrumZ;
uniform float time;
uniform float alpha;
uniform float scale;
uniform float gray;
uniform vec3 sliderColor;
varying vec2 vUv;

float srgb_transfer_function(float a) {
    return .0031308f >= a ? 12.92f * a : 1.055f * pow(a, .4166666666666667f) - .055f;
}

vec3 srgb_transfer_function(vec3 c) {
    return vec3(srgb_transfer_function(c.r),
        srgb_transfer_function(c.g),
        srgb_transfer_function(c.b));
}

float srgb_transfer_function_inv(float a)
{
    return .04045f < a ? pow((a + .055f) / 1.055f, 2.4f) : a / 12.92f;
}

vec3 srgb_transfer_function_inv(vec3 a)
{
    return vec3(srgb_transfer_function_inv(a.x),
        srgb_transfer_function_inv(a.y),
        srgb_transfer_function_inv(a.z));
}

float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898,78.233))) * 43758.5453);
}

vec3 randomizer(vec3 starter, float time) {
    float r1 = rand(vec2(starter.x * 1502.13, starter.y * 232.82 + starter.z * 800.1));
    float r2 = rand(vec2(starter.y * 545.36, starter.z * 646.2 + r1 * 250.));
    float r3 = rand(vec2(starter.x * 1408.33, starter.z * 257.9 + r2 * 630.));

    float r1p = rand(vec2(starter.x * 100.2 + 50. * r1, starter.y * 17.6));
    float r2p = rand(vec2(starter.y * 256.4 + 67.8 * r2, starter.z * 179.5));
    float r3p = rand(vec2(starter.z * 98.3 + 98. * r3, starter.x * 290.5));

    float speed = 1./1000.;
    float speedMultiplier = 3.;

    float speedVariance1 = mix(1.,speedMultiplier,r2);
    float speedVariance2 = mix(1.,speedMultiplier,r3);
    float speedVariance3 = mix(1.,speedMultiplier,r1);

    float p1 = (r1 * sin(speedVariance1 * time * speed / 10. + 150.*r1p) + 1.0) / 2.;
    float p2 = (r2 * sin(speedVariance2 * time * speed + 276.*r2p) + 1.0) / 2.;
    float p3 = (r3 * sin(speedVariance3 * time * speed + 2039.*r3p) + 1.0) / 2.;

    return vec3(p1,p2,p3);
}

vec3 getFloatColorPrecisionViaDithering(vec3 displayableColor) {

    vec3 colorLinear = srgb_transfer_function_inv(displayableColor);
    vec3 floors = floor(255. * displayableColor) / 255.;
    vec3 floorsLinear = srgb_transfer_function_inv(floors);
    vec3 ceils = ceil(255. * displayableColor) / 255.;
    vec3 ceilsLinear = srgb_transfer_function_inv(ceils);
    vec3 thresholds = (colorLinear - floorsLinear) / (ceilsLinear - floorsLinear);
    vec3 rands = randomizer(vec3(vUv, rand(vUv)), time);

    vec3 ditheredColor = vec3(0.);
    if (rands.r < thresholds.r) {ditheredColor.r = ceils.r;}
    else {ditheredColor.r = floors.r;}
    if (rands.g < thresholds.g) {ditheredColor.g = ceils.g;}
    else {ditheredColor.g = floors.g;}
    if (rands.b < thresholds.b) {ditheredColor.b = ceils.b;}
    else {ditheredColor.b = floors.b;}

    return ditheredColor;
}

float circleFade(float outerR, float innerR, float dist, float p) {
    return pow(clamp((1./(outerR-innerR)) * (outerR - dist),0.,1.),p);
}

float unpackUint8ToFloat(vec4 value) {
    int intBits = int(value.r * 255.0) << 24 |
                  int(value.g * 255.0) << 16 |
                  int(value.b * 255.0) << 8 |
                  int(value.a * 255.0);
    return intBitsToFloat(intBits);
}

// this is necessary because the automatic linear filtering in the javascript seems to have some issues with packed textures
vec3 linearFilterPackedTexture(sampler2D x, sampler2D y, sampler2D z, vec2 uv, float width) {

    float widthAdjusted = width - 1.0;

    float alpha = fract(uv.x * widthAdjusted);
    vec2 left = vec2(uv.x - alpha / widthAdjusted, uv.y);
    vec2 right = vec2(uv.x + (1. - alpha) / widthAdjusted, uv.y);

    vec3 leftPixel = vec3(unpackUint8ToFloat(texture2D(x, left)),
        unpackUint8ToFloat(texture2D(y, left)),
        unpackUint8ToFloat(texture2D(z, left)));

    vec3 rightPixel = vec3(unpackUint8ToFloat(texture2D(x, right)),
        unpackUint8ToFloat(texture2D(y, right)),
        unpackUint8ToFloat(texture2D(z, right)));

    return mix(leftPixel, rightPixel, alpha);
}

mat3 p3_to_XYZ = transpose(mat3(
    0.4865709,  0.2656677,  0.1982173,
    0.2289746,  0.6917385,  0.0792869,
    0.,   0.0451134,  1.0439444
));

mat3 XYZ_to_p3 = transpose(mat3(
    2.4934969, -0.9313836, -0.4027108,
    -0.8294890, 1.7626641,  0.0236247,
    0.0358458, -0.0761724,  0.9568845));

mat3 XYZto1931 = transpose(mat3(8041697.,-3049000., -1591847.,
                -1752003., 4851000., 301853.,
                17697., -49000., 3432153.)) / 3400850.;

mat3 RGB1931toXYZ = transpose(mat3(0.49,0.31,0.2,
        0.17697,0.8124,0.01063,
        0.0,0.01,0.99));

void main() {
    //vec3 xyzColor = texture2D(spectrum, vUv).xyz;
    //xyzColor = xyzColor/dot(XYZto1931*xyzColor, vec3(1.))*0.378;

    vec3 xyzColor = linearFilterPackedTexture(spectrumX, spectrumY, spectrumZ, vUv, 3200.); // have this 3200 as a uniform later

    vec3 mixedColor = mix(vec3(gray), XYZ_to_p3*xyzColor/scale, alpha);
    //vec3 mixedColor = mix(mix(vec3(gray), vec3(0.), alpha), XYZ_to_p3*xyzColor/scale, sin(time/10000.)/2. + 0.5);
    vec3 displayableColor = srgb_transfer_function(mixedColor);

    if ((displayableColor.x > 1.) || (displayableColor.y > 1.) || (displayableColor.z > 1.)) {
        gl_FragColor = vec4(vec3(0.0), 1.0);
    }
    else if ((displayableColor.x < 0.) || (displayableColor.y < 0.) || (displayableColor.z < 0.)) {
        gl_FragColor = vec4(vec3(0.0), 1.0);
    }
    else {
        gl_FragColor = vec4(getFloatColorPrecisionViaDithering(displayableColor), 1.0);
        //gl_FragColor = vec4(displayableColor, 1.0);
    }

}