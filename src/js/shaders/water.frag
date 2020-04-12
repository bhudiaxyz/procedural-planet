precision highp float;

uniform sampler2D texWater;
uniform float radius;
uniform vec3 lightPosition;
uniform vec4 lightColor;
uniform float lightIntensity;
uniform float time;

varying vec2 vUv;
varying vec3 vPosition01;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 lightDirection;


vec4 getNormal(vec2 uv, float speed) {
    float scaleFactor = 0.06;
    float sint = sin(time*speed)*scaleFactor/2.0;
    float cost = cos(time*speed)*scaleFactor/3.0;

    float x1 = uv.x + sint;
    float y1 = uv.y + cost;

    float x2 = uv.x - sint;
    float y2 = uv.y - cost;

    float x3 = uv.x - sint;
    float y3 = uv.y + cost;

    float x4 = uv.x + sint;
    float y4 = uv.y - cost;

    vec4 normal = texture2D(texWater, vec2(x1, y2)) + texture2D(texWater, vec2(x2, y2)) +
    texture2D(texWater, vec2(x3, y3)) + texture2D(texWater, vec2(x4, y4));
    normal.xyz = normal.xyz/3.74;
    return normal;
}

void main(void)
{
    vec3 blending = abs(vNormal);
    blending = (blending - 0.2) * 7.14;
    blending = max(blending, 0.0);// Force weights to sum to 1.0
    float b = (blending.x + blending.y + blending.z);
    blending /= vec3(b, b, b);

    vec4 vec_texx = getNormal(vPosition01.yz, 30.0);
    vec4 vec_texy = getNormal(vPosition01.xz, 32.0);
    vec4 vec_texz = getNormal(vPosition01.xy, 34.0);

    vec4 normalTex = vec_texx * blending.x + vec_texy * blending.y + vec_texz * blending.z;

    float a = max(0.214, dot(((normalTex.rgb*2.0-1.0)+vNormal)/2.0, lightDirection));

    vec4 color = vec4(0.0, 0.2921, 0.46, 1.0);
    color.xyz = color.xyz*lightIntensity;

    vec4 finalColor = lightColor*color*a;

    gl_FragColor = vec4(finalColor.xyz, 0.75);
}
