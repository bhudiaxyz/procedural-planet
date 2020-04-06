precision highp float;

uniform vec3 lightPosition;
uniform vec4 lightColor;
uniform float lightIntensity;
uniform float time;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vPosition01;
varying vec3 lightDirection;

void main(void) {
    vUv = uv;
    vPosition01 = normalize(position)/2.0 + vec3(0.5, 0.5, 0.5);
    vPosition = position;
    lightDirection = normalize(lightPosition - vPosition);
    vNormal = normal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
