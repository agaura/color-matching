vec3 position_xyz(vec3 coord, float scale) {
    vec3 chromaticity_coord = coord/(coord.x+coord.y+coord.z);
    chromaticity_coord.z = 0.;
    vec3 placement = 1.5*(rotateX(M_PI/2.)*rotateZ(0.304*M_PI)*rotateX(M_PI/4.)*scale*coord).zxy-vec3(0.,1.3*scale,.0);
    return placement;

    /*
    float chromaticity_scale = 2.5*scale;
    vec3 chromaticity_placement = (rotateY(M_PI/2.)*rotateX(M_PI/2.)*(chromaticity_scale)*(chromaticity_coord)).zxy-vec3(.33*chromaticity_scale,.33*chromaticity_scale,0.);
    return chromaticity_placement;*/
}

vec3 push_into_displayable_XYZ_cloud(sampler2D spectrum, vec3 distribution) {

    // send distribution coordinates into cloud coordinates
    vec3 v = texture(spectrum, vec2(distribution.x, 0.5)).rgb;

    // this one I think is actually prettier when you remove the belt
    vec3 new_coord = mix(v, vec3(distribution.y), pow(distribution.z,2.));

    return new_coord;
}

// takes a cube of points and returns the cube but with the points moving in a cloud
vec3 cubic_cloud_distribute(vec3 pos, float time) {
    // freedom of movement for each particle
    float strength = 1./16.;
    float r = stable_randomizer(pos);
    bool edge = false;
    if (r < 0.25) {
        strength = 1.;
        edge = true;
    }

    // actual placement
    return mix(pos.xyz, (randomizer(pos, time, edge)), strength);
    /*
    if (!order) return mix(pos.xyz, (randomizer(pos, time, edge)), strength);
    else return pos.xyz; // multiplying new_pos by 65./64. seems very desirable, but there's something wonky with the colorblindness types
    */
}

vec3 cubic_cloud_distribute2(vec3 pos, float time) {
    // freedom of movement for each particle
    float strength = 1./16.;
    float r = stable_randomizer(pos);
    bool edge = false;
    if (r < 0.25) {
        strength = 1.;
        edge = true;
    }

    // actual placement
    vec3 new_point = randomizer2(pos, time, edge);
    return mod(vec3(stable_randomizer(pos),0.,0.) + mix(pos.xyz, new_point, strength), 1.);

    /*
    if (!order) {
        vec3 new_point = randomizer2(pos, time, edge);
        return mod(vec3(stable_randomizer(pos),0.,0.) + mix(pos.xyz, new_point, strength), 1.);
        }
    else return pos.xyz; // multiplying new_pos by 65./64. seems very desirable, but there's something wonky with the colorblindness types
    */
}

float rebound(float c, float low, float high) {
    return (high - low) * c + low;
}