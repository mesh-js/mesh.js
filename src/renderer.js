import GlRenderer from 'gl-renderer';
import {mat3} from 'gl-matrix';
import CanvasRenderer from './canvas-renderer';
import compress from './utils/compress';
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

const defaultPassVertex = `attribute vec3 a_vertexPosition;
attribute vec3 a_vertexTextureCoord;
varying vec3 vTextureCoord;
uniform mat3 viewMatrix;
uniform mat3 projectionMatrix;

void main() {
  gl_PointSize = 1.0;
  vec3 pos = projectionMatrix * viewMatrix * vec3(a_vertexPosition.xy, 1.0);
  gl_Position = vec4(pos.xy, 1.0, 1.0);    
  vTextureCoord = a_vertexTextureCoord;              
}
`;

const defaultPassFragment = `precision mediump float;
varying vec3 vTextureCoord;
uniform sampler2D u_texSampler;
void main() {
  gl_FragColor = texture2D(u_texSampler, vTextureCoord.xy);
}
`;

const _glRenderer = Symbol('glRenderer');
const _canvasRenderer = Symbol('canvasRenderer');
const _options = Symbol('options');
const _globalTransform = Symbol('globalTransform');
const _applyGlobalTransform = Symbol('applyGlobalTransform');
const _canvas = Symbol('canvas');

function draw(renderer) {
  const gl = renderer.gl;
  const fbo = renderer.fbo;
  if(fbo) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  }
  renderer._draw();
  if(fbo) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
}

function drawFilterContext(renderer, filterContext, width, height) {
  const filterTexture = renderer.createTexture(filterContext.canvas);

  const contours = [[[0, 0], [width, 0], [width, height], [0, height], [0, 0]]];
  contours.closed = true;
  const filterMesh = new Mesh2D({contours});

  filterMesh.setTexture(filterTexture);
  renderer.setMeshData([filterMesh.meshData]);
  draw(renderer);
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
      if(contextType === 'webgl2' && !renderer.isWebGL2) { // webgl2 may disabled by browser settings
        opts.contextType = 'webgl';
      }
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

    this[_globalTransform] = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    this.updateResolution();
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
    const m = this[_globalTransform];
    return [m[0], m[1], m[3], m[4], m[6], m[7]];
  }

  get viewMatrix() {
    return this[_globalTransform];
  }

  [_applyGlobalTransform]() {
    const renderer = this[_glRenderer] || this[_canvasRenderer];
    if(this[_glRenderer]) {
      const {width, height} = this.canvas;
      renderer.uniforms.viewMatrix = this.viewMatrix;
      renderer.uniforms.projectionMatrix = this.projectionMatrix;
      renderer.uniforms.u_resolution = [width, height];
    }
  }

  updateResolution() {
    const {width, height} = this.canvas;
    const m1 = [ // translation
      1, 0, 0,
      0, 1, 0,
      -width / 2, -height / 2, 1,
    ];
    const m2 = [ // scale
      2 / width, 0, 0,
      0, -2 / height, 0,
      0, 0, 1,
    ];
    const m3 = mat3(m2) * mat3(m1);
    this.projectionMatrix = m3;
    if(this[_glRenderer]) {
      this[_glRenderer].gl.viewport(0, 0, width, height);
    }
  }

  createTexture(img, opts) {
    const renderer = this[_glRenderer] || this[_canvasRenderer];
    return renderer.createTexture(img, opts);
  }

  /* async */ loadTexture(textureURL, {useImageBitmap = false} = {}) {
    const renderer = this[_glRenderer] || this[_canvasRenderer];
    return renderer.loadTexture(textureURL, {useImageBitmap});
  }

  createText(text, {font = '16px arial', fillColor = null, strokeColor = null, strokeWidth = 1} = {}) {
    if(this[_glRenderer]) {
      const img = ENV.createText(
        text,
        {font, fillColor, strokeColor, strokeWidth}
      );
      return {image: this.createTexture(img.image), rect: img.rect};
    }
    return {_img: {font, fillColor, strokeColor, strokeWidth, text}};
  }

  createProgram({vertex, fragment, options} = {}) {
    if(this[_glRenderer]) {
      const program = this[_glRenderer].compileSync(fragment, vertex);
      program._attribOpts = options;
      return program;
    }
    throw new Error('Context 2D cannot create webgl program.');
  }

  createPassProgram({vertex = defaultPassVertex, fragment = defaultPassFragment, options} = {}) {
    return this.createProgram({vertex, fragment, options});
  }

  useProgram(program, attributeOptions = {}) {
    if(this[_glRenderer]) {
      const attrOpts = Object.assign({}, program._attribOpts, attributeOptions);
      return this[_glRenderer].useProgram(program, attrOpts);
    }
    throw new Error('Context 2D cannot use webgl program.');
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

  drawMeshCloud(cloud, {clear = false, program: drawProgram = null} = {}) {
    const renderer = this[_glRenderer] || this[_canvasRenderer];
    // if(!this.isWebGL2) throw new Error('Only webgl2 context support drawMeshCloud.');
    const program = drawProgram || cloud.program;
    if(this[_glRenderer]) {
      const gl = renderer.gl;
      if(clear) gl.clear(gl.COLOR_BUFFER_BIT);
      if(!program) {
        const mesh = cloud.mesh.meshData;
        const hasTexture = !!mesh.uniforms.u_texSampler;
        const hasFilter = !!mesh.uniforms.u_filterFlag;
        const hasGradient = !!mesh.uniforms.u_radialGradientVector;
        const hasCloudColor = cloud.hasCloudColor;
        const hasCloudFilter = cloud.hasCloudFilter;
        const hasClipPath = !!mesh.uniforms.u_clipSampler;
        applyCloudShader(renderer, {
          hasTexture,
          hasFilter,
          hasGradient,
          hasCloudColor,
          hasCloudFilter,
          hasClipPath,
        });
      } else if(renderer.program !== program) {
        this.useProgram(program, {
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
          a_frameIndex: {
            type: 'UNSIGNED_BYTE',
            normalize: false,
          },
        });
      }
      this[_applyGlobalTransform]();
      renderer.setMeshData([cloud.meshData]);
      if(cloud.beforeRender) cloud.beforeRender(gl, cloud);
      draw(renderer);
      if(cloud.afterRender) cloud.afterRender(gl, cloud);
    } else {
      renderer.setTransform(this.globalTransformMatrix);
      renderer.drawMeshCloud(cloud, {clear, hook: false});
    }
  }

  drawMeshes(meshes, {clear = false, program: drawProgram = null} = {}) { // eslint-disable-line complexity
    const renderer = this[_glRenderer] || this[_canvasRenderer];
    if(this[_glRenderer]) {
      const oldFBO = renderer.fbo;
      const meshData = compress(this, meshes, drawProgram == null);
      const gl = renderer.gl;
      if(clear) gl.clear(gl.COLOR_BUFFER_BIT);
      const hasGlobalTransform = !isUnitTransform(this.globalTransformMatrix);
      this._drawCalls = 0;
      for(const mesh of meshData) { // eslint-disable-line no-restricted-syntax
        this._drawCalls++;
        const program = drawProgram || mesh.program;
        if(mesh instanceof MeshCloud) {
          this.drawMeshCloud(mesh, {clear, program});
          // continue; // eslint-disable-line no-continue
        } else {
          const {width, height} = this.canvas;
          if(mesh.beforeRender) mesh.beforeRender(gl, mesh);
          if(mesh.pass.length) {
            if(!this.fbo || this.fbo.width !== width || this.fbo.height !== height) {
              this.fbo = {
                width,
                height,
                target: renderer.createFBO(),
                buffer: renderer.createFBO(),
                swap() {
                  [this.target, this.buffer] = [this.buffer, this.target];
                },
              };
            }
            renderer.bindFBO(this.fbo.target);
          }
          if(!program && mesh.filterCanvas) { // 有一些滤镜用shader不好实现：blur、drop-shadow、url
            applyShader(renderer, {hasTexture: true});
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
                // filterContext.transform(...this.globalTransformMatrix);
                drawMesh2D(originalMesh, filterContext, false);
                filterContext.restore();
                applyFilter(filterContext, currentFilter);
              } else {
                drawMesh2D(originalMesh, filterContext, true);
              }
              this[_applyGlobalTransform]();
              drawFilterContext(renderer, filterContext, width, height);
            } else {
              if(hasGlobalTransform) {
                filterContext.save();
                // filterContext.transform(...this.globalTransformMatrix);
              }
              drawMesh2D(originalMesh, filterContext, false);
              if(hasGlobalTransform) {
                filterContext.restore();
              }
              if(!nextMesh || !nextMesh.filterCanvas || originalMesh.filter !== nextMesh.filter) {
                applyFilter(filterContext, currentFilter);
                this[_applyGlobalTransform]();
                drawFilterContext(renderer, filterContext, width, height);
              }
            }
          } else {
            if(!program) {
              const hasTexture = !!mesh.uniforms.u_texSampler;
              const hasFilter = !!mesh.uniforms.u_filterFlag;
              const hasGradient = !!mesh.uniforms.u_radialGradientVector;
              const hasClipPath = !!mesh.uniforms.u_clipSampler;
              applyShader(renderer, {hasTexture, hasFilter, hasGradient, hasClipPath});
            } else if(renderer.program !== program) {
              this.useProgram(program, {
                a_color: {
                  type: 'UNSIGNED_BYTE',
                  normalize: true,
                },
              });
            }
            if(mesh.filterCanvas) {
              console.warn('User program ignored some filter effects.');
            }
            this[_applyGlobalTransform]();
            renderer.setMeshData([mesh]);
            draw(renderer);
          }
          if(mesh.pass.length) {
            const len = mesh.pass.length;
            mesh.pass.forEach((pass, idx) => {
              pass.blend = mesh.enableBlend;
              pass.setTexture(renderer.fbo.texture);
              if(idx === len - 1) renderer.bindFBO(oldFBO);
              else {
                this.fbo.swap();
                renderer.bindFBO(this.fbo.target);
              }
              if(pass.program) renderer.useProgram(pass.program);
              else {
                this.defaultPassProgram = this.defaultPassProgram || this.createPassProgram();
                renderer.useProgram(this.defaultPassProgram);
              }
              renderer.setMeshData([pass.meshData]);
              gl.clear(gl.COLOR_BUFFER_BIT);
              draw(renderer);
            });
          }
          if(mesh.afterRender) mesh.afterRender(gl, mesh);
        }
      }
    } else {
      renderer.setTransform(this.globalTransformMatrix);
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
    this[_globalTransform] = [
      m[0], m[1], 0,
      m[2], m[3], 0,
      m[4], m[5], 1,
    ];
    return this;
  }

  globalTransform(...m) {
    const transform = this[_globalTransform];
    this[_globalTransform] = mat3(transform) * mat3(m);
    return this;
  }

  globalTranslate(x, y) {
    let m = mat3.create();
    m = mat3.translate(m, [x, y]);
    return this.globalTransform(...m);
  }

  globalRotate(rad, [ox, oy] = [0, 0]) {
    let m = mat3.create();
    m = mat3.translate(m, [ox, oy]);
    m = mat3.rotate(m, rad);
    m = mat3.translate(m, [-ox, -oy]);
    return this.globalTransform(...m);
  }

  globalScale(x, y = x, [ox, oy] = [0, 0]) {
    let m = mat3.create();
    m = mat3.translate(m, [ox, oy]);
    m = mat3.scale(m, [x, y]);
    m = mat3.translate(m, [-ox, -oy]);
    return this.globalTransform(...m);
  }

  globalSkew(x, y = x, [ox, oy] = [0, 0]) {
    let m = mat3.create();
    m = mat3.translate(m, [ox, oy]);
    m = mat3(m) * mat3(1, Math.tan(y), Math.tan(x), 1, 0, 0);
    m = mat3.translate(m, [-ox, -oy]);
    return this.globalTransform(...m);
  }

  transformPoint(x, y, matrix) {
    let m = this.globalTransformMatrix;
    if(matrix) m = mat3(m) * mat3(matrix);
    const newX = x * m[0] + y * m[2] + m[4];
    const newY = x * m[1] + y * m[3] + m[5];
    return [newX, newY];
  }
}
