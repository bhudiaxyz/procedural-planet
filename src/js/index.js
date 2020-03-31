global.THREE = require('three');

import OrbitControls from 'orbit-controls-es6';
import WEBGL from './vendor/WebGL';

import * as Alea from 'alea';
import * as SimplexNoise from 'simplex-noise';
import * as Stats from 'stats.js';
import * as dat from 'dat.gui/build/dat.gui.js';

const imgGrass = require('../textures/terrain/grass1.jpg');
const imgMoon = require('../textures/planets/moon.png');
const imgSand = require('../textures/terrain/sand1.jpg');
const imgSkyboxNx = require('../textures/space/dark-s_nx.jpg');
const imgSkyboxNy = require('../textures/space/dark-s_ny.jpg');
const imgSkyboxNz = require('../textures/space/dark-s_nz.jpg');
const imgSkyboxPx = require('../textures/space/dark-s_px.jpg');
const imgSkyboxPy = require('../textures/space/dark-s_py.jpg');
const imgSkyboxPz = require('../textures/space/dark-s_pz.jpg');
const imgSnow = require('../textures/terrain/snow1.jpg');
const imgSpaceStar = require('../textures/space/star-cluster.png');
const imgStone = require('../textures/terrain/stone2.jpg');
const imgWater = require('../textures/terrain/water3.jpg');
const imgWaterNormals = require('../textures/terrain/waternormals.jpg');

// /* eslint import/no-webpack-loader-syntax: off */
import atmosphereFragShader from '!raw-loader!glslify-loader!../glsl/atmosphere.frag';
import cloudsFragShader from '!raw-loader!glslify-loader!../glsl/clouds.frag';
import standardVertShader from '!raw-loader!glslify-loader!../glsl/standard.vert';
import terrainFragShader from '!raw-loader!glslify-loader!../glsl/terrain.frag';
import terrainVertShader from '!raw-loader!glslify-loader!../glsl/terrain.vert';
import waterFragShader from '!raw-loader!glslify-loader!../glsl/water.frag';

require('../sass/home.sass');

const N = 6;
const TWO_N = Math.pow(2, N); // detail of the spheres
const EARTH_RADIUS = 25.0;

class Application {
  constructor(opts = {}) {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.startTime = Date.now();

    if (opts.container) {
      this.container = opts.container;
    } else {
      const div = Application.createContainer();
      document.body.appendChild(div);
      this.container = div;
    }

    if (WEBGL.isWebGLAvailable()) {
      this.init();
      this.animate();
    } else {
      var warning = WEBGL.getWebGLErrorMessage();
      this.container.appendChild(warning);
    }
  }

  init() {
    // Preamble of standard stuff expected everywhere
    this.prepareInit();

    // Standard scene stuff
    this.setupRenderer();
    this.setupCamera();
    this.setupLights();
    this.setupHelpers();
    this.setupControls();
    this.onResize();

    // Scene setup
    this.setupEarth();
    this.setupParticleSystem();
    this.setupSkyBox();

    this.setupParamsControl();

    window.addEventListener('resize', () => this.onResize, false);
  }

  prepareInit() {
    this.scene = new THREE.Scene();
    this.stats = new Stats();
    this.random = new Alea();
    this.noise = new SimplexNoise(this.random);
    this.gui = new dat.GUI();

    this.delta = 0.0;

    this.params = {
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
  }

  onResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  animate() {
    this.stats.update();
    this.controls.update();
    this.update();
    this.renderer.render(this.scene, this.camera);
    // when render is invoked via requestAnimationFrame(this.render) there is no 'this',
    // so either we bind it explicitly like so: requestAnimationFrame(this.render.bind(this));
    // or use an es6 arrow function like so:
    requestAnimationFrame(() => this.animate());
  }

  static createContainer() {
    const div = document.createElement('div');
    div.setAttribute('class', 'container');
    div.setAttribute('id', 'canvas-container');
    // div.setAttribute('width', window.innerWidth);
    // div.setAttribute('height', window.innerHeight);
    return div;
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    // this.renderer.setClearColor(0xd3d3d3);  // it's a light gray
    this.renderer.setClearColor(0x222222);  // it's a dark gray
    this.renderer.setPixelRatio(window.devicePixelRatio || 1);
    this.renderer.setSize(this.width, this.height);
    this.renderer.shadowMap.enabled = true;

    this.container.appendChild(this.stats.dom);
    this.container.appendChild(this.renderer.domElement);
  }

  setupCamera() {
    const fov = 35;
    const aspect = this.width / this.height;
    const near = 0.1;
    const far = 10000;
    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.camera.position.set(EARTH_RADIUS * 5, EARTH_RADIUS * 0.5, 0);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));
  }

  setupLights() {
    // directional light
    this.dirLight = new THREE.DirectionalLight(0x9f9f9f, 1);
    this.dirLight.position.set(EARTH_RADIUS * 5, EARTH_RADIUS * 1.5, -EARTH_RADIUS * 10);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.camera.near = 10;
    this.scene.add(this.dirLight);
    this.dirLightColor = new THREE.Vector4(this.dirLight.color.r, this.dirLight.color.g, this.dirLight.color.b, 1.0);


    // spotlight
    this.spotLight = new THREE.SpotLight(0xf9f9f9);
    this.spotLight.position.set(EARTH_RADIUS * 3, EARTH_RADIUS * 2, 0);
    this.spotLight.castShadow = true;
    this.dirLight.shadow.camera.near = 10;
    this.scene.add(this.spotLight);

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x040404);
    this.scene.add(ambientLight);
  }

  setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enabled = true;
    this.controls.maxDistance = 1500;
    this.controls.minDistance = 0;
    this.controls.autoRotate = false;
  }

  setupHelpers() {
    // floor grid helper
    const gridHelper = new THREE.GridHelper(EARTH_RADIUS * 10, 16);
    this.scene.add(gridHelper);

    // XYZ axes helper (XYZ axes are RGB colors, respectively)
    const axisHelper = new THREE.AxisHelper(EARTH_RADIUS * 4);
    this.scene.add(axisHelper);

    // directional light helper + shadow camera helper
    const dirLightHelper = new THREE.DirectionalLightHelper(this.dirLight, 10);
    this.scene.add(dirLightHelper);
    const dirLightCameraHelper = new THREE.CameraHelper(this.dirLight.shadow.camera);
    this.scene.add(dirLightCameraHelper);

    // spot light helper + shadow camera helper
    const spotLightHelper = new THREE.SpotLightHelper(this.spotLight);
    this.scene.add(spotLightHelper);
    const spotLightCameraHelper = new THREE.CameraHelper(this.spotLight.shadow.camera);
    this.scene.add(spotLightCameraHelper);
  }

  setupParamsControl() {
    let f = this.gui.addFolder("General");
    f.add(this.params, 'rotate');
    f.open();

    f = this.gui.addFolder('Camera');
    f.add(this.camera.position, 'x').name('Camera X').min(-200).max(200);
    f.add(this.camera.position, 'y').name('Camera Y').min(-200).max(200);
    f.add(this.camera.position, 'z').name('Camera Z').min(-200).max(200);
    f.open();

    f = this.gui.addFolder("Earth");
    f.add(this.params, 'oceanVisible');
    f.add(this.params, 'oceanSpeed', -0.001, 0.001);
    f.add(this.params, 'earthSpeed', -0.001, 0.001);
    f.add(this.params, 'earthRoughness', 0.0, 2.0);
    f.add(this.params, 'earthLacunarity', 0.0, 2.0);
    f.add(this.params, 'earthRotationX', -0.05, 0.05);
    f.add(this.params, 'earthRotationY', -0.05, 0.05);
    f.add(this.params, 'earthRotationZ', -0.05, 0.05);
    f.open();

    f = this.gui.addFolder("Clouds");
    f.add(this.params, 'cloudsVisible');
    f.add(this.params, 'cloudSpeed', 0.0, 0.001);
    f.add(this.params, 'cloudRangeFactor', 0.0, 3.0);
    f.add(this.params, 'cloudSmoothness', 0.0, 3.0);
    f.add(this.params, 'cloudRotationX', -0.05, 0.05);
    f.add(this.params, 'cloudRotationY', -0.05, 0.05);
    f.add(this.params, 'cloudRotationZ', -0.05, 0.05);
    f.open();

    f = this.gui.addFolder("Moon");
    f.add(this.params, 'moonVisible');
    f.add(this.params, 'moonSpeed', -0.05, 0.05);
    f.add(this.params, 'moonRoughness', 0.0, 2.0);
    f.add(this.params, 'moonLacunarity', 0.0, 2.0);
    f.open();
  }

  setupPlanetEarth() {
    const ATMOSPHERE_RADIUS = EARTH_RADIUS * 1.075;
    const CLOUDS_RADIUS = EARTH_RADIUS * 1.06;
    const IMAGE_RES = 1024.0;

    const textureLoader = new THREE.TextureLoader();
    this.earthPivotPoint = new THREE.Object3D();

    // Earth sphere
    this.earthMesh = new THREE.Mesh(
      new THREE.IcosahedronBufferGeometry(EARTH_RADIUS, N),
      new THREE.ShaderMaterial({
        uniforms: {
          texWater: {type: "t", value: textureLoader.load(imgWater)},
          texSand: {type: "t", value: textureLoader.load(imgSand)},
          texGrass: {type: "t", value: textureLoader.load(imgGrass)},
          texStone: {type: "t", value: textureLoader.load(imgStone)},
          texSnow: {type: "t", value: textureLoader.load(imgSnow)},
          lightPosition: {type: 'v3', value: this.dirLight.position.clone()},
          lightColor: {type: 'v4', value: this.dirLightColor},
          lightIntensity: {type: 'f', value: this.dirLight.intensity},
          time: {type: "f", value: 0.0},
          radius: {type: "f", value: EARTH_RADIUS},
          roughness: {type: "f", value: this.params.earthRoughness},
          lacunarity: {type: "f", value: this.params.earthLacunarity}
        },
        vertexShader: terrainVertShader,
        fragmentShader: terrainFragShader
      })
    );
    this.earthMesh.position.set(0, 0, 0);
    this.earthMesh.add(this.earthPivotPoint); // pivot is tied to earth

    // Earth ocean
    const waterNormals = textureLoader.load(imgWaterNormals);
    waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
    this.oceanMesh = new THREE.Mesh(
      new THREE.IcosahedronBufferGeometry(EARTH_RADIUS, N),
      new THREE.ShaderMaterial({
        uniforms: {
          texWater: {type: "t", value: waterNormals},
          lightPosition: {type: 'v3', value: this.dirLight.position.clone()},
          lightColor: {type: 'v4', value: this.dirLightColor},
          lightIntensity: {type: 'f', value: this.dirLight.intensity},
          time: {type: "f", value: 0.0},
          radius: {type: "f", value: EARTH_RADIUS},
          roughness: {type: "f", value: this.params.earthRoughness},
          lacunarity: {type: "f", value: this.params.earthLacunarity}
        },
        vertexShader: standardVertShader,
        fragmentShader: waterFragShader
      })
    );
    this.oceanMesh.position.set(0, 0, 0); // relative to earth
    this.earthMesh.add(this.oceanMesh);

    // Earth Atmosphere Shader
    this.atmosphereMesh = new THREE.Mesh(
      new THREE.SphereGeometry(ATMOSPHERE_RADIUS, TWO_N, TWO_N),
      new THREE.ShaderMaterial({
        uniforms: {
          lightPosition: {type: 'v3', value: this.dirLight.position.clone()},
          lightColor: {type: 'v4', value: this.dirLightColor},
          lightIntensity: {type: 'f', value: this.dirLight.intensity},
          time: {type: "f", value: 0.0},
          radius: {type: "f", value: ATMOSPHERE_RADIUS},
          roughness: {type: "f", value: this.params.earthRoughness},
          lacunarity: {type: "f", value: this.params.earthLacunarity}
        },
        vertexShader: standardVertShader,
        fragmentShader: atmosphereFragShader,
        side: THREE.BackSide,
        transparent: true
      })
    );
    this.atmosphereMesh.position.set(0, 0, 0); // relative to earth
    this.earthMesh.add(this.atmosphereMesh);

    // Earth Clouds Shader
    this.cloudsMesh = new THREE.Mesh(
      new THREE.SphereGeometry(CLOUDS_RADIUS, TWO_N, TWO_N),
      new THREE.ShaderMaterial({
        uniforms: {
          lightPosition: {type: 'v3', value: this.dirLight.position.clone()},
          lightColor: {type: 'v4', value: this.dirLightColor},
          lightIntensity: {type: 'f', value: this.dirLight.intensity},
          time: {type: "f", value: 0.0},
          radius: {type: "f", value: CLOUDS_RADIUS},
          resolution: {type: "f", value: IMAGE_RES},
          baseColor: {type: "v3", value: new THREE.Vector3(0.65, 0.65, 0.65)},
          rangeFactor: {type: "f", value: this.params.cloudRangeFactor},
          smoothness: {type: "f", value: this.params.cloudSmoothness},
          seed: {type: "f", value: this.random() * 7}
        },
        vertexShader: standardVertShader,
        fragmentShader: cloudsFragShader,
        side: THREE.DoubleSide,
        transparent: true
      })
    );
    this.cloudsMesh.position.set(0, 0, 0); // relative to earth
    this.earthMesh.add(this.cloudsMesh);

    this.scene.add(this.earthMesh);
  }

  setupEarthMoon() {
    const MOON_RADIUS = EARTH_RADIUS * 0.27;
    const MOON_POS_X = EARTH_RADIUS * 3.5;
    const textureLoader = new THREE.TextureLoader();

    // Moon
    const moonTexture = textureLoader.load(imgMoon);
    this.moonMesh = new THREE.Mesh(
      new THREE.IcosahedronBufferGeometry(MOON_RADIUS, N),
      new THREE.ShaderMaterial({
        uniforms: {
          texWater: {type: "t", value: moonTexture},
          texSand: {type: "t", value: moonTexture},
          texGrass: {type: "t", value: moonTexture},
          texStone: {type: "t", value: moonTexture},
          texSnow: {type: "t", value: moonTexture},

          lightPosition: {type: 'v3', value: this.dirLight.position.clone()},
          lightColor: {type: 'v4', value: this.dirLightColor},
          lightIntensity: {type: 'f', value: this.dirLight.intensity},

          time: {type: "f", value: 0.0},
          radius: {type: "f", value: MOON_RADIUS},
          roughness: {type: "f", value: this.params.moonRoughness},
          lacunarity: {type: "f", value: this.params.moonLacunarity}
        },
        vertexShader: terrainVertShader,
        fragmentShader: terrainFragShader
      })
    );
    this.moonMesh.position.set(MOON_POS_X, 0, 0); // relative to earth
    this.scene.add(this.moonMesh);
    this.earthPivotPoint.add(this.moonMesh); // Moon pivots around (and parented to) the earth.
  }

  setupEarth() {
    this.setupPlanetEarth();
    this.setupEarthMoon();
  }

  setupParticleSystem() {
    const STAR_RADIUS = EARTH_RADIUS * 50;
    const STAR_SPREAD = EARTH_RADIUS * 4;
    const PARTICLE_COUNT = 500;

    const textureLoader = new THREE.TextureLoader();
    const bgTexture = textureLoader.load(imgSpaceStar);

    const geometry = new THREE.Geometry();

    for (let i = 0; i < PARTICLE_COUNT; i += 1) {
      // Generate a random point around a (randomized) sphere (using polar co-ords) - http://corysimon.github.io/articles/uniformdistn-on-sphere/
      const sphere = STAR_RADIUS + this.random() * STAR_SPREAD;
      const theta = 2 * Math.PI * this.random();
      const phi = Math.acos(1 - 2 * this.random());
      const x = Math.sin(phi) * Math.cos(theta);
      const y = Math.sin(phi) * Math.sin(theta);
      const z = Math.cos(phi);

      geometry.vertices.push(new THREE.Vector3(sphere * x, sphere * y, sphere * z));
    }

    const material = new THREE.PointsMaterial({
      size: 32,
      map: bgTexture,
      transparent: true,
      // alphaTest's default is 0 and the particles overlap. Any value > 0 prevents the particles from overlapping.
      alphaTest: 0.5,
    });

    const particleSystem = new THREE.Points(geometry, material);
    particleSystem.position.set(0, 0, 0);
    this.scene.add(particleSystem);
  }

  setupSkyBox() {
    const SPACESKY_RADIUS = EARTH_RADIUS * 150.0;

    // Spacesky Shader
    let loader = new THREE.CubeTextureLoader();

    const textureCube = loader.load([
      imgSkyboxPx, imgSkyboxNx,
      imgSkyboxPy, imgSkyboxNy,
      imgSkyboxPz, imgSkyboxNz
    ]);
    this.spaceskyMesh = new THREE.Mesh(
      new THREE.SphereGeometry(SPACESKY_RADIUS, TWO_N, TWO_N),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        envMap: textureCube,
        side: THREE.BackSide,
        transparent: true
      })
    );
    this.scene.add(this.spaceskyMesh);
  }

  updateEarth() {
    const delta = Date.now() - this.startTime;

    // Earth Moon
    this.moonMesh.visible = this.params.moonVisible;
    this.moonMesh.material.uniforms.time.value = this.params.moonSpeed * delta;
    this.moonMesh.material.uniforms.roughness.value = this.params.moonRoughness;
    this.moonMesh.material.uniforms.lacunarity.value = this.params.moonLacunarity;

    // Planet Earth
    this.earthMesh.material.uniforms.time.value = this.params.earthSpeed * delta;
    this.earthMesh.material.uniforms.roughness.value = this.params.earthRoughness;
    this.earthMesh.material.uniforms.lacunarity.value = this.params.earthLacunarity;

    this.oceanMesh.material.uniforms.time.value = this.params.oceanSpeed * delta;
    this.oceanMesh.visible = this.params.oceanVisible;

    this.cloudsMesh.material.uniforms.time.value = this.params.cloudSpeed * delta;
    this.cloudsMesh.visible = this.params.cloudsVisible;
    this.cloudsMesh.material.uniforms.rangeFactor.value = this.params.cloudRangeFactor;
    this.cloudsMesh.material.uniforms.smoothness.value = this.params.cloudSmoothness;
    this.cloudsMesh.rotation.x += this.params.cloudRotationX;
    this.cloudsMesh.rotation.y += this.params.cloudRotationY;
    this.cloudsMesh.rotation.z += this.params.cloudRotationZ;

    if (this.params.rotate) {
      this.earthMesh.rotation.x += this.params.earthRotationX;
      this.earthMesh.rotation.y += this.params.earthRotationY;
      this.earthMesh.rotation.z += this.params.earthRotationZ;

      //this.earthPivotPoint.rotation.y += this.params.moonSpeed;
    }
  }

  update() {
    this.delta += 0.1;

    this.updateEarth();
  }
}

// wrap everything inside a function scope and invoke it (IIFE, a.k.a. SEAF)
(() => {
  window.addEventListener('load', () => {
    const app = new Application({
      container: document.getElementById('canvas-container'),
    });
    console.log(app);
  });
})();
