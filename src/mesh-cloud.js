import {mat2d} from 'gl-matrix';
import {multiply, grayscale, brightness,
  saturate, contrast, invert,
  sepia, opacity, hueRotate} from './utils/color-matrix';
import {transformPoint} from './utils/math';
import parseColor from './utils/parse-color';

const _mesh = Symbol('mesh');
const _count = Symbol('count');

const _blend = Symbol('blend');
const _filters = Symbol('filter');

const _textures = Symbol('textures');
const _textureOptions = Symbol('textureOptions');

const _hasCloudColor = Symbol('cloudColor');
const _hasCloudFilter = Symbol('cloudFilter');

const _buffer = Symbol('buffer');

function createBuffer(buffer) {
  const transform0 = new Float32Array(4 * buffer);
  const transform1 = new Float32Array(4 * buffer);

  const color0 = new Float32Array(4 * buffer);
  const color1 = new Float32Array(4 * buffer);
  const color2 = new Float32Array(4 * buffer);
  const color3 = new Float32Array(4 * buffer);
  const color4 = new Float32Array(4 * buffer);

  const frameIndex = new Uint8Array(buffer);
  const fillColor = new Uint8Array(4 * buffer);
  const strokeColor = new Uint8Array(4 * buffer);

  return {
    bufferSize: buffer,
    transform0,
    transform1,
    color0,
    color1,
    color2,
    color3,
    color4,
    frameIndex,
    fillColor,
    strokeColor,
  };
}

export default class {
  constructor(mesh, amount = 1, {buffer = 1000} = {}) {
    buffer = Math.max(buffer, amount);

    this[_count] = amount;
    this[_mesh] = mesh;
    this[_buffer] = createBuffer(buffer);

    this[_textures] = [];
    this[_filters] = [];

    this[_hasCloudColor] = false;
    this[_hasCloudFilter] = false;

    this[_blend] = false;

    const {width, height} = mesh;

    for(let i = 0; i < amount; i++) {
      this[_buffer].transform0.set([1, 0, 0, width], i * 4);
      this[_buffer].transform1.set([1, 0, 0, height], i * 4);
      this[_buffer].frameIndex.set([-1], i);
      this[_filters].push([]);
      this[_buffer].fillColor.set([0, 0, 0, 0], i * 4);
      this[_buffer].strokeColor.set([0, 0, 0, 0], i * 4);
      this.setColorTransform(i, null);
    }
  }

  get bufferSize() {
    return this[_buffer].bufferSize;
  }

  get mesh() {
    return this[_mesh];
  }

  set mesh(mesh) {
    this[_mesh] = mesh;
    if(this[_textures]) {
      this.setTextureFrames(this[_textures], this[_textureOptions]);
    }
  }

  get hasCloudColor() {
    return this[_hasCloudColor];
  }

  get hasCloudFilter() {
    return this[_hasCloudFilter];
  }

  getFilter(idx) {
    return this[_filters][idx].join(' ');
  }

  get enableBlend() {
    return this[_mesh].enableBlend || this[_blend];
  }

  canIgnore() {
    return this[_mesh].canIgnore();
  }

  setColorTransform(idx, m) {
    if(idx >= this[_count] || idx < 0) throw new Error('Out of range.');
    idx *= 4;
    const {color0, color1, color2, color3, color4} = this[_buffer];
    if(m != null) {
      color0.set([m[0], m[5], m[10], m[15]], idx);
      color1.set([m[1], m[6], m[11], m[16]], idx);
      color2.set([m[2], m[7], m[12], m[17]], idx);
      color3.set([m[3], m[8], m[13], m[18]], idx);
      color4.set([m[4], m[9], m[14], m[19]], idx);
      this[_blend] = this[_blend] || m[18] < 1.0;
      this[_hasCloudFilter] = true;
    } else {
      color0.set([1, 0, 0, 0], idx);
      color1.set([0, 1, 0, 0], idx);
      color2.set([0, 0, 1, 0], idx);
      color3.set([0, 0, 0, 1], idx);
      color4.set([0, 0, 0, 0], idx);
    }
    return this;
  }

  getColorTransform(idx) {
    if(idx >= this[_count] || idx < 0) throw new Error('Out of range.');
    idx *= 4;
    const {color0, color1, color2, color3, color4} = this[_buffer];
    return [
      color0[idx], color1[idx], color2[idx], color3[idx], color4[idx],
      color0[idx + 1], color1[idx + 1], color2[idx + 1], color3[idx + 1], color4[idx + 1],
      color0[idx + 2], color1[idx + 2], color2[idx + 2], color3[idx + 2], color4[idx + 2],
      color0[idx + 3], color1[idx + 3], color2[idx + 3], color3[idx + 3], color4[idx + 3],
    ];
  }

  transformColor(idx, m) {
    let transform = this.getColorTransform(idx);
    transform = multiply(transform, m);
    this.setColorTransform(idx, transform);
    return this;
  }

  setFillColor(idx, color) {
    if(idx >= this[_count] || idx < 0) throw new Error('Out of range.');
    if(typeof color === 'string') color = parseColor(color);
    if(color[3] > 0.0) this[_hasCloudColor] = true;
    this[_buffer].fillColor.set(color.map(c => Math.round(255 * c)), 4 * idx);
  }

  setStrokeColor(idx, color) {
    if(idx >= this[_count] || idx < 0) throw new Error('Out of range.');
    if(typeof color === 'string') color = parseColor(color);
    if(color[3] > 0.0) this[_hasCloudColor] = true;
    this[_buffer].strokeColor.set(color.map(c => Math.round(255 * c)), 4 * idx);
  }

  getCloudRGBA(idx) {
    if(idx >= this[_count] || idx < 0) throw new Error('Out of range.');
    idx *= 4;
    const {fillColor, strokeColor} = this[_buffer];
    const _fillColor = [fillColor[idx], fillColor[idx + 1], fillColor[idx + 2], fillColor[idx + 3]];
    const _strokeColor = [strokeColor[idx], strokeColor[idx + 1], strokeColor[idx + 2], strokeColor[idx + 3]];
    _fillColor[3] /= 255;
    _strokeColor[3] /= 255;

    return {
      fill: `rgba(${_fillColor.join()})`,
      stroke: `rgba(${_strokeColor.join()})`,
    };
  }

  grayscale(idx, p) {
    this.transformColor(idx, grayscale(p));
    this[_filters][idx].push(`grayscale(${100 * p}%)`);
  }

  brightness(idx, p) {
    this.transformColor(idx, brightness(p));
    this[_filters][idx].push(`brightness(${100 * p}%)`);
  }

  saturate(idx, p) {
    this.transformColor(idx, saturate(p));
    this[_filters][idx].push(`saturate(${100 * p}%)`);
  }

  contrast(idx, p) {
    this.transformColor(idx, contrast(p));
    this[_filters][idx].push(`contrast(${100 * p}%)`);
  }

  invert(idx, p) {
    this.transformColor(idx, invert(p));
    this[_filters][idx].push(`invert(${100 * p}%)`);
  }

  sepia(idx, p) {
    this.transformColor(idx, sepia(p));
    this[_filters][idx].push(`sepia(${100 * p}%)`);
  }

  opacity(idx, p) {
    this.transformColor(idx, opacity(p));
    this[_filters][idx].push(`opacity(${100 * p}%)`);
  }

  hueRotate(idx, deg) {
    this.transformColor(idx, hueRotate(deg));
    this[_filters][idx].push(`hue-rotate(${deg}deg)`);
  }

  setTransform(idx, m) {
    if(idx >= this[_count] || idx < 0) throw new Error('Out of range.');
    idx *= 4;
    if(m == null) m = [1, 0, 0, 1, 0, 0];
    const {transform0, transform1} = this[_buffer];
    transform0.set([m[0], m[1], m[2]], idx);
    transform1.set([m[3], m[4], m[5]], idx);
    return this;
  }

  getTransform(idx) {
    if(idx >= this[_count] || idx < 0) throw new Error('Out of range.');
    idx *= 4;
    const {transform0, transform1} = this[_buffer];
    const m = [transform0[idx], transform0[idx + 1], transform0[idx + 2],
      transform1[idx], transform1[idx + 1], transform1[idx + 2]];
    return m;
  }

  getTextureFrame(idx) {
    return this[_textures][this[_buffer].frameIndex[idx]];
  }

  setTextureFrames(frames = [], options = {}) {
    if(frames.length > 12) {
      throw new Error('Max frames exceed. Allow 12 frames.');
    }
    if(frames.length) {
      const mesh = this[_mesh];
      mesh.setTexture(frames[0], options);
    }
    this[_textures] = frames;
    this[_textureOptions] = options;
  }

  setFrameIndex(idx, frameIndex) {
    if(idx >= this[_count] || idx < 0) throw new Error('Out of range.');
    const len = this[_textures].length;
    if(len <= 0) throw new Error('No frames');
    this[_buffer].frameIndex[idx] = frameIndex % len;
  }

  get amount() {
    return this[_count];
  }

  set amount(value) {
    if(value > this[_buffer].bufferSize) {
      throw new Error('Buffer out of range.');
    }
    const amount = this[_count];
    if(value === amount) return;
    this[_count] = value;
  }

  get meshData() {
    const {attributes, cells, positions, textureCoord, uniforms} = this[_mesh].meshData;
    const frames = this[_textures];

    const meshData = {
      attributes: {...attributes},
      cells,
      positions,
      textureCoord,
      uniforms: {...uniforms},
      instanceCount: this[_count],
      enableBlend: this.enableBlend,
    };

    if(frames.length) {
      frames.forEach((frame, i) => {
        meshData.uniforms[`u_texFrame${i}`] = frame;
      });
    }
    const {transform0, transform1, color0, color1, color2, color3, color4, fillColor, strokeColor, frameIndex} = this[_buffer];
    if(this[_mesh].uniforms.u_texSampler) {
      meshData.attributes.a_frameIndex = {data: frameIndex, divisor: 1};
    }
    // console.log(this[_mesh].meshData)

    meshData.attributes.a_transform0 = {data: transform0, divisor: 1};
    meshData.attributes.a_transform1 = {data: transform1, divisor: 1};
    meshData.attributes.a_colorCloud0 = {data: color0, divisor: 1};
    meshData.attributes.a_colorCloud1 = {data: color1, divisor: 1};
    meshData.attributes.a_colorCloud2 = {data: color2, divisor: 1};
    meshData.attributes.a_colorCloud3 = {data: color3, divisor: 1};
    meshData.attributes.a_colorCloud4 = {data: color4, divisor: 1};

    if(this.hasCloudColor) {
      meshData.attributes.a_fillCloudColor = {data: fillColor, divisor: 1};
      meshData.attributes.a_strokeCloudColor = {data: strokeColor, divisor: 1};
    }

    return meshData;
  }

  setProgram(program) {
    this[_mesh].setProgram(program);
  }

  get program() {
    return this[_mesh].program;
  }

  transform(idx, m) {
    const transform = this.getTransform(idx);
    m = mat2d(m) * mat2d(transform);
    this.setTransform(idx, m);
    return this;
  }

  translate(idx, [x, y]) {
    let m = mat2d.create();
    m = mat2d.translate(m, [x, y]);
    return this.transform(idx, m);
  }

  rotate(idx, rad, [ox, oy] = [0, 0]) {
    let m = mat2d.create();
    m = mat2d.translate(m, [ox, oy]);
    m = mat2d.rotate(m, rad);
    m = mat2d.translate(m, [-ox, -oy]);
    return this.transform(idx, m);
  }

  scale(idx, [x, y = x], [ox, oy] = [0, 0]) {
    let m = mat2d.create();
    m = mat2d.translate(m, [ox, oy]);
    m = mat2d.scale(m, [x, y]);
    m = mat2d.translate(m, [-ox, -oy]);
    return this.transform(idx, m);
  }

  skew(idx, [x, y = x], [ox, oy] = [0, 0]) {
    let m = mat2d.create();
    m = mat2d.translate(m, [ox, oy]);
    m = mat2d(m) * mat2d(1, Math.tan(y), Math.tan(x), 1, 0, 0);
    m = mat2d.translate(m, [-ox, -oy]);
    return this.transform(idx, m);
  }

  isPointCollision(idx, [x, y], type = 'both') {
    const m = this.getTransform(idx);
    const p = transformPoint([x, y], mat2d.invert(m));
    return this[_mesh].isPointCollision(...p, type);
  }

  isPointInFill(idx, [x, y]) {
    return this.isPointCollision(idx, [x, y], 'fill');
  }

  isPointInStroke(idx, [x, y]) {
    return this.isPointCollision(idx, [x, y], 'stroke');
  }
}