varying vec3 xyz_color;
varying float unaffected;
uniform int mode;
uniform vec3 ideal;
uniform float time;
uniform int cloudID;
uniform sampler2D spectrumLookup;

void place_complement_cloud() {

    xyz_color = position;
    //xyz_color = vec3(0.0); // to essentially remove the belt
    gl_PointSize = 5.*(sin(time/1000.) + 1.) + 1.;
    gl_PointSize = 1.;

    // showing the color clouds, sourced from a set of shrunken points to easily differentiate from the belt
    vec3 new_position = position;

    // place one set of the points into the sRGB portion of the cloud
    if (cloudID == 2) {
        
        float whitepoint_scale = 0.916;
        xyz_color = whitepoint_scale*sRGB_to_XYZ*cubic_cloud_distribute(new_position, time);

        //gl_PointSize = 2.*(sin(time/250.)/2.+0.5);

    }

    // place one set of the points into the p3 portion of the cloud
    else if (cloudID == 1) {

        float whitepoint_scale = 0.916;
        xyz_color = whitepoint_scale*p3_to_XYZ*cubic_cloud_distribute(new_position, time);

        //gl_PointSize = 2.*(sin(time/250.)/2.+0.5);
    }

    // else put it in the general portion of the cloud;
    else {
        xyz_color = push_into_displayable_XYZ_cloud(spectrumLookup, cubic_cloud_distribute2(position, time));

        //gl_PointSize = 2.*(sin(time/250.)/2.+0.5);
    }

    vec4 correctedPosition = vec4(position_xyz(XYZ_to_RGB1931*xyz_color,0.62), 1.0);
    //vec4 correctedPosition = vec4(position_xyz(xyz_color, 1.0), 0.9);
    gl_Position = projectionMatrix * modelViewMatrix * correctedPosition;

}

void place_RGB1931_cloud() {

    vec3 new_position = position;

    if (cloudID != 0) {new_position *= 0.;}

    new_position = cubic_cloud_distribute(new_position, time);
    new_position = vec3(rebound(new_position.x, -0.493152501716165, 2.1230881684358494),
        rebound(new_position.y, 0.0, 1.2081507310237678),
        rebound(new_position.z, 0.0, 1.9537069391779407)) / 2.1230881684358494;
    
    xyz_color = RGB1931_to_XYZ*new_position;

    gl_PointSize = max(1.,pow(length(getAlphas(XYZ_to_RGB1931*xyz_color, ideal)),2.5)*10.);

    unaffected = float(false);

    vec4 correctedPosition = vec4(position_xyz(new_position,0.95), 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * correctedPosition;

}

void full_spectrum() {

    vec3 new_position = position;

    // XXXXX this probably should be modified later
    new_position *= 0.;

    vec4 correctedPosition = vec4(position_xyz(new_position,0.95), 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * correctedPosition;

}

void main() {

    switch (mode) {
        case 0: place_RGB1931_cloud(); break;
        case 1: full_spectrum(); break;
        case 2: place_complement_cloud(); break;
        //case 1: place_complement_cloud(); break;
    }
}
