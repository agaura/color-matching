vec3 properly_position(vec3 coord, float scale) {
    vec3 chromaticity_coord = coord/(coord.x+coord.y+coord.z);
    chromaticity_coord.z = 0.;
    vec3 placement = 1.5*(rotateX(M_PI/2.)*rotateZ(0.304*M_PI)*rotateX(M_PI/4.)*scale*coord).zxy-vec3(0.,1.3*scale,.0);
    return placement;

    /*
    float chromaticity_scale = 2.5*scale;
    vec3 chromaticity_placement = (rotateY(M_PI/2.)*rotateX(M_PI/2.)*(chromaticity_scale)*(chromaticity_coord)).zxy-vec3(.33*chromaticity_scale,.33*chromaticity_scale,0.);
    return chromaticity_placement;*/
}

vec3 properly_position_matching(vec3 coord, float scale) {
    vec3 chromaticity_coord = coord/(coord.x+coord.y+coord.z);
    chromaticity_coord.z = 0.;
    vec3 placement = 1.*(rotateX(M_PI/2.)*rotateZ(0.304*M_PI)*rotateX(M_PI/4.)*scale*coord).zxy-vec3(0.,0.,.0);
    return placement;

    /*
    float chromaticity_scale = 2.5*scale;
    vec3 chromaticity_placement = (rotateY(M_PI/2.)*rotateX(M_PI/2.)*(chromaticity_scale)*(chromaticity_coord)).zxy-vec3(.33*chromaticity_scale,.33*chromaticity_scale,0.);
    return chromaticity_placement;*/
}

vec3 properly_position_chromaticity(vec3 coord, float scale) {
    vec3 chromaticity_coord = coord/(coord.x+coord.y+coord.z);
    chromaticity_coord.z = 0.;
    float chromaticity_scale = 2.5*scale;
    vec3 chromaticity_placement = (rotateY(M_PI/2.)*rotateX(M_PI/2.)*(chromaticity_scale)*(chromaticity_coord)).zxy-vec3(.33*chromaticity_scale,.33*chromaticity_scale,0.);
    return chromaticity_placement;
}

vec3 push_into_displayable_XYZ_cloud(sampler2D spectrum, vec3 distribution) {

    // send distribution coordinates into cloud coordinates
    vec3 v = texture(spectrum, vec2(distribution.x, 0.5)).rgb;

    // this one I think is actually prettier when you remove the belt
    vec3 new_coord = mix(v, vec3(distribution.y), pow(distribution.z,1.));

    return new_coord;
}

float adjustDensity(float x, float A_prime, float B_prime, float S) {
    // Calculate A and B from A_prime and B_prime
    float B = (B_prime - A_prime) / S + A_prime * (1.0 - (1.0 - S) * (B_prime - A_prime));
    float A = A_prime * (1.0 - (1.0 - S) * (B - A_prime));

    // Implement the piecewise function
    if (x < A) {
        return (A_prime / A) * x;
    } else if (x < B) {
        return A_prime + S * (x - A);
    } else {
        return B_prime + (1.0 - B_prime) / (1.0 - B) * (x - B);
    }
}

float spread(float x, float a, float b) {

    float p = 1.5;

    if (x > a) {
        if (x < b) {
            float new_x = (x - a) / (b - a);

            if (new_x < 0.5) {
                new_x = pow((new_x * 2.0), p) / 2.0;
            }
            else {
                new_x = 1. - pow((1.0 - (new_x - 0.5) * 2.0), p) / 2.0;
            }

            new_x = new_x * (b - a) + a;
            new_x = mix(x, new_x, 1.0-(1./(b-a))*distance(x, (b + a)/ 2.));
            return new_x;
        }
    }

    return x;
}

// works well with distribution.z to remove the black-white pole
float spread2(float x, float a, float b) {

    float p = .25;

    if (x > a) {
        if (x < b) {
            float new_x = (x - a) / (b - a);

            if (new_x < 0.5) {
                new_x = pow((new_x * 2.0), p) / 2.0;
            }
            else {
                new_x = 1. - pow((1.0 - (new_x - 0.5) * 2.0), p) / 2.0;
            }

            new_x = new_x * (b - a) + a;
            new_x = mix(x, new_x, 1.0-(1./(b-a))*distance(x, (b + a)/ 2.));
            return new_x;
        }
    }

    return x;
}

vec3 push_into_displayable_XYZ_cloud2(sampler2D x, sampler2D y, sampler2D z, vec3 distribution, float width) {

    // this is just to prevent the bowtie pattern in the chromaticity diagram
    float redistribution = distribution.x * 2.0;
    float a1 = 0.002*2.;
    float a2 = 0.137*2.;
    float addit = floor(redistribution);
    redistribution = redistribution - addit;
    redistribution = adjustDensity(redistribution, a1, a2, 0.675) + addit;
    redistribution = redistribution / 2.;

    /*
    redistribution = spread(redistribution, 0.0, (0.143 + 0.5)/2.);
    redistribution = spread(redistribution, (0.143 + 0.5)/2., 0.5 + 0.143);
    redistribution = spread(redistribution, 0.5 + 0.143, 1.);*/

    // send distribution coordinates into cloud coordinates
    vec3 v = linearFilterPackedTexture(x, y, z, vec2(redistribution, 0.5), width);

    // this one I think is actually prettier when you remove the belt
    vec3 new_coord = mix(v, vec3(distribution.y), pow(distribution.z,1.));

    return new_coord;
}

// takes a cube of points and returns the cube but with the points moving in a cloud
vec3 cubic_cloud_distribute(vec3 pos, float time) {
    // freedom of movement for each particle
    float strength = 1./16.;
    float r = stable_randomizer(pos);
    bool edge = false;
    if (r < 0.5) {
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
    if (r < 0.5) {
        strength = 1.;
        edge = true;
    }

    // actual placement
    vec3 new_point = randomizer(pos, time, edge);
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