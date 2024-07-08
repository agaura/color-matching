#define M_PI 3.1415926535897932384626433832795

float srgb_transfer_function(float a)
{
    return .0031308f >= a ? 12.92f * a : 1.055f * pow(a, .4166666666666667f) - .055f;
}

vec3 srgb_transfer_function(vec3 a)
{
    return vec3(srgb_transfer_function(a.x),
        srgb_transfer_function(a.y),
        srgb_transfer_function(a.z));
}

float srgb_transfer_function_inv(float a)
{
    return .04045f < a ? pow((a + .055f) / 1.055f, 2.4f) : a / 12.92f;
}

vec3 srgb_transfer_function_inv(vec3 a)
{
    return vec3(srgb_transfer_function_inv(a.x),
        srgb_transfer_function_inv(a.y),
        srgb_transfer_function_inv(a.z));
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

mat3 XYZ_to_RGB1931 = transpose(mat3(8041697.,-3049000., -1591847.,
                -1752003., 4851000., 301853.,
                17697., -49000., 3432153.)) / 3400850.;

mat3 RGB1931_to_XYZ = transpose(mat3(0.49,0.31,0.2,
        0.17697,0.8124,0.01063,
        0.0,0.01,0.99));

mat3 sRGB_to_XYZ = transpose(mat3(
    0.4124564,  0.3575761,  0.1804375,
    0.2126729,  0.7151522,  0.0721750,
    0.0193339,  0.1191920,  0.9503041
    ));

// these rotations have to be redone at some point because I believe they need to be transposed
mat3 rotateX(float theta) {
    return mat3(
        1.0, 0., 0.,
        0., cos(theta), -sin(theta),
        0., sin(theta), cos(theta)
    );
}

mat3 rotateY(float theta) {
    return mat3(
        cos(theta), 0., sin(theta),
        0., 1., 0.,
        -sin(theta), 0., cos(theta)
    );
}

mat3 rotateZ(float theta) {
    return mat3(
        cos(theta), -sin(theta), 0.,
        sin(theta), cos(theta), 0.,
        0., 0., 1.
    );
}



float circleFade(float outerR, float innerR, float dist, float p) {
    return pow(clamp((1./(outerR-innerR)) * (outerR - dist),0.,1.),p);
}

vec3 circleFade(float outerR, float innerR, vec3 dist, float p) {
    return pow(clamp((1./(outerR-innerR)) * (outerR - dist),0.,1.),vec3(p));
}

bool alphaCondition(float a, float b) {
    return ((a <= b) && (a >= 0.)) || ((a >= b) && (a <= 0.));
}

float scalarProjection(vec3 v1, vec3 v2) {
    return dot(v1, v2)/dot(v2, v2);
}

float orthogonalDistance(vec3 v1, vec3 v2) {
    return distance(v1, scalarProjection(v1, v2) * v2);
}

bool checkBounds(vec3 v1, vec3 v2) {
    float t = scalarProjection(v1, v2);
    return t > 0. && t < 1.;
}

vec3 oldGetAlphas(vec3 ref, vec3 ideal) {
    vec3 dist = vec3(0.);
    if (alphaCondition(ref.r, ideal.r)) {dist.r = distance(ref.gb, ideal.gb);}
    else {dist.r = distance(ref, ideal);}
    if (alphaCondition(ref.g, ideal.g)) {dist.g = distance(ref.rb, ideal.rb);}
    else {dist.g = distance(ref, ideal);}
    if (alphaCondition(ref.b, ideal.b)) {dist.b = distance(ref.rg, ideal.rg);}
    else {dist.b = distance(ref, ideal);}

    float widthScale = 10.;
    return (1.-clamp(dist*widthScale,0.,1.));
}

vec3 getAlphas(vec3 ref, vec3 ideal) {

    vec3 dist = vec3(0.);
    /*if (alphaCondition(ref.r, ideal.r)) {dist.r = distance(ref.gb, ideal.gb);}
    else {dist.r = distance(ref, ideal);}*/
    if (alphaCondition(ref.r, ideal.r)) {dist.r = distance(ref.gb, ideal.gb);}
    else {dist.r = distance(ref, ideal);}
    if (alphaCondition(ref.g, ideal.g)) {dist.g = distance(ref.rb, ideal.rb);}
    else {dist.g = distance(ref, ideal);}
    if (alphaCondition(ref.b, ideal.b)) {dist.b = distance(ref.rg, ideal.rg);}
    else {dist.b = distance(ref, ideal);}

    if (checkBounds(ref,vec3(ideal.rg,0.))) {
        dist.r = min(orthogonalDistance(ref, vec3(ideal.rg,0.)), dist.r);
        dist.g = min(orthogonalDistance(ref, vec3(ideal.rg,0.)), dist.g);
        }
    else {
        dist.r = min(distance(ref, ideal), dist.r);
        dist.g = min(distance(ref, ideal), dist.g);
        }
    if (checkBounds(ref,vec3(ideal.r,0.,ideal.b))) {
        dist.r = min(orthogonalDistance(ref, vec3(ideal.r,0.,ideal.b)), dist.r);
        dist.b = min(orthogonalDistance(ref, vec3(ideal.r,0.,ideal.b)), dist.b);
        }
    else {
        dist.r = min(distance(ref, ideal), dist.r);
        dist.b = min(distance(ref, ideal), dist.b);
        }
    if (checkBounds(ref,vec3(0.,ideal.gb))) {
        dist.g = min(orthogonalDistance(ref, vec3(0.,ideal.gb)), dist.g);
        dist.b = min(orthogonalDistance(ref, vec3(0.,ideal.gb)), dist.b);
        }
    else {
        dist.g = min(distance(ref, ideal), dist.g);
        dist.b = min(distance(ref, ideal), dist.b);
        }

    if (checkBounds(ref,ideal)) {
        dist.r = min(orthogonalDistance(ref, ideal), dist.r);
        dist.g = min(orthogonalDistance(ref, ideal), dist.g);
        dist.b = min(orthogonalDistance(ref, ideal), dist.b);
        }
    else {
        dist.r = min(distance(ref, ideal), dist.r);
        dist.g = min(distance(ref, ideal), dist.g);
        dist.b = min(distance(ref, ideal), dist.b);
        }

    float widthScale = 10.;
    return (1.-clamp(dist*widthScale,0.,1.));
}