import GlRenderer from 'gl-renderer';
import CanvasRenderer from './canvas-renderer';
import vertShader from './shader.vert';
import fragShader from './shader.frag';
import compress from './utils/compress';
import createText from './utils/create-text';
import {normalize, denormalize} from './utils/positions';
import {drawMesh2D, createCanvas, applyFilter} from './utils/canvas';
import Mesh2D from './mesh2d';

const defaultOpts = {
  autoUpdate: false,
  premultipliedAlpha: false,
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

    if(contextType !== 'webgl' && contextType !== '2d') {
      throw new Error(`Unknown context type ${contextType}`);
    }
    opts.contextType = contextType;

    this[_options] = Object.assign({}, defaultOpts, opts);

    if(contextType === 'webgl') {
      const renderer = new GlRenderer(canvas, this[_options]);

      const program = renderer.compileSync(fragShader, vertShader);
      renderer.useProgram(program);

      // bind default Texture to eliminate warning
      const img = document.createElement('canvas');
      img.width = 1;
      img.height = 1;
      const texture = renderer.createTexture(img);
      const gl = renderer.gl;
      // gl.enable(gl.BLEND);
      // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      // gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);

      this[_glRenderer] = renderer;
    } else {
      this[_canvasRenderer] = new CanvasRenderer(canvas, this[_options]);
    }
  }

  get options() {
    return this[_options];
  }

  get glRenderer() {
    return this[_glRenderer];
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
    const img = await createText(text, {font, fillColor, strokeColor}, this[_options].contextType === 'webgl');
    return this.createTexture(img);
  }

  createTexture(img) {
    const renderer = this[_glRenderer] || this[_canvasRenderer];
    return renderer.createTexture(img);
  }

  loadTexture(textureURL, {useImageBitmap = true} = {}) {
    const renderer = this[_glRenderer] || this[_canvasRenderer];
    return renderer.loadTexture(textureURL, {useImageBitmap});
  }

  deleteTexture(texture) {
    const renderer = this[_glRenderer] || this[_canvasRenderer];
    return renderer.deleteTexture(texture);
  }

  drawMeshes(meshes, clearBuffer = true) {
    const renderer = this[_glRenderer] || this[_canvasRenderer];
    if(this[_glRenderer]) {
      const meshData = compress(this, meshes);
      if(!renderer.options.autoUpdate) {
        const gl = renderer.gl;
        if(clearBuffer) gl.clear(gl.COLOR_BUFFER_BIT);
        for(let i = 0; i < meshData.length; i++) {
          const mesh = meshData[i];
          if(mesh.filterCanvas) {
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
            renderer.setMeshData([mesh]);
            renderer._draw();
          }
        }
      } else {
        renderer.setMeshData(meshData);
      }
    } else {
      renderer.drawMeshes(meshes, {clearBuffer});
    }
  }
}