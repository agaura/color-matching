uniform sampler2D tDiffuse;
uniform float time;
uniform float alpha;
uniform float gray;
uniform float scale;
uniform vec3 RGB1931_slider_color;
uniform vec3 XYZ_target_color;
varying vec2 vUv;
uniform bool realistic;

float circleFade(float outerR, float innerR, float dist) {
    float factor = clamp((1./(outerR-innerR)) * (outerR - dist), 0., 1.);
    return mix(pow(factor, 2.), pow(factor, 1./2.), factor);
}

vec2 circlePlace(float r, float theta) {
    return r * vec2(sin(theta), cos(theta));
}

void main() {

    //vec4 color = texture2D(tDiffuse, vUv);
    vec2 pos = vUv;
    float aspectRatio = 8.; // should be a uniform
    pos.x *= aspectRatio;

    // derive the background color
    // under a realistic setting, negative values of color are just positively added to the background
    vec3 P3_Linear_gray_background = vec3(gray) * (1. - alpha);
    vec3 P3_Linear_background_admixture = alpha * XYZ_to_p3 * RGB1931_to_XYZ * - min(RGB1931_slider_color, vec3(0.0));
    vec3 P3_Linear_background = P3_Linear_gray_background + float(realistic) * P3_Linear_background_admixture;

    float outerRadius = 0.375;
    float innerRadius = 0.25;
    float circDist = outerRadius / 2.;
    float circHeight = sqrt(circDist*circDist/2.);
    vec2 circPos = vec2(2.75,0.5);
    vec2 redPoint = circPos + (sin(time/1600.)) * circlePlace(1.5*circDist/2., time/500.);
    vec2 greenPoint = circPos + (sin(time/1600.)) * circlePlace(1.5*circDist/2., time/500. + 2.*M_PI/3.);
    vec2 bluePoint = circPos + (sin(time/1600.)) * circlePlace(1.5*circDist/2., time/500. + 4.*M_PI/3.);

    vec3 rotatingComponents = vec3(
        circleFade(outerRadius, innerRadius, distance(pos, redPoint)) * RGB1931_slider_color.r,
        circleFade(outerRadius, innerRadius, distance(pos, greenPoint)) * RGB1931_slider_color.g,
        circleFade(outerRadius, innerRadius, distance(pos, bluePoint)) * RGB1931_slider_color.b
    );

    vec2 potentialPos = vec2(4.,0.5);
    float potentialMultiplier = circleFade(outerRadius, innerRadius, distance(pos, potentialPos));
    vec3 potentialComponent = alpha * XYZ_to_p3 * RGB1931_to_XYZ * RGB1931_slider_color;

    vec2 matchPos = vec2(5.25,0.5);
    float matchMultiplier = circleFade(outerRadius, innerRadius, distance(pos, matchPos));
    vec3 matchComponent = alpha * XYZ_to_p3 * XYZ_target_color / scale;

    vec3 finalColor = srgb_transfer_function(vec3(P3_Linear_background
        + alpha * XYZ_to_p3 * RGB1931_to_XYZ * rotatingComponents
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
        float mixing = 1.-pow((sin(time/30. + 3.14*2.*rand(100.*vUv)) + 1.)/2.,0.5);
        //vec3 equalEnergyGray = srgb_transfer_function(XYZ_to_p3*vec3(clamp(0.,1.,RGB1931_slider_color.x)));
        //vec3 channel = srgb_transfer_function(vec3(1.,0.,0.));
        //vec3 trueColor = srgb_transfer_function(potentialMultiplier*mix(equalEnergyGray,channel,mixing));
        //vec3 trueColor = (mix(equalEnergyGray,channel,mixing));

        float factor = 60.;
        vec3 d65Gray = vec3(0.3127,0.3290,mix(0., .1, RGB1931_slider_color.x));
        vec3 channel = XYZ_to_xyY(p3_to_XYZ*vec3(0.,0.,1.));
        vec3 chromaticityMix = mix(d65Gray, channel, mixing);
        vec3 trueColor = srgb_transfer_function(XYZ_to_p3*xyY_to_XYZ(chromaticityMix));

        gl_FragColor = vec4(trueColor,1.);

        vec3 premix = 1.*XYZ_to_p3*xyY_to_XYZ(chromaticityMix);
        if ((premix.x > 1.) ||
            (premix.y > 1.) ||
            (premix.z > 1.)) {
            gl_FragColor = vec4(vec3(0.), 1.0);
        }
        else if ((premix.x < 0.) ||
            (premix.y < 0.) ||
            (premix.z < 0.)) {
            gl_FragColor = vec4(vec3(0.), 1.0);
        }
        */
    }
    else if ((pos.x > matchingBox) && (pos.x < matchingBox+1.)) {
        gl_FragColor = vec4(finalColor, 1.);
    }
    else {gl_FragColor = vec4(0.);}
}