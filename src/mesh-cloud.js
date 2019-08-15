import {mat2d} from 'gl-matrix';
import {multiply, grayscale, brightness,
  saturate, contrast, invert,
  sepia, opacity, hueRotate} from './utils/color-matrix';
import {transformPoint} from './utils/math';

const _mesh = Symbol('mesh');
const _count = Symbol('count');
const _transform0 = Symbol('transform');
const _transform1 = Symbol('transform');

const _color0 = Symbol('color');
const _color1 = Symbol('color');
const _color2 = Symbol('color');
const _color3 = Symbol('color');
const _color4 = Symbol('color');

const _blend = Symbol('blend');

const _textures = Symbol('textures');
const _frameIndex = Symbol('frameIndex');

export default class {
  constructor(mesh, amount = 1) {
    this[_count] = amount;
    this[_mesh] = mesh;
    this[_transform0] = [];
    this[_transform1] = [];
    this[_color0] = [];
    this[_color1] = [];
    this[_color2] = [];
    this[_color3] = [];
    this[_color4] = [];
    this[_textures] = [];
    this[_frameIndex] = [];

    this[_blend] = false;

    const {width, height} = mesh;

    const colorMatrix = [
      1, 0, 0, 0, 0,
      0, 1, 0, 0, 0,
      0, 0, 1, 0, 0,
      0, 0, 0, 1, 0,
    ];

    for(let i = 0; i < amount; i++) {
      this[_transform0].push([1, 0, 0, width]);
      this[_transform1].push([1, 0, 0, height]);
      this[_frameIndex].push([-1]);
      this.setColorTransform(i, colorMatrix);
    }
  }

  get enableBlend() {
    return this[_mesh].enableBlend && this[_blend];
  }

  setColorTransform(idx, m) {
    if(idx >= this[_count] || idx < 0) throw new Error('Out of range.');
    this[_color0][idx] = [m[0], m[5], m[10], m[15]];
    this[_color1][idx] = [m[1], m[6], m[11], m[16]];
    this[_color2][idx] = [m[2], m[7], m[12], m[17]];
    this[_color3][idx] = [m[3], m[8], m[13], m[18]];
    this[_color4][idx] = [m[4], m[9], m[14], m[19]];
    this[_blend] = m[18] < 1.0;
    return this;
  }

  getColorTransform(idx) {
    if(idx >= this[_count] || idx < 0) throw new Error('Out of range.');
    return [
      this[_color0][idx][0], this[_color1][idx][0], this[_color2][idx][0], this[_color3][idx][0], this[_color4][idx][0],
      this[_color0][idx][1], this[_color1][idx][1], this[_color2][idx][1], this[_color3][idx][1], this[_color4][idx][1],
      this[_color0][idx][2], this[_color1][idx][2], this[_color2][idx][2], this[_color3][idx][2], this[_color4][idx][2],
      this[_color0][idx][3], this[_color1][idx][3], this[_color2][idx][3], this[_color3][idx][3], this[_color4][idx][3],
    ];
  }

  transformColor(idx, m) {
    let transform = this.getColorTransform(idx);
    transform = multiply(transform, m);
    this.setColorTransform(idx, transform);
    return this;
  }

  setColor(idx, color) {
    return this.setColorTransform(idx, [
      0, 0, 0, 0, color[0],
      0, 0, 0, 0, color[1],
      0, 0, 0, 0, color[2],
      0, 0, 0, 0, color[3],
    ]);
  }

  grayscale(idx, p) {
    this.setColorTransform(idx, grayscale(p));
  }

  brightness(idx, p) {
    this.setColorTransform(idx, brightness(p));
  }

  saturate(idx, p) {
    this.setColorTransform(idx, saturate(p));
  }

  contrast(idx, p) {
    this.setColorTransform(idx, contrast(p));
  }

  invert(idx, p) {
    this.setColorTransform(idx, invert(p));
  }

  sepia(idx, p) {
    this.setColorTransform(idx, sepia(p));
  }

  opacity(idx, p) {
    this.setColorTransform(idx, opacity(p));
  }

  hueRotate(idx, deg) {
    this.setColorTransform(idx, hueRotate(deg));
  }

  setTransform(idx, m) {
    if(idx >= this[_count] || idx < 0) throw new Error('Out of range.');
    this[_transform0][idx][0] = m[0];
    this[_transform0][idx][1] = m[1];
    this[_transform0][idx][2] = m[2];
    this[_transform1][idx][0] = m[3];
    this[_transform1][idx][1] = m[4];
    this[_transform1][idx][2] = m[5];
    return this;
  }

  getTransform(idx) {
    if(idx >= this[_count] || idx < 0) throw new Error('Out of range.');
    const m = [...this[_transform0][idx].slice(0, 3), ...this[_transform1][idx].slice(0, 3)];
    return m;
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
  }

  setFrameIndex(idx, frameIndex) {
    if(idx >= this[_count] || idx < 0) throw new Error('Out of range.');
    const len = this[_textures].length;
    if(len <= 0) throw new Error('No frames');
    this[_frameIndex][idx] = frameIndex % len;
  }

  get amount() {
    return this[_count];
  }

  get meshData() {
    const {attributes, cells, positions, textureCoord, uniforms} = this[_mesh].meshData;
    const frames = this[_textures];

    const meshData = {
      attributes: {...attributes},
      cells,
      positions,
      textureCoord,
      uniforms,
      instanceCount: this[_count],
      enableBlend: true,
    };

    if(frames.length) {
      frames.forEach((frame, i) => {
        meshData.uniforms[`u_texFrame${i}`] = frame;
      });
    }

    // console.log(this[_mesh].meshData)
    meshData.attributes.a_frameIndex = {data: this[_frameIndex], divisor: 1};
    meshData.attributes.a_transform0 = {data: this[_transform0], divisor: 1};
    meshData.attributes.a_transform1 = {data: this[_transform1], divisor: 1};
    meshData.attributes.a_colorCloud0 = {data: this[_color0], divisor: 1};
    meshData.attributes.a_colorCloud1 = {data: this[_color1], divisor: 1};
    meshData.attributes.a_colorCloud2 = {data: this[_color2], divisor: 1};
    meshData.attributes.a_colorCloud3 = {data: this[_color3], divisor: 1};
    meshData.attributes.a_colorCloud4 = {data: this[_color4], divisor: 1};

    return meshData;
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

  isPointInPath(idx, [x, y]) {
    return this.isPointCollision(idx, [x, y], 'fill');
  }

  isPointInStroke(idx, [x, y]) {
    return this.isPointCollision(idx, [x, y], 'stroke');
  }
}