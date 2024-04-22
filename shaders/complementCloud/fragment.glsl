varying vec3 xyz_color;
varying float unaffected;
uniform int mode;
uniform float time;
uniform vec3 ideal;

void paint_complement_cloud() {

    vec3 p3_color = XYZ_to_p3*xyz_color;
    float whitepoint_scale = 0.916;
    float alpha = 0.38465664131947086;
    vec3 gray = vec3(0.3277935806611292);

    vec3 linearResult = mix(gray, p3_color, alpha);
    if (clamp(p3_color/whitepoint_scale,0.,1.) == p3_color/whitepoint_scale) {
        linearResult = p3_color/whitepoint_scale;
    }

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
        vec3 alphas = getAlphas(XYZ_to_RGB1931*xyz_color, ideal);
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
        case 2: paint_complement_cloud(); break;
    }

}