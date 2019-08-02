import GlRenderer from 'gl-renderer';
import CanvasRenderer from './canvas-renderer';
import vertShader from './shader.vert';
import fragShader from './shader.frag';
import compress from './utils/compress';
import createText from './utils/create-text';
import {normalize, denormalize} from './utils/positions';

const defaultOpts = {
  autoUpdate: false,
};

const _glRenderer = Symbol('glRenderer');
const _canvasRenderer = Symbol('canvasRenderer');
const _options = Symbol('options');

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

  loadTexture(textureURL) {
    const renderer = this[_glRenderer] || this[_canvasRenderer];
    return renderer.loadTexture(textureURL);
  }

  deleteTexture(texture) {
    const renderer = this[_glRenderer] || this[_canvasRenderer];
    return renderer.deleteTexture(texture);
  }

  drawMeshes(meshes, clearBuffer = true) {
    const renderer = this[_glRenderer] || this[_canvasRenderer];
    if(this[_glRenderer]) {
      const meshData = compress(meshes);
      renderer.setMeshData(meshData);
      // renderer.setMeshData(meshes.map((mesh) => {
      //   const data = mesh.meshData;
      //   data.enableBlend = true;
      //   return data;
      // }));
      if(!renderer.options.autoUpdate) renderer.render(clearBuffer);
    } else {
      renderer.drawMeshes(meshes, clearBuffer);
    }
  }
}