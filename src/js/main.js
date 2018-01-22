/*!
 * Procedural Planet - Procedurally generated planet (procedural-planet v1.0.0 - https://github.com/bhupendra-bhudia/procedural-planet)
 *
 * Licensed under MIT (https://github.com/bhupendra-bhudia/procedural-planet/blob/master/LICENSE)
 *
 * Inspired by works: https://prolearner.github.io/procedural-planet/
 */

const glslify = require('glslify');
var Alea = require('alea');
var SimplexNoise = require('simplex-noise');

var THREE = require('three');
var OrbitControls = require('three-orbit-controls')(THREE);
var Stats = require('stats.js');
var dat = require('dat.gui/build/dat.gui.js');

let gui, random, container, renderer, stats, scene, camera, textureLoader, spaceskyMesh;
let earthMesh, oceanMesh, atmosphereMesh, cloudsMesh, earthPivotPoint, moonMesh;
let directionalLight;

const N = 6;
const TWO_N = Math.pow(2, N); // detail of the spheres
const START_TIME = Date.now();
const IMAGE_RES = 1024.0
const FOV = 30;
const EARTH_RADIUS = 25.0;

const LIGHT_POS = EARTH_RADIUS * 3.5;
const CAMERA_POS_Z = EARTH_RADIUS * 5.5;

const SPACESKY_RADIUS = EARTH_RADIUS * 55.0;
const MOON_RADIUS = EARTH_RADIUS * 0.27;
const MOON_POS_X = EARTH_RADIUS * 3.0;
const ATMOSPHERE_RADIUS = EARTH_RADIUS * 1.075;
const CLOUDS_RADIUS = EARTH_RADIUS * 1.06;

let params = {
  // General
  rotate: true,
  // Earth
  oceanVisible: true,
  oceanSpeed: 0.0000275963,
  earthSpeed: 0.00035,
  earthRoughness: 0.043,
  earthLacunarity: 0.076,
  earthRotationX: 0.000,
  earthRotationY: 0.003,
  earthRotationZ: 0.000,
  // Clouds
  cloudsVisible: true,
  cloudSpeed: 0.00002140,
  cloudRangeFactor: 0.29,
  cloudSmoothness: 2.6,
  cloudRotationX: 0.000053,
  cloudRotationY: -0.00138,
  cloudRotationZ: 0.00003,
  // Moon
  moonVisible: true,
  moonSpeed: -0.015,
  moonRoughness: 0.031,
  moonLacunarity: 0.076
};

function buildParamsGui() {
  let f = gui.addFolder("General");
  f.add(params, 'rotate');
  f.open();

  f = gui.addFolder("Earth");
  f.add(params, 'oceanVisible');
  f.add(params, 'oceanSpeed', -0.001, 0.001);
  f.add(params, 'earthSpeed', -0.001, 0.001);
  f.add(params, 'earthRoughness', 0.0, 2.0);
  f.add(params, 'earthLacunarity', 0.0, 2.0);
  f.add(params, 'earthRotationX', -0.05, 0.05);
  f.add(params, 'earthRotationY', -0.05, 0.05);
  f.add(params, 'earthRotationZ', -0.05, 0.05);
  f.open();

  f = gui.addFolder("Clouds");
  f.add(params, 'cloudsVisible');
  f.add(params, 'cloudSpeed', 0.0, 0.001);
  f.add(params, 'cloudRangeFactor', 0.0, 3.0);
  f.add(params, 'cloudSmoothness', 0.0, 3.0);
  f.add(params, 'cloudRotationX', -0.05, 0.05);
  f.add(params, 'cloudRotationY', -0.05, 0.05);
  f.add(params, 'cloudRotationZ', -0.05, 0.05);
  f.open();

  f = gui.addFolder("Moon");
  f.add(params, 'moonVisible');
  f.add(params, 'moonSpeed', -0.05, 0.05);
  f.add(params, 'moonRoughness', 0.0, 2.0);
  f.add(params, 'moonLacunarity', 0.0, 2.0);
  f.open();
}

function init() {
  random = new Alea();
  container = document.getElementById('world');
  stats = new Stats();
  textureLoader = new THREE.TextureLoader();
  gui = new dat.GUI();
  buildParamsGui();

  renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  // renderer.autoClear = false;

  container.appendChild(stats.dom);
  container.appendChild(renderer.domElement);

  // Scene setup
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, 1, 10000);
  camera.position.set(0.0, 0.0, CAMERA_POS_Z);
  camera.target = new THREE.Vector3(0, 0, 0);

  scene.add(camera);
  controls = new OrbitControls(camera, renderer.domElement);

  // Lights
  // var ambientLight = new THREE.AmbientLight(0x444444);
  // ambientLight.position.set(150.0, 150.0, 150.0);
  // scene.add(ambientLight);

  directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
  directionalLight.position.set(LIGHT_POS, LIGHT_POS, LIGHT_POS);
  scene.add(directionalLight);

  // var spotLight = new THREE.SpotLight(0xffffff, 1.0, 180);
  // spotLight.castShadow = true;
  // spotLight.position.set(-75.0, -75.0, -75.0);
  // spotLight.shadow.mapSize.width = IMAGE_RES;
  // spotLight.shadow.mapSize.height = IMAGE_RES;
  // spotLight.shadow.camera.near = 50;
  // spotLight.shadow.camera.far = 200;
  // spotLight.shadow.camera.fov = FOV * 1.5;
  // scene.add(spotLight);

  // raycaster = new THREE.Raycaster();

  // Spacesky Shader
  let loader = new THREE.CubeTextureLoader();
  loader.setPath('img/space/');

  let textureCube = loader.load([
    'dark-s_px.jpg', 'dark-s_nx.jpg',
    'dark-s_py.jpg', 'dark-s_ny.jpg',
    'dark-s_pz.jpg', 'dark-s_nz.jpg'
  ]);
  spaceskyMesh = new THREE.Mesh(
    new THREE.SphereGeometry(SPACESKY_RADIUS, TWO_N, TWO_N),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      envMap: textureCube,
      side: THREE.BackSide,
      transparent: true
    })
  );
  scene.add(spaceskyMesh);

  // Earth sphere
  earthMesh = new THREE.Mesh(
    new THREE.IcosahedronBufferGeometry(EARTH_RADIUS, N),
    new THREE.ShaderMaterial({
      uniforms: {
        texWater: {type: "t", value: textureLoader.load("img/terrain/water3.jpg")},
        texSand: {type: "t", value: textureLoader.load("img/terrain/sand1.jpg")},
        texGrass: {type: "t", value: textureLoader.load("img/terrain/grass1.jpg")},
        texStone: {type: "t", value: textureLoader.load("img/terrain/stone2.jpg")},
        texSnow: {type: "t", value: textureLoader.load("img/terrain/snow1.jpg")},
        lightPosition: {type: 'v3', value: directionalLight.position.clone()},
        lightColor: {type: 'v4', value: new THREE.Vector4(directionalLight.color.r, directionalLight.color.g, directionalLight.color.b, 1.0)},
        lightIntensity: {type: 'f', value: directionalLight.intensity},
        time: {type: "f", value: 0.0},
        radius: {type: "f", value: EARTH_RADIUS},
        roughness: {type: "f", value: params.earthRoughness},
        lacunarity: {type: "f", value: params.earthLacunarity}
      },
      vertexShader: glslify('../glsl/terrain.vert'),
      fragmentShader: glslify('../glsl/terrain.frag')
    })
  );
  earthMesh.position.set(0, 0, 0);
  scene.add(earthMesh);
  earthPivotPoint = new THREE.Object3D();
  earthMesh.add(earthPivotPoint); // pivot is tied to earth

  // Earth ocean
  let waterNormals = textureLoader.load("img/terrain/waternormals.jpg");
  waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
  oceanMesh = new THREE.Mesh(
    new THREE.IcosahedronBufferGeometry(EARTH_RADIUS, N),
    new THREE.ShaderMaterial({
      uniforms: {
        texWater: {type: "t", value: waterNormals},
        lightPosition: {type: 'v3', value: directionalLight.position.clone()},
        lightColor: {type: 'v4', value: new THREE.Vector4(directionalLight.color.r, directionalLight.color.g, directionalLight.color.b, 1.0)},
        lightIntensity: {type: 'f', value: directionalLight.intensity},
        time: {type: "f", value: 0.0},
        radius: {type: "f", value: EARTH_RADIUS},
        roughness: {type: "f", value: params.earthRoughness},
        lacunarity: {type: "f", value: params.earthLacunarity}
      },
      vertexShader: glslify('../glsl/standard.vert'),
      fragmentShader: glslify('../glsl/water.frag')
    })
  );
  oceanMesh.position.set(0, 0, 0); // relative to earth
  earthMesh.add(oceanMesh);

  // Earth Atmosphere Shader
  atmosphereMesh = new THREE.Mesh(
    new THREE.SphereGeometry(ATMOSPHERE_RADIUS, TWO_N, TWO_N),
    new THREE.ShaderMaterial({
      uniforms: {
        // tex: textureLoader.load("img/patterns/gradient.jpg"),
        lightPosition: {type: 'v3', value: directionalLight.position.clone()},
        lightColor: {type: 'v4', value: new THREE.Vector4(directionalLight.color.r, directionalLight.color.g, directionalLight.color.b, 1.0)},
        lightIntensity: {type: 'f', value: directionalLight.intensity},
        time: {type: "f", value: 0.0},
        radius: {type: "f", value: ATMOSPHERE_RADIUS},
        roughness: {type: "f", value: params.earthRoughness},
        lacunarity: {type: "f", value: params.earthLacunarity}
      },
      vertexShader: glslify('../glsl/standard.vert'),
      fragmentShader: glslify('../glsl/atmosphere.frag'),
      side: THREE.BackSide,
      transparent: true
    })
  );
  earthMesh.add(atmosphereMesh);

  // Earth Clouds Shader
  cloudsMesh = new THREE.Mesh(
    new THREE.SphereGeometry(CLOUDS_RADIUS, TWO_N, TWO_N),
    new THREE.ShaderMaterial({
      uniforms: {
        lightPosition: {type: 'v3', value: directionalLight.position.clone()},
        lightColor: {type: 'v4', value: new THREE.Vector4(directionalLight.color.r, directionalLight.color.g, directionalLight.color.b, 1.0)},
        lightIntensity: {type: 'f', value: directionalLight.intensity},
        time: {type: "f", value: 0.0},
        radius: {type: "f", value: CLOUDS_RADIUS},
        resolution: {type: "f", value: IMAGE_RES},
        baseColor: {type: "v3", value: new THREE.Vector3(0.65, 0.65, 0.65)},
        rangeFactor: {type: "f", value: params.cloudRangeFactor},
        smoothness: {type: "f", value: params.cloudSmoothness},
        seed: {type: "f", value: Math.random() * 7}
      },
      vertexShader: glslify('../glsl/standard.vert'),
      fragmentShader: glslify('../glsl/clouds.frag'),
      side: THREE.DoubleSide,
      transparent: true
    })
  );
  earthMesh.add(cloudsMesh);

  // Moon
  let moonTexture = textureLoader.load("img/planets/moon.png");
  moonMesh = new THREE.Mesh(
    new THREE.IcosahedronBufferGeometry(MOON_RADIUS, N),
    new THREE.ShaderMaterial({
      uniforms: {
        texWater: {type: "t", value: moonTexture},
        texSand: {type: "t", value: moonTexture},
        texGrass: {type: "t", value: moonTexture},
        texStone: {type: "t", value: moonTexture},
        texSnow: {type: "t", value: moonTexture},

        lightPosition: {type: 'v3', value: directionalLight.position.clone()},
        lightColor: {type: 'v4', value: new THREE.Vector4(directionalLight.color.r, directionalLight.color.g, directionalLight.color.b, 1.0)},
        lightIntensity: {type: 'f', value: directionalLight.intensity},

        time: {type: "f", value: 0.0},
        radius: {type: "f", value: MOON_RADIUS},
        roughness: {type: "f", value: params.moonRoughness},
        lacunarity: {type: "f", value: params.moonLacunarity}
      },
      vertexShader: glslify('../glsl/terrain.vert'),
      fragmentShader: glslify('../glsl/terrain.frag')
    })
  );
  moonMesh.position.set(MOON_POS_X, 0, 0); // relative to earth
  scene.add(moonMesh);
  earthPivotPoint.add(moonMesh); // Moon pivots around (and parented to) the earth.

  window.addEventListener('resize', onWindowResize, false);
  onWindowResize();
  render();
}

window.addEventListener('load', init);

function onWindowResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;

  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

function render() {
  const delta = Date.now() - START_TIME;

  earthMesh.material.uniforms.time.value = params.earthSpeed * delta;
  earthMesh.material.uniforms.roughness.value = params.earthRoughness;
  earthMesh.material.uniforms.lacunarity.value = params.earthLacunarity;

  oceanMesh.material.uniforms.time.value = params.oceanSpeed * delta;
  oceanMesh.visible = params.oceanVisible;

  cloudsMesh.material.uniforms.time.value = params.cloudSpeed * delta;
  cloudsMesh.visible = params.cloudsVisible;
  cloudsMesh.material.uniforms.rangeFactor.value = params.cloudRangeFactor;
  cloudsMesh.material.uniforms.smoothness.value = params.cloudSmoothness;
  cloudsMesh.rotation.x += params.cloudRotationX;
  cloudsMesh.rotation.y += params.cloudRotationY;
  cloudsMesh.rotation.z += params.cloudRotationZ;

  moonMesh.visible = params.moonVisible;
  moonMesh.material.uniforms.time.value = params.moonSpeed * delta;
  moonMesh.material.uniforms.roughness.value = params.moonRoughness;
  moonMesh.material.uniforms.lacunarity.value = params.moonLacunarity;

  if (params.rotate) {
    earthMesh.rotation.x += params.earthRotationX;
    earthMesh.rotation.y += params.earthRotationY;
    earthMesh.rotation.z += params.earthRotationZ;

    earthPivotPoint.rotation.y += params.moonSpeed;
  }
  stats.update();
  renderer.render(scene, camera);

  requestAnimationFrame(render);
}
