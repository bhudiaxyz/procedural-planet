global.THREE = require('three');

import 'bootstrap';
import '../scss/index.scss';

import WEBGL from './vendor/WebGL';
import Application from "./app";

// wrap everything inside a function scope and invoke it (IIFE, a.k.a. SEAF)
(() => {
  window.addEventListener('load', () => {
    if (WEBGL.isWebGLAvailable()) {
      const opts = {
        container: document.getElementById('canvas-container'),

      };
      if (opts.container === null) {
        const div = document.createElement('div');
        div.setAttribute('class', 'container');
        div.setAttribute('id', 'canvas-container');
        document.body.appendChild(div);
        opts.container = div;
      }

      const app = new Application(opts);
      app.animate();
    } else {
      var warning = WEBGL.getWebGLErrorMessage();
      this.container.appendChild(warning);
    }
  });
})();
