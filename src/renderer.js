import GlRenderer from 'gl-renderer';
import CanvasRenderer from './canvas-renderer';
import compress from './utils/compress';
import createText from './utils/create-text';
import {normalize, denormalize} from './utils/positions';
import {drawMesh2D, createCanvas, applyFilter} from './utils/canvas';
import Mesh2D from './mesh2d';

import {createShaders, applyShader, createCloudShaders, applyCloudShader} from './utils/shader-creator';

const defaultOpts = {
  autoUpdate: false,
  premultipliedAlpha: false,
  preserveDrawingBuffer: false,
};

const _glRenderer = Symbol('glRenderer');
const _canvasRenderer = Symbol('canvasRenderer');
const _options = Symbol('options');

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
    let contextType = opts.contextType || 'webgl';
    if(typeof WebGLRenderingContext !== 'function') {
      contextType = '2d';
    }
    if(!canvas.getContext) { // 小程序
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
    this.programs = {};

    if(contextType === 'webgl' || contextType === 'webgl2') {
      if(contextType === 'webgl2') this[_options].webgl2 = true;
      const renderer = new GlRenderer(canvas, this[_options]);

      createShaders(renderer);
      applyShader(renderer);
      createCloudShaders(renderer);

      const gl = renderer.gl;
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
      gl.clear(gl.COLOR_BUFFER_BIT);
      this[_glRenderer] = renderer;
    } else {
      this[_canvasRenderer] = new CanvasRenderer(canvas, this[_options]);
    }
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
      const img = await createText(text, {font, fillColor, strokeColor}, this[_options].contextType === 'webgl');
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
      const hasGlobalTransform = false;
      const hasCloudColor = cloud.hasCloudColor;
      const hasCloudFilter = true;
      applyCloudShader(renderer, {hasTexture, hasFilter, hasGradient, hasGlobalTransform, hasCloudColor, hasCloudFilter});
      if(clear) gl.clear(gl.COLOR_BUFFER_BIT);
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
        cloudMeshes.push({mesh: cloud.mesh, _cloudOptions: [fill, stroke, frame, transform, filter]});
        // console.log(transform, colorTransform, frame);
      }
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
              } else if(filterContext._filter === currentFilter) { // 把前面的filter合并一下
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
            const hasGlobalTransform = false;
            applyShader(renderer, {hasTexture, hasFilter, hasGradient, hasGlobalTransform});
            renderer.setMeshData([mesh]);
            renderer._draw();
          }
        }
      } else {
        renderer.setMeshData(meshData);
      }
    } else {
      renderer.drawMeshes(meshes, {clear});
    }
  }
}