import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Alea from 'alea';
import Stats from 'stats.js';
import GUI from 'lil-gui';

import atmosphereFragShader from '!raw-loader!glslify-loader!./shaders/atmosphere.frag';
import cloudsFragShader from '!raw-loader!glslify-loader!./shaders/clouds.frag';
import standardVertShader from '!raw-loader!glslify-loader!./shaders/standard.vert';
import terrainFragShader from '!raw-loader!glslify-loader!./shaders/terrain.frag';
import terrainVertShader from '!raw-loader!glslify-loader!./shaders/terrain.vert';
import waterFragShader from '!raw-loader!glslify-loader!./shaders/water.frag';

const imgGrass = require('../assets/textures/terrain/grass1.jpg');
const imgMoon = require('../assets/textures/planets/moon.png');
const imgSand = require('../assets/textures/terrain/sand1.jpg');
const imgSkyboxNx = require('../assets/textures/space/dark-s_nx.jpg');
const imgSkyboxNy = require('../assets/textures/space/dark-s_ny.jpg');
const imgSkyboxNz = require('../assets/textures/space/dark-s_nz.jpg');
const imgSkyboxPx = require('../assets/textures/space/dark-s_px.jpg');
const imgSkyboxPy = require('../assets/textures/space/dark-s_py.jpg');
const imgSkyboxPz = require('../assets/textures/space/dark-s_pz.jpg');
const imgSnow = require('../assets/textures/terrain/snow1.jpg');
const imgSpaceStar = require('../assets/textures/space/star-cluster.png');
const imgStone = require('../assets/textures/terrain/stone2.jpg');
const imgWater = require('../assets/textures/terrain/water3.jpg');
const imgWaterNormals = require('../assets/textures/terrain/waternormals.jpg');

const N = 6;
const TWO_N = Math.pow(2, N);
const EARTH_RADIUS = 25.0;

type AppOptions = {
  container: HTMLElement;
};

type Params = {
  rotate: boolean;
  panRotate: boolean;
  pointLightColor: number;
  dirLightColor: number;
  spotLightColor: number;
  ambLightColor: number;
  oceanVisible: boolean;
  oceanSpeed: number;
  earthSpeed: number;
  earthRoughness: number;
  earthLacunarity: number;
  earthRotationX: number;
  earthRotationY: number;
  earthRotationZ: number;
  cloudsVisible: boolean;
  cloudSpeed: number;
  cloudRangeFactor: number;
  cloudSmoothness: number;
  cloudRotationX: number;
  cloudRotationY: number;
  cloudRotationZ: number;
  moonVisible: boolean;
  moonSpeed: number;
  moonRoughness: number;
  moonLacunarity: number;
  starSpeed: number;
};

export default class Application {
  private width: number;
  private height: number;
  private startTime: number;
  private rafId: number | null;
  private container: HTMLElement;
  private scene!: THREE.Scene;
  private stats!: Stats;
  private random!: ReturnType<typeof Alea>;
  private gui!: GUI;
  private delta: number;
  private params!: Params;
  private renderer!: THREE.WebGLRenderer;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private pointLight!: THREE.PointLight;
  private dirLight!: THREE.DirectionalLight;
  private dirLightColor!: THREE.Vector4;
  private spotLight!: THREE.SpotLight;
  private ambientLight!: THREE.AmbientLight;
  private earthMesh!: THREE.Mesh;
  private oceanMesh!: THREE.Mesh;
  private atmosphereMesh!: THREE.Mesh;
  private cloudsMesh!: THREE.Mesh;
  private moonMesh!: THREE.Mesh;
  private particleSystem!: THREE.Points;
  private spaceskyMesh!: THREE.Mesh;
  private earthPivotPoint!: THREE.Object3D;

  constructor(opts: AppOptions) {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.startTime = Date.now();
    this.rafId = null;
    this.delta = 0.0;
    this.container = opts.container;

    this.prepareInit();
    this.setupRenderer();
    this.setupLights();
    this.setupSkyBox();
    this.setupParticleSystem();
    this.setupEarth();
    this.setupParamsControl();

    this.onResize();
    window.addEventListener('resize', () => this.onResize(), false);
  }

  private prepareInit(): void {
    this.scene = new THREE.Scene();
    this.stats = new Stats();
    this.random = Alea();
    this.gui = new GUI();

    this.params = {
      rotate: true,
      panRotate: true,
      pointLightColor: 0xffffff,
      dirLightColor: 0x9f9f9f,
      spotLightColor: 0xffffff,
      ambLightColor: 0x040404,
      oceanVisible: true,
      oceanSpeed: 0.0000275963,
      earthSpeed: 0.00035,
      earthRoughness: 0.043,
      earthLacunarity: 0.076,
      earthRotationX: 0.000,
      earthRotationY: 0.003,
      earthRotationZ: 0.000,
      cloudsVisible: true,
      cloudSpeed: 0.00002140,
      cloudRangeFactor: 0.29,
      cloudSmoothness: 2.6,
      cloudRotationX: 0.000053,
      cloudRotationY: -0.00138,
      cloudRotationZ: 0.00003,
      moonVisible: true,
      moonSpeed: -0.015,
      moonRoughness: 0.031,
      moonLacunarity: 0.076,
      starSpeed: 0.00035,
    };
  }

  onResize(): void {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  animate(): void {
    this.stats.update();
    this.controls.update();
    this.update();
    this.renderer.render(this.scene, this.camera);
    this.rafId = requestAnimationFrame(() => this.animate());
  }

  stop(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
  }

  private setupRenderer(): void {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setClearColor(0x222222);
    this.renderer.setPixelRatio(window.devicePixelRatio || 1);
    this.renderer.setSize(this.width, this.height);
    this.renderer.shadowMap.enabled = true;

    this.container.appendChild(this.stats.dom);
    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(35, this.width / this.height, 0.1, 10000);
    this.camera.position.set(EARTH_RADIUS * 5, EARTH_RADIUS * 0.5, 0);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enabled = true;
    this.controls.maxDistance = 1500;
    this.controls.minDistance = 0;
    this.controls.autoRotate = true;
  }

  private setupLights(): void {
    const shadowMapSize = 512;
    const shadowCameraNear = 0.5;
    const shadowCameraFar = 200;

    const addShadow = (light: THREE.PointLight | THREE.DirectionalLight | THREE.SpotLight) => {
      light.castShadow = true;
      light.shadow.mapSize.width = shadowMapSize;
      light.shadow.mapSize.height = shadowMapSize;
      light.shadow.camera.near = shadowCameraNear;
      light.shadow.camera.far = shadowCameraFar;
    };

    this.pointLight = new THREE.PointLight(this.params.pointLightColor, 2);
    this.pointLight.position.set(EARTH_RADIUS * 0.5, EARTH_RADIUS * 4.0, EARTH_RADIUS * 0.25);
    addShadow(this.pointLight);
    this.scene.add(this.pointLight);

    this.dirLight = new THREE.DirectionalLight(this.params.dirLightColor, 1);
    this.dirLightColor = new THREE.Vector4(this.dirLight.color.r, this.dirLight.color.g, this.dirLight.color.b, 1.0);
    this.dirLight.position.set(EARTH_RADIUS * 5, EARTH_RADIUS * 1.5, -EARTH_RADIUS * 2);
    addShadow(this.dirLight);
    this.scene.add(this.dirLight);

    this.spotLight = new THREE.SpotLight(this.params.spotLightColor);
    this.spotLight.position.set(EARTH_RADIUS * 1, EARTH_RADIUS * 2, EARTH_RADIUS * 0.5);
    addShadow(this.spotLight);
    this.scene.add(this.spotLight);

    this.ambientLight = new THREE.AmbientLight(this.params.ambLightColor);
    this.scene.add(this.ambientLight);
  }


  private setupParamsControl(): void {
    let f = this.gui.addFolder('General');
    f.add(this.params, 'rotate');
    f.add(this.controls, 'autoRotate');
    f.close();

    f = this.gui.addFolder('Lighting');
    f.add(this.pointLight.position, 'x').name('Point X').min(-200).max(200);
    f.add(this.pointLight.position, 'y').name('Point Y').min(-200).max(200);
    f.add(this.pointLight.position, 'z').name('Point Z').min(-200).max(200);
    f.addColor(this.params, 'pointLightColor').name('Point Color').onChange((v: number) => this.pointLight.color.set(v));

    f.add(this.dirLight.position, 'x').name('Directional X').min(-200).max(200);
    f.add(this.dirLight.position, 'y').name('Directional Y').min(-200).max(200);
    f.add(this.dirLight.position, 'z').name('Directional Z').min(-200).max(200);
    f.addColor(this.params, 'dirLightColor').name('Directional Color').onChange((v: number) => {
      this.dirLight.color.set(v);
      this.dirLightColor.set(this.dirLight.color.r, this.dirLight.color.g, this.dirLight.color.b, 1.0);
    });

    f.add(this.spotLight.position, 'x').name('Spot X').min(-200).max(200);
    f.add(this.spotLight.position, 'y').name('Spot Y').min(-200).max(200);
    f.add(this.spotLight.position, 'z').name('Spot Z').min(-200).max(200);
    f.addColor(this.params, 'spotLightColor').name('Spot Color').onChange((v: number) => this.spotLight.color.set(v));
    f.addColor(this.params, 'ambLightColor').name('Ambient Color').onChange((v: number) => this.ambientLight.color.set(v));
    f.close();

    f = this.gui.addFolder('Camera');
    f.add(this.camera.position, 'x').name('Camera X').min(-200).max(200);
    f.add(this.camera.position, 'y').name('Camera Y').min(-200).max(200);
    f.add(this.camera.position, 'z').name('Camera Z').min(-200).max(200);
    f.close();

    f = this.gui.addFolder('Earth');
    f.add(this.params, 'oceanVisible');
    f.add(this.params, 'oceanSpeed', -0.001, 0.001);
    f.add(this.params, 'earthSpeed', -0.001, 0.001);
    f.add(this.params, 'earthRoughness', 0.0, 2.0);
    f.add(this.params, 'earthLacunarity', 0.0, 2.0);
    f.add(this.params, 'earthRotationX', -0.05, 0.05);
    f.add(this.params, 'earthRotationY', -0.05, 0.05);
    f.add(this.params, 'earthRotationZ', -0.05, 0.05);
    f.close();

    f = this.gui.addFolder('Clouds');
    f.add(this.params, 'cloudsVisible');
    f.add(this.params, 'cloudSpeed', 0.0, 0.001);
    f.add(this.params, 'cloudRangeFactor', 0.0, 3.0);
    f.add(this.params, 'cloudSmoothness', 0.0, 3.0);
    f.add(this.params, 'cloudRotationX', -0.05, 0.05);
    f.add(this.params, 'cloudRotationY', -0.05, 0.05);
    f.add(this.params, 'cloudRotationZ', -0.05, 0.05);
    f.close();

    f = this.gui.addFolder('Moon');
    f.add(this.params, 'moonVisible');
    f.add(this.params, 'moonSpeed', -0.05, 0.05);
    f.add(this.params, 'moonRoughness', 0.0, 2.0);
    f.add(this.params, 'moonLacunarity', 0.0, 2.0);
    f.close();
  }

  private makePlanetUniforms(opts: {
    radius: number;
    roughness: number;
    lacunarity: number;
    textures?: Record<string, THREE.Texture>;
    extra?: Record<string, { value: unknown }>;
  }): Record<string, { value: unknown }> {
    return {
      ...(opts.textures ? Object.fromEntries(Object.entries(opts.textures).map(([k, v]) => [k, { value: v }])) : {}),
      lightPosition: { value: this.dirLight.position },
      lightColor: { value: this.dirLightColor },
      lightIntensity: { value: this.dirLight.intensity },
      time: { value: 0.0 },
      radius: { value: opts.radius },
      roughness: { value: opts.roughness },
      lacunarity: { value: opts.lacunarity },
      ...(opts.extra ?? {}),
    };
  }

  private setupPlanetEarth(): void {
    const ATMOSPHERE_RADIUS = EARTH_RADIUS * 1.075;
    const CLOUDS_RADIUS = EARTH_RADIUS * 1.06;
    const IMAGE_RES = 1024.0;
    const loader = new THREE.TextureLoader();

    this.earthPivotPoint = new THREE.Object3D();

    const waterNormals = loader.load(imgWaterNormals);
    waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;

    this.earthMesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(EARTH_RADIUS, N),
      new THREE.ShaderMaterial({
        uniforms: this.makePlanetUniforms({
          radius: EARTH_RADIUS,
          roughness: this.params.earthRoughness,
          lacunarity: this.params.earthLacunarity,
          textures: {
            texWater: loader.load(imgWater),
            texSand: loader.load(imgSand),
            texGrass: loader.load(imgGrass),
            texStone: loader.load(imgStone),
            texSnow: loader.load(imgSnow),
          },
        }),
        vertexShader: terrainVertShader,
        fragmentShader: terrainFragShader,
      })
    );
    this.earthMesh.castShadow = true;
    this.earthMesh.receiveShadow = true;
    this.earthMesh.add(this.earthPivotPoint);

    this.oceanMesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(EARTH_RADIUS, N),
      new THREE.ShaderMaterial({
        uniforms: this.makePlanetUniforms({
          radius: EARTH_RADIUS * 1.0001,
          roughness: this.params.earthRoughness * 2.7,
          lacunarity: this.params.earthLacunarity * 3.14,
          textures: { texWater: waterNormals },
        }),
        vertexShader: standardVertShader,
        fragmentShader: waterFragShader,
      })
    );
    this.oceanMesh.castShadow = true;
    this.oceanMesh.receiveShadow = true;
    this.earthMesh.add(this.oceanMesh);

    this.atmosphereMesh = new THREE.Mesh(
      new THREE.SphereGeometry(ATMOSPHERE_RADIUS, TWO_N, TWO_N),
      new THREE.ShaderMaterial({
        uniforms: this.makePlanetUniforms({
          radius: ATMOSPHERE_RADIUS,
          roughness: this.params.earthRoughness,
          lacunarity: this.params.earthLacunarity,
        }),
        vertexShader: standardVertShader,
        fragmentShader: atmosphereFragShader,
        side: THREE.BackSide,
        transparent: true,
      })
    );
    this.atmosphereMesh.castShadow = true;
    this.atmosphereMesh.receiveShadow = true;
    this.earthMesh.add(this.atmosphereMesh);

    this.cloudsMesh = new THREE.Mesh(
      new THREE.SphereGeometry(CLOUDS_RADIUS, TWO_N, TWO_N),
      new THREE.ShaderMaterial({
        uniforms: this.makePlanetUniforms({
          radius: CLOUDS_RADIUS,
          roughness: this.params.earthRoughness,
          lacunarity: this.params.earthLacunarity,
          extra: {
            resolution: { value: IMAGE_RES },
            baseColor: { value: new THREE.Vector3(0.65, 0.65, 0.65) },
            rangeFactor: { value: this.params.cloudRangeFactor },
            smoothness: { value: this.params.cloudSmoothness },
            seed: { value: this.random() * 7 },
          },
        }),
        vertexShader: standardVertShader,
        fragmentShader: cloudsFragShader,
        side: THREE.DoubleSide,
        transparent: true,
      })
    );
    this.cloudsMesh.castShadow = true;
    this.cloudsMesh.receiveShadow = true;
    this.earthMesh.add(this.cloudsMesh);

    this.scene.add(this.earthMesh);
  }

  private setupEarthMoon(): void {
    const MOON_RADIUS = EARTH_RADIUS * 0.27;
    const MOON_POS_X = EARTH_RADIUS * 3.5;
    const loader = new THREE.TextureLoader();
    const moonTexture = loader.load(imgMoon);

    this.moonMesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(MOON_RADIUS, N),
      new THREE.ShaderMaterial({
        uniforms: this.makePlanetUniforms({
          radius: MOON_RADIUS,
          roughness: this.params.moonRoughness,
          lacunarity: this.params.moonLacunarity,
          textures: {
            texWater: moonTexture,
            texSand: moonTexture,
            texGrass: moonTexture,
            texStone: moonTexture,
            texSnow: moonTexture,
          },
        }),
        vertexShader: terrainVertShader,
        fragmentShader: terrainFragShader,
      })
    );
    this.moonMesh.position.set(MOON_POS_X, 0, 0);
    this.scene.add(this.moonMesh);
    this.earthPivotPoint.add(this.moonMesh);
  }

  private setupEarth(): void {
    this.setupPlanetEarth();
    this.setupEarthMoon();
  }

  private setupParticleSystem(): void {
    const STAR_RADIUS = EARTH_RADIUS * 50;
    const STAR_SPREAD = EARTH_RADIUS * 4;
    const PARTICLE_COUNT = 500;

    const loader = new THREE.TextureLoader();
    const bgTexture = loader.load(imgSpaceStar);

    const positions = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const sphere = STAR_RADIUS + this.random() * STAR_SPREAD;
      const theta = 2 * Math.PI * this.random();
      const phi = Math.acos(1 - 2 * this.random());
      positions[i * 3] = sphere * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = sphere * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = sphere * Math.cos(phi);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      size: 32,
      map: bgTexture,
      transparent: true,
      alphaTest: 0.5,
    });

    this.particleSystem = new THREE.Points(geometry, material);
    this.scene.add(this.particleSystem);
  }

  private setupSkyBox(): void {
    const SPACESKY_RADIUS = EARTH_RADIUS * 150.0;
    const textureCube = new THREE.CubeTextureLoader().load([
      imgSkyboxPx, imgSkyboxNx,
      imgSkyboxPy, imgSkyboxNy,
      imgSkyboxPz, imgSkyboxNz,
    ]);

    this.spaceskyMesh = new THREE.Mesh(
      new THREE.SphereGeometry(SPACESKY_RADIUS, TWO_N, TWO_N),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        envMap: textureCube,
        side: THREE.BackSide,
        transparent: true,
      })
    );
    this.scene.add(this.spaceskyMesh);
  }

  private update(): void {
    this.delta += 0.1;
    this.particleSystem.rotation.y += this.params.starSpeed;

    const delta = Date.now() - this.startTime;
    const earthMat = this.earthMesh.material as THREE.ShaderMaterial;
    const oceanMat = this.oceanMesh.material as THREE.ShaderMaterial;
    const cloudsMat = this.cloudsMesh.material as THREE.ShaderMaterial;
    const moonMat = this.moonMesh.material as THREE.ShaderMaterial;

    this.moonMesh.visible = this.params.moonVisible;
    moonMat.uniforms['time'].value = this.params.moonSpeed * delta;
    moonMat.uniforms['roughness'].value = this.params.moonRoughness;
    moonMat.uniforms['lacunarity'].value = this.params.moonLacunarity;

    earthMat.uniforms['time'].value = this.params.earthSpeed * delta;
    earthMat.uniforms['roughness'].value = this.params.earthRoughness;
    earthMat.uniforms['lacunarity'].value = this.params.earthLacunarity;

    oceanMat.uniforms['time'].value = this.params.oceanSpeed * delta;
    this.oceanMesh.visible = this.params.oceanVisible;

    cloudsMat.uniforms['time'].value = this.params.cloudSpeed * delta;
    this.cloudsMesh.visible = this.params.cloudsVisible;
    cloudsMat.uniforms['rangeFactor'].value = this.params.cloudRangeFactor;
    cloudsMat.uniforms['smoothness'].value = this.params.cloudSmoothness;
    this.cloudsMesh.rotation.x += this.params.cloudRotationX;
    this.cloudsMesh.rotation.y += this.params.cloudRotationY;
    this.cloudsMesh.rotation.z += this.params.cloudRotationZ;

    if (this.params.rotate) {
      this.earthMesh.rotation.x += this.params.earthRotationX;
      this.earthMesh.rotation.y += this.params.earthRotationY;
      this.earthMesh.rotation.z += this.params.earthRotationZ;
    }
  }
}
