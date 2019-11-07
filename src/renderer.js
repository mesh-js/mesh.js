import GlRenderer from 'gl-renderer';
import {mat2d} from 'gl-matrix';
import CanvasRenderer from './canvas-renderer';
import compress from './utils/compress';
import createText from './utils/create-text';
import {drawMesh2D, createCanvas, applyFilter} from './utils/canvas';
import Mesh2D from './mesh2d';
import {isUnitTransform} from './utils/transform';

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
      } if(typeof WebGLRenderingContext === 'function') {
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
      renderer.setMeshData(cloud.meshData);
      if(cloud.beforeRender) cloud.beforeRender(gl, cloud);
      renderer._draw();
      if(cloud.afterRender) cloud.afterRender(gl, cloud);
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
      if(cloud.beforeRender) cloud.beforeRender(renderer.context, cloud);
      renderer.drawMeshes(cloudMeshes, {clear, hook: false});
      if(cloud.afterRender) cloud.afterRender(renderer.context, cloud);
    }
  }

  drawMeshes(meshes, {clear = false, program = null, attributeOptions = {}} = {}) {
    const renderer = this[_glRenderer] || this[_canvasRenderer];
    if(this[_glRenderer]) {
      const meshData = compress(this, meshes);
      const gl = renderer.gl;
      if(clear) gl.clear(gl.COLOR_BUFFER_BIT);
      const hasGlobalTransform = !isUnitTransform(this[_globalTransform]);
      for(const mesh of meshData) { // eslint-disable-line no-restricted-syntax
        if(mesh.beforeRender) mesh.beforeRender(gl, mesh);
        if(!program && mesh.filterCanvas) { // 有一些滤镜用shader不好实现：blur、drop-shadow、url
          applyShader(renderer, {hasTexture: true});
          const {width, height} = this.canvas;
          let filterContext = this.filterContext;
          if(!filterContext) {
            const canvas = createCanvas(width, height);
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
    } else {
      renderer.setTransform(this[_globalTransform]);
      renderer.drawMeshes(meshes, {clear});
    }
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
