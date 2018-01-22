
// Require as many or as little as you need:
// #pragma glslify: snoise2 = require(glsl-noise/simplex/2d)
// #pragma glslify: snoise3 = require(glsl-noise/simplex/3d)
// #pragma glslify: snoise4 = require(glsl-noise/simplex/4d)

// #pragma glslify: cnoise2 = require(glsl-noise/classic/2d)
// #pragma glslify: cnoise3 = require(glsl-noise/classic/3d)
// #pragma glslify: cnoise4 = require(glsl-noise/classic/4d)

// #pragma glslify: pnoise2 = require(glsl-noise/periodic/2d)
// #pragma glslify: pnoise3 = require(glsl-noise/periodic/3d)
// #pragma glslify: pnoise4 = require(glsl-noise/periodic/4d)

#pragma glslify: pnoise3 = require(glsl-noise/periodic/3d)

const vec3 turbulenceVec3 = vec3( 10.0, 10.0, 10.0 );

float turbulence( vec3 p ) {
  float w = 100.0;
  float t = -.5;
  for (float f = 1.0 ; f <= 10.0 ; f++ ){
    float power = pow( 2.0, f );
    t += abs( pnoise3( vec3( power * p ), turbulenceVec3 ) / power );
  }
  return t;
}

#pragma glslify: export(turbulence)
