import ENV from './utils/env';
import {drawMesh2D, applyFilter} from './utils/canvas';

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
    const image = await ENV.loadImage(textureURL, {useImageBitmap: false});
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

  drawMeshCloud(cloud, {clear = false} = {}) {
    const cloudMeshes = [];
    for(let i = 0; i < cloud.amount; i++) {
      const transform = cloud.getTransform(i);
      let frame = cloud.getTextureFrame(i);
      if(frame) frame = frame._img;
      const filter = cloud.getFilter(i);
      const {fill, stroke} = cloud.getCloudRGBA(i);
      cloudMeshes.push({
        mesh: cloud.mesh,
        _cloudOptions: [fill, stroke, frame, transform, filter],
      });
      // console.log(transform, colorTransform, frame);
    }
    if(cloud.beforeRender) cloud.beforeRender(this.context, cloud);
    this.drawMeshes(cloudMeshes, {clear, hook: false});
    if(cloud.afterRender) cloud.afterRender(this.context, cloud);
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

      if(filter && !this.filterBuffer && this.filterBuffer !== false) {
        const canvas = ENV.createCanvas(width, height);
        if(canvas) {
          this.filterBuffer = canvas.getContext('2d');
        } else {
          this.filterBuffer = false;
        }
      }

      if(lastFilter && lastFilter !== filter) {
        applyFilter(this.filterBuffer, lastFilter);
        context.drawImage(this.filterBuffer.canvas, 0, 0, width, height);
        this.filterBuffer.clearRect(0, 0, width, height);
        lastFilter = null;
      }
      if(filter && this.filterBuffer) {
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
