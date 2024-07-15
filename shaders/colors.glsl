#define M_PI 3.1415926535897932384626433832795
//#define MATCH_TYPE(x, y) (step(x, x) * y)
//#define srgb_transfer_function(x) (step(.0031308, x) * (1.055 * pow(x, MATCH_TYPE(x,.4166666666666667)) - 0.055 - 12.92 * x) + 12.92 * x)

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

vec3 XYZ_to_xyY(vec3 c) {
    return vec3(c.x / (c.x + c.y + c.z),
        c.y / (c.x + c.y + c.z),
        c.y);
}

vec3 xyY_to_XYZ(vec3 c) {
    return vec3(c.x * c.z / c.y,
        c.z,
        (1. - c.x - c.y) * c.z / c.y);
}

float vary(float a, float b, float freq) {
    return mix(a, b, sin(freq) / 2. + 0.5);
}

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



float unpackUint8ToFloat(vec4 value) {
    int intBits = int(value.r * 255.0) << 24 |
                  int(value.g * 255.0) << 16 |
                  int(value.b * 255.0) << 8 |
                  int(value.a * 255.0);
    return intBitsToFloat(intBits);
}

// this is necessary because the automatic linear filtering in the javascript seems to have some issues with packed textures
vec3 linearFilterPackedTexture(sampler2D x, sampler2D y, sampler2D z, vec2 uv, float width) {

    float widthAdjusted = width - 1.0;

    float alpha = fract(uv.x * widthAdjusted);
    vec2 left = vec2(uv.x - alpha / widthAdjusted, uv.y);
    vec2 right = vec2(uv.x + (1. - alpha) / widthAdjusted, uv.y);

    vec3 leftPixel = vec3(unpackUint8ToFloat(texture2D(x, left)),
        unpackUint8ToFloat(texture2D(y, left)),
        unpackUint8ToFloat(texture2D(z, left)));

    vec3 rightPixel = vec3(unpackUint8ToFloat(texture2D(x, right)),
        unpackUint8ToFloat(texture2D(y, right)),
        unpackUint8ToFloat(texture2D(z, right)));

    return mix(leftPixel, rightPixel, alpha);
}

vec3 make_displayable(vec3 P3_Linear_color, vec2 coord, float time) {

    vec3 displayableColor = srgb_transfer_function(P3_Linear_color);

    vec3 colorLinear = srgb_transfer_function_inv(displayableColor);
    vec3 floors = floor(255. * displayableColor) / 255.;
    vec3 floorsLinear = srgb_transfer_function_inv(floors);
    vec3 ceils = ceil(255. * displayableColor) / 255.;
    vec3 ceilsLinear = srgb_transfer_function_inv(ceils);
    vec3 thresholds = (P3_Linear_color - floorsLinear) / (ceilsLinear - floorsLinear);
    vec3 rands = randomizer3(vec3(coord, rand(coord)), time);

    vec3 ditheredColor = vec3(0.);
    if (rands.r < thresholds.r) {ditheredColor.r = ceils.r;}
    else {ditheredColor.r = floors.r;}
    if (rands.g < thresholds.g) {ditheredColor.g = ceils.g;}
    else {ditheredColor.g = floors.g;}
    if (rands.b < thresholds.b) {ditheredColor.b = ceils.b;}
    else {ditheredColor.b = floors.b;}

    return ditheredColor;
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