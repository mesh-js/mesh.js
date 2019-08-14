import loadImage from './utils/load-image';
import {drawMesh2D, createCanvas, applyFilter} from './utils/canvas';

export default class CanvasRenderer {
  constructor(canvas, options) {
    this.context = canvas.getContext('2d');
    this.options = options;
  }

  createTexture(img) {
    const texture = {_img: img};
    return texture;
  }

  async loadTexture(textureURL) {
    const image = await loadImage(textureURL);
    return this.createTexture(image);
  }

  deleteTexture(texture) {
    return texture;
  }

  clear(x, y, w, h) {
    const context = this.context;
    x = x || 0;
    y = y || 0;
    w = w || context.canvas.width - x;
    h = h || context.canvas.height - y;
    context.clearRect(x, y, w, h);
  }

  drawMeshes(meshes, {clear = false} = {}) {
    const context = this.context;
    if(clear) {
      context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    }
    let lastFilter = null;
    const {width, height} = context.canvas;
    const len = meshes.length;
    meshes.forEach((mesh, i) => {
      // TODO: merge filter
      const filter = mesh.filter;
      if(lastFilter && lastFilter !== filter) {
        applyFilter(this.filterBuffer, lastFilter);
        context.drawImage(this.filterBuffer.canvas, 0, 0, width, height);
        this.filterBuffer.clearRect(0, 0, width, height);
        lastFilter = null;
      }
      if(filter) {
        this.filterBuffer = this.filterBuffer || createCanvas(width, height).getContext('2d');
        drawMesh2D(mesh, this.filterBuffer, false);
        if(i === len - 1) {
          applyFilter(this.filterBuffer, filter);
          context.drawImage(this.filterBuffer.canvas, 0, 0, width, height);
          this.filterBuffer.clearRect(0, 0, width, height);
        } else {
          lastFilter = filter;
        }
      } else {
        drawMesh2D(mesh, context);
      }
    });
  }
}