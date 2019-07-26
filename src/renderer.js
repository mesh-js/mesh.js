import GlRenderer from 'gl-renderer';
import {loadImage} from 'gl-renderer/src/helpers';
import vertShader from './shader.vert';
import fragShader from './shader.frag';
import {compress, createText} from './utils';

const defaultOpts = {
  autoUpdate: false,
};

export default class Renderer extends GlRenderer {
  constructor(canvas, opts = {}) {
    super(canvas, Object.assign({}, defaultOpts, opts));
    const program = this.compileSync(fragShader, vertShader);
    this.useProgram(program);

    // bind default Texture to eliminate warning
    const img = document.createElement('canvas');
    img.width = 1;
    img.height = 1;
    const texture = this.createTexture(img);
    const gl = this.gl;
    // gl.enable(gl.BLEND);
    // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
  }

  loadImage(src) {
    return loadImage(src);
  }

  async createText(text, {font = '16px arial', fillColor = null, strokeColor = null} = {}) {
    const img = await createText(text, {font, fillColor, strokeColor});
    const texture = this.createTexture(img);
    texture._img = img;
    this.textures.push(texture);
    return texture;
  }

  drawMeshes(meshes) {
    const meshData = compress(meshes);
    this.setMeshData(meshData);
    if(!this.options.autoUpdate) this.render();
  }
}