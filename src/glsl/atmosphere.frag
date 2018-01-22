precision highp float;

uniform vec3 lightPosition;
uniform vec4 lightColor;
uniform float lightIntensity;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vPosition01;
varying vec3 lightDirection;

void main(void)
{
    float reflect = pow( 0.8 - dot( vNormal, vec3(0.0, 0.0, 1.0) ), 8.0 );
    float a = max(0.0, dot(vNormal, lightDirection))*lightIntensity*1.5;
    vec4 color = vec4(0.078, 0.227, 0.341,0.9);
    gl_FragColor = color * reflect * a;
}