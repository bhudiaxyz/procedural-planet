import 'bootstrap';
import '../scss/index.scss';

import WEBGL from './vendor/WebGL';
import Application from './app';

(() => {
  window.addEventListener('load', () => {
    if (WEBGL.isWebGLAvailable()) {
      let container = document.getElementById('canvas-container') as HTMLElement | null;
      if (!container) {
        container = document.createElement('div');
        container.setAttribute('class', 'container');
        container.setAttribute('id', 'canvas-container');
        document.body.appendChild(container);
      }
      const app = new Application({ container });
      app.animate();
    } else {
      const warning = WEBGL.getWebGLErrorMessage();
      document.body.appendChild(warning);
    }
  });
})();
