import GlRenderer from 'gl-renderer';
import {mat2d} from 'gl-matrix';
import CanvasRenderer from './canvas-renderer';
import compress from './utils/compress';
import createText from './utils/create-text';
import {normalize, denormalize} from './utils/positions';
import {drawMesh2D, createCanvas, applyFilter} from './utils/canvas';
import Mesh2D from './mesh2d';

import {
  createShaders,
  applyShader,
  createCloudShaders,
  applyCloudShader,
} from './utils/shader-creator';

const defaultOpts = {
  autoUpdate: false,
  premultipliedAlpha: true,
  preserveDrawingBuffer: false,
  // depth: false,
  antialias: false,
};

const _glRenderer = Symbol('glRenderer');
const _canvasRenderer = Symbol('canvasRenderer');
const _options = Symbol('options');
const _globalTransform = Symbol('globalTransform');
const _applyGlobalTransform = Symbol('applyGlobalTransform');

function drawFilterContext(renderer, filterContext, width, height) {
  const filterTexture = renderer.createTexture(filterContext.canvas);

  const contours = [[[0, 0], [width, 0], [width, height], [0, height], [0, 0]]];
  contours.closed = true;
  const filterMesh = new Mesh2D({contours}, {width, height});

  filterMesh.setTexture(filterTexture);
  renderer.setMeshData([filterMesh.meshData]);
  renderer._draw();
  filterTexture.delete();
  filterContext.clearRect(0, 0, width, height);
  delete filterContext._filter;
}

function isUnitTransform(m) {
  return m[0] === 1 && m[1] === 0 && m[2] === 0 && m[3] === 1 && m[4] === 0 && m[5] === 0;
}

export default class Renderer {
  constructor(canvas, opts = {}) {
    let contextType = opts.contextType || 'webgl';
    if(typeof WebGLRenderingContext !== 'function') {
      contextType = '2d';
    }
    if(!canvas.getContext) {
      // 小程序
      const context = canvas;
      canvas = {
        getContext() {
          return context;
        },
        width: opts.width,
        height: opts.height,
      };
      context.canvas = canvas;
      contextType = '2d';
    }
    this.canvas = canvas;

    if(contextType !== 'webgl' && contextType !== 'webgl2' && contextType !== '2d') {
      throw new Error(`Unknown context type ${contextType}`);
    }
    opts.contextType = contextType;

    this[_options] = Object.assign({}, defaultOpts, opts);

    if(contextType === 'webgl' || contextType === 'webgl2') {
      if(contextType === 'webgl2') this[_options].webgl2 = true;
      const renderer = new GlRenderer(canvas, this[_options]);

      createShaders(renderer);
      applyShader(renderer);
      createCloudShaders(renderer);

      const gl = renderer.gl;
      // gl.clearColor(1.0, 1.0, 1.0, 1.0);
      // gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
      gl.clearColor(0.0, 0.0, 0.0, 0.0);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      this[_glRenderer] = renderer;
    } else {
      this[_canvasRenderer] = new CanvasRenderer(canvas, this[_options]);
    }

    this[_globalTransform] = [1, 0, 0, 1, 0, 0];
  }

  get textureEnabled() {
    return this[_glRenderer] && this[_glRenderer].textures.length > 0;
  }

  get options() {
    return this[_options];
  }

  get glRenderer() {
    return this[_glRenderer];
  }

  get isWebGL2() {
    return this[_glRenderer] && this[_glRenderer].isWebGL2;
  }

  get canvasRenderer() {
    return this[_canvasRenderer];
  }

  normalize(x, y) {
    const {width, height} = this.canvas;
    return normalize([x, y], width, height);
  }

  denormalize(x, y) {
    const {width, height} = this.canvas;
    return denormalize([x, y], width, height);
  }

  async createText(text, {font = '16px arial', fillColor = null, strokeColor = null} = {}) {
    if(this[_glRenderer]) {
      const img = await createText(
        text,
        {font, fillColor, strokeColor},
        this[_options].contextType === 'webgl'
      );
      return this.createTexture(img);
    }
    return {_img: {font, fillColor, strokeColor, text}};
  }

  createTexture(img) {
    const renderer = this[_glRenderer] || this[_canvasRenderer];
    return renderer.createTexture(img);
  }

  loadTexture(textureURL, {useImageBitmap = false} = {}) {
    const renderer = this[_glRenderer] || this[_canvasRenderer];
    return renderer.loadTexture(textureURL, {useImageBitmap});
  }

  deleteTexture(texture) {
    const renderer = this[_glRenderer] || this[_canvasRenderer];
    return renderer.deleteTexture(texture);
  }

  clear(...rect) {
    if(this[_glRenderer]) {
      const gl = this[_glRenderer].gl;
      gl.clear(gl.COLOR_BUFFER_BIT);
    } else {
      this[_canvasRenderer].clear(...rect);
    }
  }

  drawMeshCloud(cloud, {clear = false} = {}) {
    const renderer = this[_glRenderer] || this[_canvasRenderer];
    // if(!this.isWebGL2) throw new Error('Only webgl2 context support drawMeshCloud.');
    if(this[_glRenderer]) {
      const gl = renderer.gl;
      const mesh = cloud.mesh.meshData;

      const hasTexture = this.textureEnabled;
      const hasFilter = !!mesh.uniforms.u_filterFlag;
      const vector = mesh.uniforms.u_radialGradientVector;
      const hasGradient = vector[2] > 0 || vector[5] > 0;
      const hasGlobalTransform = !isUnitTransform(this[_globalTransform]);
      const hasCloudColor = cloud.hasCloudColor;
      const hasCloudFilter = true;
      applyCloudShader(renderer, {
        hasTexture,
        hasFilter,
        hasGradient,
        hasGlobalTransform,
        hasCloudColor,
        hasCloudFilter,
      });
      if(clear) gl.clear(gl.COLOR_BUFFER_BIT);
      this[_applyGlobalTransform](this[_globalTransform]);
      renderer.setMeshData(cloud.meshData);
      renderer._draw();
    } else {
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
      renderer.setTransform(this[_globalTransform]);
      renderer.drawMeshes(cloudMeshes, {clear});
    }
  }

  drawMeshes(meshes, {clear = false} = {}) {
    const renderer = this[_glRenderer] || this[_canvasRenderer];
    if(this[_glRenderer]) {
      const meshData = compress(this, meshes);
      if(!renderer.options.autoUpdate) {
        const gl = renderer.gl;
        if(clear) gl.clear(gl.COLOR_BUFFER_BIT);
        for(let i = 0; i < meshData.length; i++) {
          const mesh = meshData[i];
          if(mesh.filterCanvas) {
            applyShader(renderer, {hasTexture: true});
            const {width, height} = this.canvas;
            let filterContext = this.filterContext;
            if(!filterContext) {
              const canvas = createCanvas(width, height);
              filterContext = canvas.getContext('2d');
              this.filterContext = filterContext;
            }
            const originalMesh = meshes[mesh.packIndex];
            const nextMesh = meshes[mesh.packIndex + 1];
            if(nextMesh && nextMesh.filterCanvas) {
              const currentFilter = originalMesh.filter;
              const nextFilter = nextMesh.filter;
              if(nextFilter === currentFilter) {
                // 如果 filter 一样，可以合并绘制（这样的话比较节约性能）
                if(filterContext._filter === 'combine') {
                  // 之前已经 apply 过 filter
                  drawFilterContext(renderer, filterContext, width, height);
                }
                filterContext._filter = currentFilter;
                drawMesh2D(originalMesh, filterContext, false);
              } else if(filterContext._filter === currentFilter) {
                // 把前面的filter合并一下
                drawMesh2D(originalMesh, filterContext, false);
                applyFilter(filterContext, currentFilter);
                drawFilterContext(renderer, filterContext, width, height);
              } else {
                drawMesh2D(originalMesh, filterContext, true);
                filterContext._filter = 'combine';
              }
            } else {
              if(filterContext._filter && filterContext._filter !== 'combine') {
                drawMesh2D(originalMesh, filterContext, false);
                applyFilter(filterContext, filterContext._filter);
              } else {
                drawMesh2D(originalMesh, filterContext, true);
              }
              drawFilterContext(renderer, filterContext, width, height);
            }
          } else {
            const hasTexture = this.textureEnabled;
            const hasFilter = !!mesh.uniforms.u_filterFlag;
            const vector = mesh.uniforms.u_radialGradientVector;
            const hasGradient = vector[2] > 0 || vector[5] > 0;
            const hasGlobalTransform = !isUnitTransform(this[_globalTransform]);
            applyShader(renderer, {hasTexture, hasFilter, hasGradient, hasGlobalTransform});
            this[_applyGlobalTransform](this[_globalTransform]);
            renderer.setMeshData([mesh]);
            renderer._draw();
          }
        }
      } else {
        renderer.setMeshData(meshData);
      }
    } else {
      renderer.setTransform(this[_globalTransform]);
      renderer.drawMeshes(meshes, {clear});
    }
  }

  [_applyGlobalTransform](m) {
    const renderer = this[_glRenderer] || this[_canvasRenderer];
    if(this[_glRenderer]) {
      const {width, height} = this.canvas;
      renderer.uniforms.u_globalTransform = [...m.slice(0, 3), width, ...m.slice(3), height];
    } else {
      renderer.setTransform(m);
    }
  }

  setGlobalTransform(...m) {
    const transform = this[_globalTransform];
    this[_globalTransform] = m;
    m = mat2d(m) * mat2d.invert(transform);
    this[_applyGlobalTransform](m);
    return this;
  }

  globalTransform(...m) {
    const transform = this[_globalTransform];
    this[_globalTransform] = mat2d(m) * mat2d(transform);
    this[_applyGlobalTransform](m);
    return this;
  }

  globalTranslate(x, y) {
    let m = mat2d.create();
    m = mat2d.translate(m, [x, y]);
    return this.globalTransform(...m);
  }

  globalRotate(rad, [ox, oy] = [0, 0]) {
    let m = mat2d.create();
    m = mat2d.translate(m, [ox, oy]);
    m = mat2d.rotate(m, rad);
    m = mat2d.translate(m, [-ox, -oy]);
    return this.globalTransform(...m);
  }

  globalScale(x, y = x, [ox, oy] = [0, 0]) {
    let m = mat2d.create();
    m = mat2d.translate(m, [ox, oy]);
    m = mat2d.scale(m, [x, y]);
    m = mat2d.translate(m, [-ox, -oy]);
    return this.globalTransform(...m);
  }

  globalSkew(x, y = x, [ox, oy] = [0, 0]) {
    let m = mat2d.create();
    m = mat2d.translate(m, [ox, oy]);
    m = mat2d(m) * mat2d(1, Math.tan(y), Math.tan(x), 1, 0, 0);
    m = mat2d.translate(m, [-ox, -oy]);
    return this.globalTransform(...m);
  }

  transformPoint(x, y) {
    const m = this[_globalTransform];
    const {width: w, height: h} = this.canvas;
    const newX = x * m[0] + y * m[2] + m[4];
    const newY = x * m[1] + y * m[3] + m[5];
    const p = normalize([newX, newY], w, h);
    return p;
  }
}
