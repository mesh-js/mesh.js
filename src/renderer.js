import GlRenderer from 'gl-renderer';
import {mat2d} from 'gl-matrix';
import CanvasRenderer from './canvas-renderer';
import compress from './utils/compress';
import createText from './utils/create-text';
import {drawMesh2D, applyFilter} from './utils/canvas';
import Figure2D from './figure2d';
import Mesh2D from './mesh2d';
import MeshCloud from './mesh-cloud';
import {isUnitTransform} from './utils/transform';
import ENV from './utils/env';

import {
  createShaders,
  applyShader,
  createCloudShaders,
  applyCloudShader,
} from './utils/shader-creator';

const defaultOpts = {
  autoUpdate: false,
  // premultipliedAlpha: true,
  preserveDrawingBuffer: false,
  // depth: false,
  // antialias: false,
  bufferSize: 1500,
};

const _glRenderer = Symbol('glRenderer');
const _canvasRenderer = Symbol('canvasRenderer');
const _options = Symbol('options');
const _globalTransform = Symbol('globalTransform');
const _applyGlobalTransform = Symbol('applyGlobalTransform');
const _canvas = Symbol('canvas');

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

export default class Renderer {
  constructor(canvas, opts = {}) {
    let contextType = opts.contextType;
    if(!contextType) {
      if(typeof WebGL2RenderingContext === 'function') {
        contextType = 'webgl2';
      } else if(typeof WebGLRenderingContext === 'function') {
        contextType = 'webgl';
      } else {
        contextType = '2d';
      }
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
    this[_canvas] = canvas;

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

  get canvas() {
    return this[_canvas];
  }

  get canvasRenderer() {
    return this[_canvasRenderer];
  }

  get glRenderer() {
    return this[_glRenderer];
  }

  get isWebGL2() {
    return this[_glRenderer] && this[_glRenderer].isWebGL2;
  }

  get options() {
    return this[_options];
  }

  get globalTransformMatrix() {
    return this[_globalTransform];
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

  createTexture(img) {
    const renderer = this[_glRenderer] || this[_canvasRenderer];
    return renderer.createTexture(img);
  }

  /* async */ loadTexture(textureURL, {useImageBitmap = false} = {}) {
    const renderer = this[_glRenderer] || this[_canvasRenderer];
    return renderer.loadTexture(textureURL, {useImageBitmap});
  }

  createText(text, {font = '16px arial', fillColor = null, strokeColor = null, strokeWidth = 1} = {}) {
    if(this[_glRenderer]) {
      const img = createText(
        text,
        {font, fillColor, strokeColor}
      );
      return this.createTexture(img);
    }
    return {_img: {font, fillColor, strokeColor, text}};
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

  drawMeshCloud(cloud, {clear = false, program = null, attributeOptions = {}} = {}) {
    const renderer = this[_glRenderer] || this[_canvasRenderer];
    // if(!this.isWebGL2) throw new Error('Only webgl2 context support drawMeshCloud.');
    if(this[_glRenderer]) {
      const gl = renderer.gl;
      if(clear) gl.clear(gl.COLOR_BUFFER_BIT);
      if(!program) {
        const mesh = cloud.mesh.meshData;
        const hasTexture = !!mesh.uniforms.u_texSampler;
        const hasFilter = !!mesh.uniforms.u_filterFlag;
        const hasGradient = !!mesh.uniforms.u_radialGradientVector;
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
      } else if(renderer.program !== program) {
        renderer.useProgram(program, Object.assign({
          a_color: {
            type: 'UNSIGNED_BYTE',
            normalize: true,
          },
          a_fillCloudColor: {
            type: 'UNSIGNED_BYTE',
            normalize: true,
          },
          a_strokeCloudColor: {
            type: 'UNSIGNED_BYTE',
            normalize: true,
          },
        }, attributeOptions));
      }
      this[_applyGlobalTransform](this[_globalTransform]);
      renderer.setMeshData([cloud.meshData]);
      if(cloud.beforeRender) cloud.beforeRender(gl, cloud);
      renderer._draw();
      if(cloud.afterRender) cloud.afterRender(gl, cloud);
    } else {
      renderer.setTransform(this[_globalTransform]);
      renderer.drawMeshCloud(cloud, {clear, hook: false});
    }
  }

  drawMeshes(meshes, {clear = false, program = null, attributeOptions = {}} = {}) { // eslint-disable-line complexity
    const renderer = this[_glRenderer] || this[_canvasRenderer];
    if(this[_glRenderer]) {
      const meshData = compress(this, meshes, program == null);
      const gl = renderer.gl;
      if(clear) gl.clear(gl.COLOR_BUFFER_BIT);
      const hasGlobalTransform = !isUnitTransform(this[_globalTransform]);
      this._drawCalls = 0;
      for(const mesh of meshData) { // eslint-disable-line no-restricted-syntax
        this._drawCalls++;
        if(mesh instanceof MeshCloud) {
          this.drawMeshCloud(mesh, {clear, program, attributeOptions});
          // continue; // eslint-disable-line no-continue
        } else {
          if(mesh.beforeRender) mesh.beforeRender(gl, mesh);
          if(!program && mesh.filterCanvas) { // 有一些滤镜用shader不好实现：blur、drop-shadow、url
            applyShader(renderer, {hasTexture: true});
            const {width, height} = this.canvas;
            let filterContext = this.filterContext;
            if(!filterContext) {
              const canvas = ENV.createCanvas(width, height);
              filterContext = canvas.getContext('2d');
              this.filterContext = filterContext;
            }
            const originalMesh = meshes[mesh.packIndex];
            const currentFilter = originalMesh.filter;
            const nextMesh = meshes[mesh.packIndex + 1];
            const previousMesh = meshes[mesh.packIndex - 1];
            if((!previousMesh || !previousMesh.filterCanvas || previousMesh.filter !== currentFilter)
              && (!nextMesh || !nextMesh.filterCanvas || nextMesh.filter !== currentFilter)) {
              if(hasGlobalTransform) {
                filterContext.save();
                filterContext.transform(...this[_globalTransform]);
                drawMesh2D(originalMesh, filterContext, false);
                filterContext.restore();
                applyFilter(filterContext, currentFilter);
              } else {
                drawMesh2D(originalMesh, filterContext, true);
              }
              drawFilterContext(renderer, filterContext, width, height);
            } else {
              if(hasGlobalTransform) {
                filterContext.save();
                filterContext.transform(...this[_globalTransform]);
              }
              drawMesh2D(originalMesh, filterContext, false);
              if(hasGlobalTransform) {
                filterContext.restore();
              }
              if(!nextMesh || !nextMesh.filterCanvas || originalMesh.filter !== nextMesh.filter) {
                applyFilter(filterContext, currentFilter);
                drawFilterContext(renderer, filterContext, width, height);
              }
            }
          } else {
            if(!program) {
              const hasTexture = !!mesh.uniforms.u_texSampler;
              const hasFilter = !!mesh.uniforms.u_filterFlag;
              const hasGradient = !!mesh.uniforms.u_radialGradientVector;
              applyShader(renderer, {hasTexture, hasFilter, hasGradient, hasGlobalTransform});
            } else if(renderer.program !== program) {
              renderer.useProgram(program, Object.assign({
                a_color: {
                  type: 'UNSIGNED_BYTE',
                  normalize: true,
                },
              }, attributeOptions));
            }
            if(mesh.filterCanvas) {
              console.warn('User program ignored some filter effects.');
            }
            this[_applyGlobalTransform](this[_globalTransform]);
            renderer.setMeshData([mesh]);
            renderer._draw();
          }
          if(mesh.afterRender) mesh.afterRender(gl, mesh);
        }
      }
    } else {
      renderer.setTransform(this[_globalTransform]);
      renderer.drawMeshes(meshes, {clear});
    }
  }

  drawImage(image, ...args) {
    const argLength = args.length;
    if(argLength < 2) {
      throw new TypeError(`Failed to execute 'drawImage' on 'Renderer': 3 arguments required, but only ${args.length + 1} present.`);
    }
    if(argLength !== 2 && argLength !== 4 && argLength !== 8) {
      throw new TypeError(`Failed to execute 'drawImage' on 'Renderer': Valid arities are: [3, 5, 9], but ${args.length + 1} arguments provided.`);
    }
    let rect = null;
    let srcRect = null;
    if(argLength === 2) { // drawImage(image, dx, dy)
      rect = [args[0], args[1], image.width, image.height];
    } else if(argLength === 4) { // drawImage(image, dx, dy, dWidth, dHeight)
      rect = args;
    } else if(argLength === 8) { // drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
      srcRect = args.slice(0, 4);
      rect = args.slice(4);
    }
    const texture = this.createTexture(image);
    const {width, height} = this.canvas;
    const figure = new Figure2D();
    figure.rect(rect[0], rect[1], width, height);
    const mesh = new Mesh2D(figure, {width, height});
    mesh.setTexture(texture, {
      rect,
      srcRect,
    });
    this.drawMeshes([mesh]);
    this.deleteTexture(texture);
  }

  setGlobalTransform(...m) {
    const transform = this[_globalTransform];
    if(!mat2d.equals(m, transform)) {
      this[_globalTransform] = m;
      m = mat2d(m) * mat2d.invert(transform);
      this[_applyGlobalTransform](m);
    }
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

  transformPoint(x, y, matrix) {
    let m = this[_globalTransform];
    if(matrix) m = mat2d(m) * mat2d(matrix);
    const newX = x * m[0] + y * m[2] + m[4];
    const newY = x * m[1] + y * m[3] + m[5];
    return [newX, newY];
  }
}
