uniform sampler2D tDiffuse;
uniform sampler2D spectrum;
uniform sampler2D spectrumR;
uniform sampler2D spectrumG;
uniform sampler2D spectrumB;
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
    vec3 xyzColor = texture2D(spectrum, vUv).xyz;
    //xyzColor = xyzColor/dot(XYZto1931*xyzColor, vec3(1.))*0.378;

    xyzColor = vec3(unpackUint8ToFloat(texture2D(spectrumR, vUv)),
        unpackUint8ToFloat(texture2D(spectrumG, vUv)),
        unpackUint8ToFloat(texture2D(spectrumB, vUv)));

    vec3 mixedColor = mix(vec3(gray), XYZ_to_p3*xyzColor/scale, alpha);
    //vec3 mixedColor = mix(vec3(gray), XYZ_to_p3*xyzColor/scale, sin(time/1000.)/2. + 0.5);
    vec3 displayableColor = srgb_transfer_function(mixedColor);

    if ((displayableColor.x > 1.) || (displayableColor.y > 1.) || (displayableColor.z > 1.)) {
        gl_FragColor = vec4(vec3(0.0), 1.0);
    }
    else if ((displayableColor.x < 0.) || (displayableColor.y < 0.) || (displayableColor.z < 0.)) {
        gl_FragColor = vec4(vec3(0.0), 1.0);
    }
    else {
        gl_FragColor = vec4(displayableColor, 1.0);
    }

    /*
    float xxxxx = unpackUint8ToFloat(vec4(0.,95.,151.,108.)/255.);
    float yyyyy = unpackUint8ToFloat(vec4(64.,246.,171.,27.)/255.);

    gl_FragColor = vec4(intBitsToFloat(1054421182), 0., 0., 1.);*/
    
    //float fade = 1.-circleFade(0.1, 0.05, distance(mixedColor, mix(vec3(gray), vec3(0.0), alpha)),2.);
    //gl_FragColor *= fade;
}