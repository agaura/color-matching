uniform sampler2D tDiffuse;
uniform float time;
uniform float alpha;
uniform float gray;
uniform float scale;
uniform vec3 sliderColor;
uniform vec3 matchColor;
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
    vec4 color = texture2D(tDiffuse, vUv);
    vec2 pos = vUv;
    float aspectRatio = 6.;
    pos.x *= aspectRatio;

    vec3 baseGray = mix(vec3(gray), vec3(0.), alpha);

    vec3 redComponent = mix(vec3(gray), XYZ_to_p3*RGB1931toXYZ*vec3(1.,0.,0.), alpha) - baseGray;
    vec3 greenComponent = mix(vec3(gray), XYZ_to_p3*RGB1931toXYZ*vec3(0.,1.,0.), alpha) - baseGray;
    vec3 blueComponent = mix(vec3(gray), XYZ_to_p3*RGB1931toXYZ*vec3(0.,0.,1.), alpha) - baseGray;

    float outerRadius = 0.35;
    float innerRadius = 0.25;
    float circDist = outerRadius / 2.;
    float circHeight = sqrt(circDist*circDist/2.);
    vec2 circPos = vec2(1.5,0.5 - circHeight/2.);
    vec2 redPoint = circPos + vec2(0.,0.);
    vec2 greenPoint = circPos + vec2(circDist,0.);
    vec2 bluePoint = circPos + vec2(circDist/2.,circHeight);

    vec3 sliderMultiplier = vec3(
        circleFade(outerRadius, innerRadius, distance(pos, redPoint),1.) * sliderColor.r,
        circleFade(outerRadius, innerRadius, distance(pos, greenPoint),1.) * sliderColor.g,
        circleFade(outerRadius, innerRadius, distance(pos, bluePoint),1.) * sliderColor.b
    );

    vec2 matchPos = vec2(4.5,0.5);
    float matchMultiplier = circleFade(outerRadius, innerRadius, distance(pos, matchPos),1.);
    vec3 matchComponent = mix(vec3(gray), XYZ_to_p3*matchColor/scale, alpha) - baseGray;

    vec2 potentialPos = vec2(3.5,0.5);
    float potentialMultiplier = circleFade(outerRadius, innerRadius, distance(pos, potentialPos),1.);
    vec3 potentialComponent = mix(vec3(gray), XYZ_to_p3*RGB1931toXYZ*sliderColor, alpha) - baseGray;

    float edgeFade = circleFade(0.,0.25, min(distance(pos.x, 0.), distance(pos.x, aspectRatio)),4.);

    vec3 finalColor = srgb_transfer_function(vec3(baseGray
        + sliderMultiplier.r * redComponent
        + sliderMultiplier.g * greenComponent
        + sliderMultiplier.b * blueComponent
        + matchMultiplier * matchComponent
        + potentialMultiplier * potentialComponent));

    gl_FragColor = edgeFade*vec4(finalColor, 1.);
}