import {mat2d} from 'gl-matrix';

const _mesh = Symbol('mesh');
const _count = Symbol('count');
const _transform0 = Symbol('transform');
const _transform1 = Symbol('transform');

export default class {
  constructor(mesh, amount = 1) {
    this[_count] = amount;
    this[_mesh] = mesh;
    this[_transform0] = [];
    this[_transform1] = [];

    const {width, height} = mesh;

    for(let i = 0; i < amount; i++) {
      this[_transform0].push([1, 0, 0, width]);
      this[_transform1].push([1, 0, 0, height]);
    }
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

  get amount() {
    return this[_count];
  }

  get meshData() {
    const {attributes, cells, positions, textCoord, uniforms} = this[_mesh].meshData;

    const meshData = {
      attributes: {...attributes},
      cells,
      positions,
      textCoord,
      uniforms,
      instanceCount: this[_count],
    };

    meshData.attributes.a_transform0 = {data: this[_transform0], divisor: 1};
    meshData.attributes.a_transform1 = {data: this[_transform1], divisor: 1};

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
}