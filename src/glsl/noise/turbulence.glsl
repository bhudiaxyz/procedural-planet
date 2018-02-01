precision highp float;

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
