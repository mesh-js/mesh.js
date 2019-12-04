import GlRenderer from 'gl-renderer';

const ENV = {
  createCanvas(width, height, options = {}) {
    const offscreen = options.offscreen !== false;
    let canvas;
    if(typeof global.createCanvas === 'function') {
      canvas = global.createCanvas(width, height, options);
    } else if(offscreen && typeof OffscreenCanvas === 'function') {
      canvas = new OffscreenCanvas(width, height);
    } else {
      canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
    }
    return canvas;
  },
  loadImage: GlRenderer.loadImage,
};

export default ENV;