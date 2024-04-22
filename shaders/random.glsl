float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898,78.233))) * 43758.5453);
}

vec3 randomizer(vec3 starter, float time, bool edge) {
    float r1 = rand(vec2(starter.x * 1502.13, starter.y * 232.82 + starter.z * 800.1));
    float r2 = rand(vec2(starter.y * 545.36, starter.z * 646.2 + r1 * 250.));
    float r3 = rand(vec2(starter.x * 1408.33, starter.z * 257.9 + r2 * 630.));

    float speed = 1./500.;

    float p1 = ((0.5 + 1.5 * r1) * sin((0.5 + 1.5 * r2) * time * speed + 150.*rand(vec2(starter.x * 100.2 + 50. * r1, starter.y * 17.6))) / 2. + 1.0) / 2.;
    float p2 = ((0.5 + 1.5 * r2) * sin((0.5 + 1.5 * r3) * time * speed + 276.*rand(vec2(starter.y * 256.4 + 67.8 * r2, starter.z * 179.5))) / 2. + 1.0) / 2.;
    float p3 = ((0.5 + 1.5 * r3) * sin((0.5 + 1.5 * r1) * time * speed + 2039.*rand(vec2(starter.z * 98.3 + 98. * r3, starter.x * 290.5))) / 2. + 1.0) / 2.;

    if (edge) {
        speed = 1./10000.;

        p1 = (2. * sin((0.5 + 1.5 * r2) * time * speed + 150.*rand(vec2(starter.x * 100.2 + 50. * r1, starter.y * 17.6))) / 2. + 1.0) / 2.;
        p2 = (2. * sin((0.5 + 1.5 * r3) * time * speed + 276.*rand(vec2(starter.y * 256.4 + 67.8 * r2, starter.z * 179.5))) / 2. + 1.0) / 2.;
        p3 = (2. * sin((0.5 + 1.5 * r1) * time * speed + 2039.*rand(vec2(starter.z * 98.3 + 98. * r3, starter.x * 290.5))) / 2. + 1.0) / 2.;
    }

    return vec3(p1,p2,p3);
}

vec3 randomizer2(vec3 starter, float time, bool edge) {
    float r1 = rand(vec2(starter.x * 1502.13, starter.y * 232.82 + starter.z * 800.1));
    float r2 = rand(vec2(starter.y * 545.36, starter.z * 646.2 + r1 * 250.));
    float r3 = rand(vec2(starter.x * 1408.33, starter.z * 257.9 + r2 * 630.));

    float speed = 1./500.;

    float p1 = ((0.5 + 1.5 * r1) * sin((0.5 + 1.5 * r2) * time * speed / 5. + 150.*rand(vec2(starter.x * 100.2 + 50. * r1, starter.y * 17.6))) / 2. + 1.0) / 2.;
    float p2 = ((0.5 + 1.5 * r2) * sin((0.5 + 1.5 * r3) * time * speed + 276.*rand(vec2(starter.y * 256.4 + 67.8 * r2, starter.z * 179.5))) / 2. + 1.0) / 2.;
    float p3 = ((0.5 + 1.5 * r3) * sin((0.5 + 1.5 * r1) * time * speed + 2039.*rand(vec2(starter.z * 98.3 + 98. * r3, starter.x * 290.5))) / 2. + 1.0) / 2.;

    if (edge) {
        speed = 1./10000.;

        //p1 = (2. * sin((0.5 + 1.5 * r2) * time * speed + 150.*rand(vec2(starter.x * 100.2 + 50. * r1, starter.y * 17.6))) / 2. + 1.0) / 2.;
        p2 = (2. * sin((0.5 + 1.5 * r3) * time * speed + 276.*rand(vec2(starter.y * 256.4 + 67.8 * r2, starter.z * 179.5))) / 2. + 1.0) / 2.;
        p3 = (2. * sin((0.5 + 1.5 * r1) * time * speed + 2039.*rand(vec2(starter.z * 98.3 + 98. * r3, starter.x * 290.5))) / 2. + 1.0) / 2.;
    }

    return vec3(p1,p2,p3);
}


float stable_randomizer(vec3 starter) {
    float r1 = rand(vec2(starter.x * 1502.13, starter.y * 232.82 + starter.z * 800.1));
    float r2 = rand(vec2(starter.y * 545.36, starter.z * 646.2 + r1 * 250.));
    float r3 = rand(vec2(starter.x * 1408.33, starter.z * 257.9 + r2 * 630.));

    float p1 = rand(vec2(starter.x * 100.2 + 50. * r1, starter.y * 17.6));
    float p2 = rand(vec2(starter.y * 256.4 + 67.8 * r2, starter.z * 179.5));
    float p3 = rand(vec2(starter.z * 98.3 + 98. * r3, starter.x * 290.5));

    return rand(vec2(89.8*p1,rand(vec2(107.9*p2,56.03*p3))));
}