precision highp float;

uniform float time;
uniform vec4 lightColor;
uniform float lightIntensity;
uniform vec3 baseColor;
uniform float resolution;
uniform float rangeFactor;
uniform float smoothness;
uniform float seed;

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 lightDirection;

const float PI = 3.14159265358979323846264;

int mod(int x, int m) {
    return int(mod(float(x), float(m)));
}

float random5(vec3 co) {
    return fract(sin(dot(co.xyz, vec3(12.9898, 78.233, 1.23456))) * (5356.5453+ seed*1234.7582));
}

float random4(float x, float y, float z) {
    return random5(vec3(x, y, z));
}

float random4(int x, int y, int z) {
    return random4(float(x), float(y), float(z));
}

float interpolation(float a, float b, float x) {
    float ft = x * PI;
    float f = (1.0 - cos(ft)) * 0.5;
    return a*(1.0-f) + b*f;
}

float tricosine(vec3 coordFloat) {
    vec3 coord0 = vec3(floor(coordFloat.x), floor(coordFloat.y), floor(coordFloat.z));
    vec3 coord1 = vec3(coord0.x+1.0, coord0.y+1.0, coord0.z+1.0);
    float xd = (coordFloat.x - coord0.x)/max(1.0, (coord1.x - coord0.x));
    float yd = (coordFloat.y - coord0.y)/max(1.0, (coord1.y - coord0.y));
    float zd = (coordFloat.z - coord0.z)/max(1.0, (coord1.z - coord0.z));
    float c00 = interpolation(random4(coord0.x, coord0.y, coord0.z), random4(coord1.x, coord0.y, coord0.z), xd);
    float c10 = interpolation(random4(coord0.x, coord1.y, coord0.z), random4(coord1.x, coord1.y, coord0.z), xd);
    float c01 = interpolation(random4(coord0.x, coord0.y, coord1.z), random4(coord1.x, coord0.y, coord1.z), xd);
    float c11 = interpolation(random4(coord0.x, coord1.y, coord1.z), random4(coord1.x, coord1.y, coord1.z), xd);
    float c0 = interpolation(c00, c10, yd);
    float c1 = interpolation(c01, c11, yd);
    float c = interpolation(c0, c1, zd);

    return c;
}

float nearestNeighbour(vec3 coordFloat) {
    return random4(int(floor(coordFloat.x)), int(floor(coordFloat.y)), int(floor(coordFloat.z)));
}

float helper(float x, float y, float z, float resolution, vec3 offset) {
    x = offset.x + (x+1.0)/2.0*resolution;
    y = offset.y + (y+1.0)/2.0*resolution;
    z = offset.z + (z+1.0)/2.0*resolution;

    vec3 coordFloat = vec3(x, y, z);
    float interpolated = tricosine(coordFloat);
    //float interpolated = nearestNeighbour(coordFloat);
    return interpolated;
}

vec3 scalarField(float x, float y, float z, float smoothness) {
    float c = 0.0;
    float amp = 0.56;
    float speed = 3.0;
    for (int l = 6; l > 0; l--) {
        float res = resolution/pow(2.0, float(l));
        float level = helper(x, y, z, res, vec3(sin(time*speed)*5.0, cos(time*speed)*5.0, time*speed));
        c += level*amp;
        amp/=smoothness;
    }
    if (c > 0.0) c *= 1.15;

    c = clamp(c, 0.0, 1.0);

    return vec3(c, c, c);
}

const float threshold = 0.75;

void main() {
    vec3 np = normalize(vPosition);
    vec3 grad = scalarField(np.x, np.y, np.z, smoothness);
    vec3 col = vec3(baseColor) +  (grad-0.5)/rangeFactor;
    vec4 color = vec4(col, 1.0);

    float a = max(0.1, dot(vNormal, lightDirection))*lightIntensity/2.0;

    vec4 finalColor = lightColor * color * a;
    float densityFactor = 1.2;// this value should be > 1.0
    float alpha = (color.r-threshold)/(1.0-threshold)*densityFactor;
    gl_FragColor = vec4(finalColor.rgb, alpha);
}
