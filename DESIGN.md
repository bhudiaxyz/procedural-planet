# Design & Architecture

## Overview

The application is a single-page WebGL scene driven by Three.js. All geometry is generated procedurally at runtime; there are no pre-baked meshes or heightmaps. Visual complexity comes from custom GLSL shaders processed through glslify, which resolves `#pragma glslify` imports at build time.

---

## Scene graph

```
THREE.Scene
├── spaceskyMesh          — cubemap skybox sphere (BackSide, r=3750)
├── particleSystem        — 500 billboard stars
├── pointLight            — sun-like key light
├── dirLight              — fill directional light
├── spotLight             — rim / accent
├── ambientLight          — very dark fill (0x040404)
└── earthMesh             — planet body (IcosahedronGeometry, detail=6)
    ├── earthPivotPoint   — pivot for moon orbit
    │   └── moonMesh      — IcosahedronGeometry, detail=6
    ├── oceanMesh         — IcosahedronGeometry, slightly larger radius
    ├── atmosphereMesh    — SphereGeometry (BackSide, transparent)
    └── cloudsMesh        — SphereGeometry (DoubleSide, transparent)
```

All planet children inherit the earth's transform so rotation, tilt, and position stay in sync automatically. The moon orbits by rotating `earthPivotPoint`.

---

## Geometry

| Mesh | Geometry | Detail |
|---|---|---|
| Earth, Ocean, Moon | `IcosahedronGeometry(r, 6)` | 2⁶ = 64 subdivisions |
| Atmosphere, Clouds, Skybox | `SphereGeometry(r, 64, 64)` | — |
| Stars | `BufferGeometry` (500 points) | uniform sphere distribution |

Icosahedra are used for the solid bodies because subdivision produces more uniform vertex density than UV spheres, which reduces shader aliasing at the poles.

Star positions are generated with the Marsaglia / polar-coordinate method:
```
theta = 2π * rand()
phi   = acos(1 - 2 * rand())
x, y, z = sin(phi)*cos(theta), sin(phi)*sin(theta), cos(phi)
```

---

## Shaders

All shaders are plain GLSL (WebGL1 compatible, no `#version` directive). glslify resolves `#pragma glslify` imports at webpack build time via `glslify-loader` + `raw-loader`.

### standard.vert

Shared vertex shader used by ocean, atmosphere, and clouds. Computes:
- `vUv` — standard UV passthrough
- `vNormal` — world-space normal
- `vPosition` — world-space position
- `vPosition01` — normalised position in [−0.5, 0.5] range (used for UV-free triplanar mapping)
- `lightDirection` — normalised vector from fragment to light source

### terrain.vert

Extends standard with fractal displacement. Samples `glsl-noise/simplex/3d` at multiple octaves to displace vertices along their normal before projection. The displaced normal is recomputed and passed as `vNormal`. Uniforms: `time`, `radius`, `roughness`, `lacunarity`.

### terrain.frag

Triplanar texture blending across five zones driven by the displaced vertex height (encoded in `vPosition01.y`):

| Zone | Texture | Elevation trigger |
|---|---|---|
| Deep water | `texWater` | lowest |
| Sand / shore | `texSand` | low |
| Grass | `texGrass` | mid |
| Stone | `texStone` | high |
| Snow | `texSnow` | highest |

Lambert diffuse from `glsl-diffuse-lambert` modulates the final colour. Lighting uses the directional light position and colour passed as uniforms.

### water.frag

Animated normal-map distortion: samples `texWater` (a normal map with `RepeatWrapping`) at two UV offsets driven by `time`, blends them, and computes a Phong-style specular highlight. The ocean mesh sits fractionally above the terrain radius (`r × 1.0001`) to avoid z-fighting.

### atmosphere.frag

Rim-glow effect. Uses `dot(vNormal, vec3(0,0,1))` raised to the 8th power to produce a sharp Fresnel-style halo. The mesh is a `BackSide` sphere slightly larger than the planet (`r × 1.075`), transparent, so it only draws where the planet silhouette is against space.

### clouds.frag

Procedural cloud cover generated entirely in the fragment shader:

1. A 3D tricosine interpolated noise function builds a scalar field from the normalised surface position + animated `time` offset.
2. Six octaves are accumulated with halving amplitude (`amp /= smoothness`) — a standard fBm stack.
3. The scalar value is thresholded at 0.75; below that, `alpha → 0`, giving hard cloud edges.
4. `rangeFactor` and `smoothness` are live uniforms that reshape density and sharpness in real time.
5. `seed` is randomised per page load (via Alea) so cloud patterns differ each run.

---

## Lighting

Three shadow-casting lights are used:

| Light | Colour | Role |
|---|---|---|
| `PointLight` (intensity 2) | white | primary key — sun |
| `DirectionalLight` (intensity 1) | grey (0x9f9f9f) | fill |
| `SpotLight` | white | rim / accent |
| `AmbientLight` | near-black (0x040404) | prevents pure-black shadows |

Shadow maps are 512×512. Light colour and position for the directional light are forwarded to every shader as `lightColor` (vec4) and `lightPosition` (vec3) uniforms so the GPU-side lighting matches the scene lighting.

---

## Animation loop

```
requestAnimationFrame → animate()
  stats.update()
  controls.update()        ← OrbitControls damping
  update()                 ← uniform writes + rotation increments
  renderer.render()
```

`update()` writes `time = speed × (Date.now() − startTime)` into the relevant shader uniforms each frame, which drives all animated effects (terrain displacement, ocean distortion, cloud movement). Rotation is applied directly to mesh Euler angles.

---

## Random number generation

[Alea](https://github.com/coverslide/node-alea) (a Mash-based PRNG) is used for all JS-side randomness (star positions, cloud seed). It produces reproducible sequences from a seed, though currently seeded without a fixed value so output varies per load.

---

## Build toolchain

| Concern | Tool |
|---|---|
| Bundler | webpack 5 |
| Transpilation | Babel (`@babel/preset-env` + `@babel/preset-typescript`) |
| Type checking | TypeScript 7 (`tsc --noEmit`) |
| GLSL processing | glslify-loader + raw-loader |
| CSS | sass-loader → MiniCssExtractPlugin |
| Assets | webpack 5 asset modules (`type: 'asset'`) |
| Dev server | webpack-dev-server 6 |
| Linting | ESLint 10 (flat config) + `@babel/eslint-parser` |
| Formatting | Prettier 3 |
| Git hooks | Husky 9 + lint-staged |

GLSL files are imported with inline loader syntax (`!raw-loader!glslify-loader!./shaders/x.frag`) so webpack processes them as strings rather than JS modules.

---

## Key constants

| Constant | Value | Meaning |
|---|---|---|
| `EARTH_RADIUS` | 25.0 | Base unit for all radii and distances |
| `N` | 6 | Icosahedron subdivision detail |
| `TWO_N` | 64 | Sphere segment count for atmosphere/clouds |
| `ATMOSPHERE_RADIUS` | `r × 1.075` | 7.5% larger than planet |
| `CLOUDS_RADIUS` | `r × 1.06` | 6% larger than planet |
| `MOON_RADIUS` | `r × 0.27` | ~27% of planet radius |
| `MOON_POS_X` | `r × 3.5` | Orbital distance |
| `SPACESKY_RADIUS` | `r × 150` | Skybox sphere radius |
| `PARTICLE_COUNT` | 500 | Star billboard count |
