varying vec3 xyz_color;
varying float unaffected;
uniform int mode;
uniform float time;
uniform vec3 ideal;

void paint_complement_cloud() {

    vec3 p3_color = XYZ_to_p3*xyz_color;
    float whitepoint_scale = 0.916;
    //float alpha = 0.38465664131947086;
    //vec3 gray = vec3(0.3277935806611292);
    float alpha = 0.3392828462996986;
    vec3 gray = vec3(0.4587381755096547);

    vec3 linearResult = mix(gray, p3_color, alpha);
    vec3 real_p3 = p3_color/whitepoint_scale;
    bool cubeVisible = (mode == 7) ||
        (mode == 8) ||
        (mode == 9);
    if ((clamp(real_p3,0.,1.) == real_p3) && cubeVisible) {
        linearResult = p3_color/whitepoint_scale;
    }

    /*
    vec3 xyY_color = XYZ_to_xyY(xyz_color);
    vec3 XXXXX = XYZ_to_p3*xyY_to_XYZ(vec3(xyY_color.xy, 1.0));
    if ((min(min(XXXXX.x, XXXXX.y),XXXXX.z) > 0.0) && ((min(min(real_p3.x, real_p3.y),real_p3.z) < 0.0) || (max(max(real_p3.x, real_p3.y),real_p3.z) > 1.0))) {
        linearResult = vec3(vary(0.,1.,time/100.),vary(0.,1.,time/100. + 3.14*2./3.),vary(0.,1.,time/100. + 3.14*4./3.));
        linearResult = (2. * p3_color - mix(p3_color, XXXXX, 0.5)) / whitepoint_scale;
    }*/

    gl_FragColor.rgb = srgb_transfer_function(linearResult);
    gl_FragColor.a = 1.;
}

void paint_RGB1931_cloud() {
    vec3 p3_color = XYZ_to_p3*xyz_color;
    float alpha = 0.717955252861182;
    vec3 gray = vec3(0.6260300163584603);
    vec3 fullyHighlightedColor = mix(gray, p3_color, alpha);

    vec3 linearResult = fullyHighlightedColor;

    if (!bool(unaffected)) {
        vec3 alphas = oldGetAlphas(XYZ_to_RGB1931*xyz_color, ideal);
        //vec3 alphas = getAlphas(XYZ_to_RGB1931*xyz_color, ideal);
        //alphas = mix(alphas, vec3(1.0), pow((sin(time/750.) + 1.)/2.,4.));
        vec3 rgb1931DisplayableBlack = XYZ_to_RGB1931*p3_to_XYZ*mix(gray, vec3(0.), alpha);
        vec3 rgb1931FullyHighlightedColor = XYZ_to_RGB1931*p3_to_XYZ*fullyHighlightedColor;
        linearResult = XYZ_to_p3*RGB1931_to_XYZ*mix(rgb1931DisplayableBlack, rgb1931FullyHighlightedColor, alphas);
    }

    gl_FragColor.rgb = srgb_transfer_function(linearResult);
    gl_FragColor.a = 1.;
}

void main() {

    switch (mode) {
        case 0:
        case 1: paint_RGB1931_cloud(); break;
        case 2:
        case 3:
        case 4:
        case 5:
        case 6:
        case 7:
        case 8:
        case 9: paint_complement_cloud(); break;
        case 10: paint_RGB1931_cloud(); break;
    }

}