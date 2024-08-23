uniform sampler2D tDiffuse;
uniform sampler2D spectrumX;
uniform sampler2D spectrumY;
uniform sampler2D spectrumZ;
uniform float time;
uniform float alpha;
uniform float dimmingFactor;
uniform float gray;
uniform vec3 sliderColor;
varying vec2 vUv;

void main() {

    // derive linear P3 values of the spectrum prior to being projected on a background
    vec3 XYZ_spectral_color = linearFilterPackedTexture(spectrumX, spectrumY, spectrumZ, vUv, 3200.); // have this 3200 as a uniform later
    vec3 XYZ_dimmed_color = XYZ_spectral_color / dimmingFactor; // spectral colors far exceed displayable range, need to be dimmed to compensate
    vec3 P3_Linear_ideal_color = XYZ_to_p3 * XYZ_dimmed_color;

    // derive projected color
    vec3 P3_Linear_gray_background = vec3(gray) * (1. - alpha); // the gray is derived from a mixing context, so it needs to be multiplied by 1 - alpha
    vec3 P3_Linear_projected_color = P3_Linear_gray_background + alpha * P3_Linear_ideal_color; // yes this is the same as mixing vec3(gray) and P3_Linear_ideal_color by alpha, but it's convenient to separate the terms as now it can be interpreted as adding a light (dimmed by a factor of alpha) to a gray background

    // for showing saturation cutoffs
    /*float variance_factor = vary(0., 1., time/1000.);
    P3_Linear_gray_background = vec3(mix(gray * (1. - alpha), 0., variance_factor));
    P3_Linear_projected_color = P3_Linear_gray_background + mix(alpha, 1., variance_factor) * P3_Linear_ideal_color;

    vec3 luminance = vec3((p3_to_XYZ * P3_Linear_projected_color).y);
    vec3 chromaticity_vector = P3_Linear_projected_color - luminance;
    
    vec3 xxxxx = - luminance / chromaticity_vector;
    vec3 yyyyy = (1. - luminance) / chromaticity_vector;
    float scale = max(max(max(xxxxx.x, xxxxx.y), xxxxx.z), max(max(yyyyy.x, yyyyy.y), yyyyy.z));

    scale = 100.;
    if ((xxxxx.x > 0.) && (xxxxx.x < scale)) { scale = xxxxx.x;}
    if ((xxxxx.y > 0.) && (xxxxx.y < scale)) { scale = xxxxx.y;}
    if ((xxxxx.z > 0.) && (xxxxx.z < scale)) { scale = xxxxx.z;}
    if ((yyyyy.x > 0.) && (yyyyy.x < scale)) { scale = yyyyy.x;}
    if ((yyyyy.y > 0.) && (yyyyy.y < scale)) { scale = yyyyy.y;}
    if ((yyyyy.z > 0.) && (yyyyy.z < scale)) { scale = yyyyy.z;}

    vec3 P3_Linear_projected_color_alt = clamp(luminance + chromaticity_vector * (scale), 0., 1.);
    */

    if ((P3_Linear_projected_color.x > 1.) ||
        (P3_Linear_projected_color.y > 1.) ||
        (P3_Linear_projected_color.z > 1.)) {
        gl_FragColor = vec4(vec3(0.0), 1.0);
        /*gl_FragColor = vec4(make_displayable(P3_Linear_projected_color_alt, vUv, time), 1.0);
        if (vUv.y < 1.0-scale) {gl_FragColor = vec4(vec3(0.0), 1.0);}
        else {gl_FragColor = vec4(make_displayable(P3_Linear_projected_color_alt, vUv, time), 1.0);}*/
    }
    else if ((P3_Linear_projected_color.x < 0.) ||
        (P3_Linear_projected_color.y < 0.) ||
        (P3_Linear_projected_color.z < 0.)) {
        gl_FragColor = vec4(vec3(0.0), 1.0);
        /*gl_FragColor = vec4(make_displayable(P3_Linear_projected_color_alt, vUv, time), 1.0);
        if (vUv.y < 1.0-scale) {gl_FragColor = vec4(vec3(0.0), 1.0);}
        else {gl_FragColor = vec4(make_displayable(P3_Linear_projected_color_alt, vUv, time), 1.0);}*/
    }
    // otherwise display it
    else {
        gl_FragColor = vec4(make_displayable(P3_Linear_projected_color, vUv, time), 1.0);
    }

}