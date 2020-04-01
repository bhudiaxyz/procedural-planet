precision highp float;

uniform sampler2D texWater;
uniform sampler2D texSand;
uniform sampler2D texGrass;
uniform sampler2D texStone;
uniform sampler2D texSnow;
uniform vec3 lightPosition;
uniform vec4 lightColor;
uniform float lightIntensity;
uniform float radius;
uniform float roughness;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vReflect;
varying vec3 vPosition;
varying vec3 vPosition01;
varying vec3 vNewPosition;
varying float displacement;
varying vec3 lightDirection;

float random(vec3 scale, float seed){ return fract(sin(dot(gl_FragCoord.xyz+seed, scale))*43758.5453+seed); }

void main(void)
{
    vec3 blending = abs(vNormal);
    blending = (blending - 0.25) * 8.0;
    blending = max(blending, 0.0);// Force weights to sum to 1.0
    float b = (blending.x + blending.y + blending.z);
    blending /= vec3(b, b, b);

    vec4 vec_waterx = texture2D(texWater, vPosition01.yz);
    vec4 vec_watery = texture2D(texWater, vPosition01.xz);
    vec4 vec_waterz = texture2D(texWater, vPosition01.xy);

    vec4 vec_sandx = texture2D(texSand, vPosition01.yz);
    vec4 vec_sandy = texture2D(texSand, vPosition01.xz);
    vec4 vec_sandz = texture2D(texSand, vPosition01.xy);

    vec4 vec_grassx = texture2D(texGrass, vPosition01.yz);
    vec4 vec_grassy = texture2D(texGrass, vPosition01.xz);
    vec4 vec_grassz = texture2D(texGrass, vPosition01.xy);

    vec4 vec_stonex = texture2D(texStone, vPosition01.yz);
    vec4 vec_stoney = texture2D(texStone, vPosition01.xz);
    vec4 vec_stonez = texture2D(texStone, vPosition01.xy);

    vec4 vec_snowx = texture2D(texSnow, vPosition01.yz);
    vec4 vec_snowy = texture2D(texSnow, vPosition01.xz);
    vec4 vec_snowz = texture2D(texSnow, vPosition01.xy);

    vec4 vec_water = vec_waterx * blending.x + vec_watery * blending.y + vec_waterz * blending.z;
    vec4 vec_sand = vec_sandx * blending.x + vec_sandy * blending.y + vec_sandz * blending.z;
    vec4 vec_grass = vec_grassx * blending.x + vec_grassy * blending.y + vec_grassz * blending.z;
    vec4 vec_stone = vec_stonex * blending.x + vec_stoney * blending.y + vec_stonez * blending.z;
    vec4 vec_snow = vec_snowx * blending.x + vec_snowy * blending.y + vec_snowz * blending.z;

    float vMax = roughness * radius;
    float offset = length(vNewPosition) - radius;
    vec4 color = vec_water;// begin with water everywhere
    color = mix(vec_sand, color, smoothstep(vMax*0.035, vMax*0.025, offset));
    color = mix(vec_grass, color, smoothstep(vMax*0.29, vMax*0.035, offset));
    color = mix(vec_stone, color, smoothstep(vMax*0.423, vMax*0.29, offset));
    color = mix(vec_snow, color, smoothstep(vMax, vMax*0.423, offset));

    // simpliest hardcoded lighting
    float c = max(0.1, dot(vNormal, lightDirection))* lightIntensity;
    gl_FragColor = vec4(color.r*c, color.g*c, color.b*c, 1.0)*lightColor;
}
