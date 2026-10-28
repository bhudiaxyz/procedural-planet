const WEBGL = {
  isWebGLAvailable(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  },

  isWebGL2Available(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGL2RenderingContext && canvas.getContext('webgl2'));
    } catch (e) {
      return false;
    }
  },

  getWebGLErrorMessage(): HTMLElement {
    return this.getErrorMessage(1);
  },

  getWebGL2ErrorMessage(): HTMLElement {
    return this.getErrorMessage(2);
  },

  getErrorMessage(version: 1 | 2): HTMLElement {
    const names: Record<number, string> = { 1: 'WebGL', 2: 'WebGL 2' };
    const contexts: Record<number, unknown> = {
      1: window.WebGLRenderingContext,
      2: window.WebGL2RenderingContext,
    };

    let message = 'Your $0 does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">$1</a>';
    const element = document.createElement('div');
    element.id = 'webglmessage';
    Object.assign(element.style, {
      fontFamily: 'monospace',
      fontSize: '13px',
      fontWeight: 'normal',
      textAlign: 'center',
      background: '#fff',
      color: '#000',
      padding: '1.5em',
      width: '400px',
      margin: '5em auto 0',
    });

    message = message.replace('$0', contexts[version] ? 'graphics card' : 'browser');
    message = message.replace('$1', names[version]);
    element.innerHTML = message;
    return element;
  },
};

export default WEBGL;
