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

    for(let i = 0; i < amount; i++) {
      this[_transform0].push([1, 0, 0]);
      this[_transform1].push([1, 0, 0]);
    }
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

  setTransform(idx, m) {
    if(idx >= this[_count] || idx < 0) throw new Error('Out of range.');
    const {width, height} = this[_mesh];
    m[4] /= 0.5 * width;
    m[5] /= -0.5 * height;
    this[_transform0][idx] = m.slice(0, 3);
    this[_transform1][idx] = m.slice(3);
  }
}