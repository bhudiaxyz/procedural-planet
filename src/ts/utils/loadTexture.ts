import * as THREE from 'three';
import loadImg from 'load-img';

type LoadTextureOptions = {
  encoding?: string;
  flipY?: boolean;
  mapping?: THREE.Mapping;
  format?: THREE.PixelFormat;
  repeat?: THREE.Vector2;
  wrapS?: THREE.Wrapping;
  wrapT?: THREE.Wrapping;
  minFilter?: THREE.MinificationTextureFilter;
  magFilter?: THREE.MagnificationTextureFilter;
  generateMipmaps?: boolean;
  renderer?: THREE.WebGLRenderer;
};

type Callback = (err: Error | null, texture?: THREE.Texture) => void;

export default function loadTexture(
  src: string,
  opt: LoadTextureOptions | Callback = {},
  cb?: Callback
): THREE.Texture {
  if (typeof opt === 'function') {
    cb = opt;
    opt = {};
  }
  const options = { ...opt } as LoadTextureOptions;
  const done: Callback = cb || (() => {});

  const texture = new THREE.Texture();
  texture.name = src;
  setTextureParams(src, texture, options);

  loadImg(src, { crossOrigin: 'Anonymous' }, (err: Error | null, image: HTMLImageElement) => {
    if (err) {
      const msg = `Could not load texture ${src}`;
      console.error(msg);
      return done(new Error(msg));
    }
    texture.image = image;
    texture.needsUpdate = true;
    if (options.renderer) {
      options.renderer.initTexture(texture);
    }
    done(null, texture);
  });

  return texture;
}

function setTextureParams(url: string, texture: THREE.Texture, opt: LoadTextureOptions): void {
  if (typeof opt.flipY === 'boolean') texture.flipY = opt.flipY;
  if (opt.mapping !== undefined) texture.mapping = opt.mapping;
  if (opt.repeat) texture.repeat.copy(opt.repeat);
  texture.wrapS = opt.wrapS ?? THREE.ClampToEdgeWrapping;
  texture.wrapT = opt.wrapT ?? THREE.ClampToEdgeWrapping;
  texture.minFilter = opt.minFilter ?? THREE.LinearMipMapLinearFilter;
  texture.magFilter = opt.magFilter ?? THREE.LinearFilter;
  texture.generateMipmaps = opt.generateMipmaps !== false;
}
