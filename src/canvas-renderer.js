import loadImage from './utils/load-image';
import {drawMesh2D} from './utils/canvas';

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

  drawMeshes(meshes, {clearBuffer = true} = {}) {
    const context = this.context;
    if(clearBuffer) {
      context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    }
    meshes.forEach((mesh) => {
      // TODO: merge filter
      drawMesh2D(mesh, context);
    });
  }
}