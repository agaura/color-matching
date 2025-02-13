varying vec3 xyz_color;
varying float unaffected;
uniform int mode;
uniform vec3 ideal;
uniform float time;
uniform sampler2D spectrumLookup;

void place_complement_cloud() {

    xyz_color = position;
    //xyz_color = vec3(0.0); // to essentially remove the belt
    gl_PointSize = 5.*(sin(time/1000.) + 1.) + 1.;
    gl_PointSize = 5.;

    xyz_color /= 2.1230881684358494;

    vec4 correctedPosition = vec4(properly_position(XYZ_to_RGB1931*xyz_color,0.62), 1.0);
    //vec4 correctedPosition = vec4(properly_position(xyz_color, 1.0), 0.9);
    gl_Position = projectionMatrix * modelViewMatrix * correctedPosition;

}

void place_RGB1931_cloud() {

    vec3 new_position = position;

    //new_position *= 1.*(sin(time/1345.*2. + 100.*stable_randomizer(new_position))/2. + 0.5);
    new_position /= 1.965183286767108;
    //new_position = new_position/length(XYZ_to_RGB1931*new_position) * 0.4*(sin(time/1345.*2. + 100.*stable_randomizer(new_position))/2. + 0.5);
    //new_position = new_position/dot(XYZ_to_RGB1931*new_position, vec3(1.)) * 0.4*(sin(time/1345.*2. + 100.*stable_randomizer(new_position))/2. + 0.5);
    xyz_color = new_position;

    new_position = XYZ_to_RGB1931*new_position;
    gl_PointSize = 20.*(sin(time/500.)/2.+0.5);
    //gl_PointSize = 30.*(sin(time/500.)/2.+0.5);

    unaffected = float(true);

    vec4 correctedPosition = vec4(properly_position(new_position,0.95), 1.0);
    //vec4 correctedPosition = vec4(properly_position_matching(new_position,0.95), 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * correctedPosition;

}

// I don't think this is doing anything right now
void full_spectrum() {

    vec3 new_position = position;

    // for adjusting the spectral points properly
    //new_position *= 1.*(sin(time/1345.*2. + 100.*stable_randomizer(new_position))/2. + 0.5);
    new_position /= 2.1230881684358494;
    //new_position = new_position/length(XYZ_to_RGB1931*new_position) * 0.4*(sin(time/1345.*2. + 100.*stable_randomizer(new_position))/2. + 0.5);
    new_position = new_position/dot(XYZ_to_RGB1931*new_position, vec3(1.)) * 0.48*(sin(time/1345.*2. + 100.*stable_randomizer(new_position))/2. + 0.5);
    //new_position = new_position/dot(XYZ_to_RGB1931*new_position, vec3(1.))*0.48;
    //new_position *= (sin(time/1000. + length(new_position)*time/2000.) + sin(time/1234. + length(new_position)*time/1973.))/4.+0.5;
    xyz_color = new_position;

    new_position = XYZ_to_RGB1931*new_position;
    gl_PointSize = 2.;

    unaffected = float(true);

    vec4 correctedPosition = vec4(properly_position(new_position,0.95), 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * correctedPosition;

}

void main() {

    switch (mode) {
        case 0:
        case 1: place_RGB1931_cloud(); break;
        case 2: 
        case 3:
        case 4:
        case 5:
        case 6:
        case 7:
        case 8:
        case 9: place_complement_cloud(); break;
        case 10: full_spectrum(); break;
        //case 1: place_complement_cloud(); break;
    }
}