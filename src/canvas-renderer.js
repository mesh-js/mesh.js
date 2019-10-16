import GlRenderer from 'gl-renderer';
import {drawMesh2D, createCanvas, applyFilter} from './utils/canvas';

const _transform = Symbol('transform');

export default class CanvasRenderer {
  constructor(canvas, options) {
    this.context = canvas.getContext('2d');
    this.options = options;
    this[_transform] = [1, 0, 0, 1, 0, 0];
  }

  createTexture(img) {
    const texture = {_img: img};
    return texture;
  }

  async loadTexture(textureURL) {
    const image = await GlRenderer.loadImage(textureURL, false);
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

  drawMeshes(meshes, {clear = false, hook = true} = {}) {
    const context = this.context;
    if(clear) {
      context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    }
    let lastFilter = null;
    const {width, height} = context.canvas;
    const len = meshes.length;

    meshes.forEach((mesh, i) => {
      let fill,
        stroke,
        frame,
        transform,
        cloudFilter;

      if(hook && mesh.beforeRender) mesh.beforeRender(context, mesh);
      if(mesh._cloudOptions) {
        [fill, stroke, frame, transform, cloudFilter] = mesh._cloudOptions;
        mesh = mesh.mesh;
      }
      let filter = mesh.filter;
      if(cloudFilter) filter = filter ? `${filter} ${cloudFilter}` : cloudFilter;
      if(lastFilter && lastFilter !== filter) {
        applyFilter(this.filterBuffer, lastFilter);
        context.drawImage(this.filterBuffer.canvas, 0, 0, width, height);
        this.filterBuffer.clearRect(0, 0, width, height);
        lastFilter = null;
      }
      if(filter) {
        this.filterBuffer = this.filterBuffer || createCanvas(width, height).getContext('2d');
        this.filterBuffer.save();
        this.filterBuffer.transform(...this[_transform]);
        // console.log(this[_transform]);
        drawMesh2D(mesh, this.filterBuffer, false, fill, stroke, frame, transform);
        this.filterBuffer.restore();
        if(i === len - 1) {
          applyFilter(this.filterBuffer, filter);
          context.drawImage(this.filterBuffer.canvas, 0, 0, width, height);
          this.filterBuffer.clearRect(0, 0, width, height);
        } else {
          lastFilter = filter;
        }
      } else {
        context.save();
        context.transform(...this[_transform]);
        drawMesh2D(mesh, context, false, fill, stroke, frame, transform);
        context.restore();
      }
      if(hook && mesh.afterRender) mesh.afterRender(context, mesh);
    });
  }

  setTransform(transform) {
    this[_transform] = transform;
  }
}
