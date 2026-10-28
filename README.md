# procedural-planet

A real-time procedurally generated planet rendered in the browser using WebGL and Three.js.

**Live demo:** [bhudiaxyz.github.io/procedural-planet](https://bhudiaxyz.github.io/procedural-planet)

## Highlights

- Fractal terrain generated entirely on the GPU — no heightmaps, no pre-baked textures
- Five-layer triplanar texture blending (water, sand, grass, stone, snow) driven by elevation noise
- Animated ocean with normal-map distortion, atmosphere glow, and procedural cloud cover
- Orbiting moon with independent roughness and lacunarity controls
- 500-particle star field on a randomised uniform-sphere distribution
- Cubemap skybox, full shadow maps, and three independently controllable light sources
- Live parameter panel (lil-gui) for every visual property — rotation speeds, noise parameters, light colours

## Getting started

```bash
npm install
npm start        # dev server at http://localhost:8080
npm run build    # production bundle → dist/
```

## Controls

- **Left drag** — orbit
- **Right drag / scroll** — pan / zoom
- **GUI panel** — tweak terrain, clouds, moon, lighting, and rotation in real time
