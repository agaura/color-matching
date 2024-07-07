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

vec3 XYZ_to_xyY(vec3 c) {
    return vec3(c.x / (c.x + c.y + c.z),
        c.y / (c.x + c.y + c.z),
        c.y);
}

vec3 xyY_to_XYZ(vec3 c) {
    return vec3(c.x * c.z / c.y,
        c.z,
        (1. - c.x - c.y) * c.z / c.y);
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

vec2 circlePlace(float r, float theta) {
    return r*vec2(sin(theta), cos(theta));
}

float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898,78.233))) * 43758.5453);
}

void main() {

    bool REALISTIC = false;
    float M_PI = 3.1415926535897932384626433832795;

    vec4 color = texture2D(tDiffuse, vUv);
    vec2 pos = vUv;
    float aspectRatio = 8.;
    pos.x *= aspectRatio;

    float negativeRed = sliderColor.r > 0. ? 0. : -1. * sliderColor.r;
    vec3 p3negativeRed = XYZ_to_p3*RGB1931toXYZ*vec3(negativeRed,0.,0.);
    vec3 background = REALISTIC ? mix(vec3(gray), p3negativeRed, alpha) : mix(vec3(gray), vec3(0.), alpha);

    vec3 redComponent = alpha*XYZ_to_p3*RGB1931toXYZ*vec3(1.,0.,0.);
    vec3 greenComponent = alpha*XYZ_to_p3*RGB1931toXYZ*vec3(0.,1.,0.);
    vec3 blueComponent = alpha*XYZ_to_p3*RGB1931toXYZ*vec3(0.,0.,1.);

    float outerRadius = 0.35;
    float innerRadius = 0.25;
    float circDist = outerRadius / 2.;
    float circHeight = sqrt(circDist*circDist/2.);
    vec2 circPos = vec2(2.75,0.5);
    vec2 redPoint = circPos + (sin(time/1600.)) * circlePlace(1.5*circDist/2., time/500.);
    vec2 greenPoint = circPos + (sin(time/1600.)) * circlePlace(1.5*circDist/2., time/500. + 2.*M_PI/3.);
    vec2 bluePoint = circPos + (sin(time/1600.)) * circlePlace(1.5*circDist/2., time/500. + 4.*M_PI/3.);

    vec3 sliderMultiplier = vec3(
        circleFade(outerRadius, innerRadius, distance(pos, redPoint),1.) * sliderColor.r,
        circleFade(outerRadius, innerRadius, distance(pos, greenPoint),1.) * sliderColor.g,
        circleFade(outerRadius, innerRadius, distance(pos, bluePoint),1.) * sliderColor.b
    );

    vec2 potentialPos = vec2(4.,0.5);
    float potentialMultiplier = circleFade(outerRadius, innerRadius, distance(pos, potentialPos),1.);
    vec3 potentialComponent = alpha*XYZ_to_p3*RGB1931toXYZ*sliderColor;

    vec2 matchPos = vec2(5.25,0.5);
    float matchMultiplier = circleFade(outerRadius, innerRadius, distance(pos, matchPos),1.);
    vec3 matchComponent = alpha*XYZ_to_p3*matchColor/scale;

    vec3 finalColor = srgb_transfer_function(vec3(background
        + sliderMultiplier.r * redComponent
        + sliderMultiplier.g * greenComponent
        + sliderMultiplier.b * blueComponent
        + matchMultiplier * matchComponent
        + potentialMultiplier * potentialComponent));

    gl_FragColor = vec4(finalColor, 1.);

    float rotatingBox = 2.25;
    float combiningBox = 3.5;
    float matchingBox = 4.75;
    if ((pos.x > rotatingBox) && (pos.x < rotatingBox+1.)) {
        gl_FragColor = vec4(finalColor, 1.);

        //vec3 backgroundColor = 
    }
    else if ((pos.x > combiningBox) && (pos.x < combiningBox+1.)) {
        gl_FragColor = vec4(finalColor, 1.);

        /*
        float mixing = 1.-pow((sin(time/100. + 3.14*2.*rand(100.*vUv)) + 1.)/2.,0.25);
        //vec3 equalEnergyGray = srgb_transfer_function(XYZ_to_p3*vec3(clamp(0.,1.,sliderColor.x)));
        //vec3 channel = srgb_transfer_function(vec3(1.,0.,0.));
        //vec3 trueColor = srgb_transfer_function(potentialMultiplier*mix(equalEnergyGray,channel,mixing));
        //vec3 trueColor = (mix(equalEnergyGray,channel,mixing));

        vec3 equalEnergyGray = vec3(0.33333,0.33333,clamp(0.,1.,sliderColor.x));
        vec3 channel = XYZ_to_xyY(p3_to_XYZ*vec3(0.,0.,1.));
        vec3 chromaticityMix = mix(equalEnergyGray, channel, mixing);
        vec3 trueColor = srgb_transfer_function(XYZ_to_p3*xyY_to_XYZ(chromaticityMix));

        gl_FragColor = vec4(trueColor,1.);*/
    }
    else if ((pos.x > matchingBox) && (pos.x < matchingBox+1.)) {
        gl_FragColor = vec4(finalColor, 1.);
    }
    else {gl_FragColor = vec4(0.);}
}