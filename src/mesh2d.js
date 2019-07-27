import normalize from 'normalize-path-scale';
import triangulate from 'triangulate-contours';
import {mat2d} from 'gl-matrix';
import stroke from './extrude-polyline';
import {flattenMeshes} from './utils';

const _mesh = Symbol('mesh');
const _contours = Symbol('contours');
const _stroke = Symbol('stroke');
const _fill = Symbol('fill');
const _bound = Symbol('bound');
const _strokeColor = Symbol('strokeColor');
const _fillColor = Symbol('fillColor');
const _transform = Symbol('transform');
const _uniforms = Symbol('uniforms');
const _texOptions = Symbol('texOptions');
const _enableBlend = Symbol('enableBlend');
const _applyTransform = Symbol('applyTransform');

function transformPoint(p, m, w, h, flipY) {
  let [x, y] = p;

  x = (x + 1) * 0.5 * w;
  y = (-y + 1) * 0.5 * h;

  p[0] = x * m[0] + y * m[2] + m[4];
  p[1] = x * m[1] + y * m[3] + m[5];
  if(flipY) p[1] = h - p[1];
  return p;
}

function isUnitTransform(m) {
  return m[0] === 1 && m[1] === 0 && m[2] === 0 && m[3] === 1 && m[4] === 0 && m[5] === 0;
}

function getTexCoord([x, y], [ox, oy, w, h], {scale, repeat}) {
  // console.log(imgWidth, imgHeight);
  if(!scale) {
    x /= w;
    y = 1 - (1 - y) / h;
    x -= ox;
    y += oy;
  }

  return [x, y];
}

export default class Mesh2D {
  constructor(figure, {width, height} = {width: 150, height: 150}) {
    this[_contours] = figure.contours;
    this[_stroke] = null;
    this[_fill] = null;
    // this[_fill] = {
    //   delaunay: true,
    //   clean: true,
    //   randomization: 0,
    // };
    // this[_fillColor] = [0, 0, 0, 0];
    this[_bound] = [[0, 0], [width, height]];
    this[_transform] = [1, 0, 0, 1, 0, 0];
    this[_uniforms] = {};
  }

  // join: 'miter' or 'bevel'
  // cap: 'butt' or 'square'
  setStroke({thickness = 1, cap = 'butt', join = 'miter', miterLimit = 10, color = [0, 0, 0, 0]} = {}) {
    this[_mesh] = null;
    this[_stroke] = stroke({thickness, cap, join, miterLimit});
    this[_strokeColor] = color;
    this[_enableBlend] = color[3] < 1.0;
  }

  setFill({delaunay = true, clean = true, randomization = 0, color = [0, 0, 0, 0]}) {
    this[_mesh] = null;
    this[_fill] = {delaunay, clean, randomization};
    this[_fillColor] = color;
    this[_enableBlend] = color[3] < 1.0;
  }

  get enableBlend() {
    return this[_enableBlend];
  }

  setTransform(m) {
    const transform = this[_transform];
    this[_transform] = m;
    m = mat2d(m) * mat2d.invert(transform);
    return this[_applyTransform](m);
  }

  transform(m) {
    const transform = this[_transform];
    this[_transform] = mat2d(m) * mat2d(transform);
    return this[_applyTransform](m);
  }

  translate(x, y) {
    let m = mat2d.create();
    m = mat2d.translate(m, [x, y]);
    return this.transform(m);
  }

  rotate(rad, [ox, oy] = [0, 0]) {
    let m = mat2d.create();
    m = mat2d.translate(m, [ox, oy]);
    m = mat2d.rotate(m, rad);
    m = mat2d.translate(m, [-ox, -oy]);
    return this.transform(m);
  }

  scale(x, y = x, [ox, oy] = [0, 0]) {
    let m = mat2d.create();
    m = mat2d.translate(m, [ox, oy]);
    m = mat2d.scale(m, [x, y]);
    m = mat2d.translate(m, [-ox, -oy]);
    return this[_applyTransform](m);
  }

  skew(x, y = x, [ox, oy] = [0, 0]) {
    let m = mat2d.create();
    m = mat2d.translate(m, [ox, oy]);
    m = mat2d(m) * mat2d(1, Math.tan(y), Math.tan(x), 1, 0, 0);
    m = mat2d.translate(m, [-ox, -oy]);
    return this[_applyTransform](m);
  }

  [_applyTransform](m) {
    const {positions} = this.meshData;
    const [w, h] = this[_bound][1];

    for(let i = 0; i < positions.length; i++) {
      const point = positions[i];
      transformPoint(point, m, w, h, true);
    }

    normalize(positions, this[_bound]);
    return this;
  }

  setUniforms(uniforms = {}) {
    Object.assign(this[_uniforms], uniforms);
  }

  setTexture(texture, options = {}) {
    if(!this[_fill]) {
      this.setFill({color: [0, 0, 0, 0]});
    }
    this.setUniforms({
      u_texFlag: 1,
      u_texSampler: texture,
    });
    this[_texOptions] = options;
    const mesh = this.meshData;

    const transform = this[_transform];
    const {width: imgWidth, height: imgHeight} = texture._img;
    const rect = options.rect || [0, 0, imgWidth, imgHeight];
    if(rect[2] == null) rect[2] = imgWidth;
    if(rect[3] == null) rect[3] = imgHeight;

    const [w, h] = this[_bound][1];
    if(!isUnitTransform(transform)) {
      const m = mat2d.invert(transform);
      mesh.textureCoord = mesh.positions.map(([x, y, z]) => {
        if(z > 0) {
          [x, y] = transformPoint([x, y], m, w, h, true);
          [x, y] = [x / w, y / h];
          return getTexCoord([x, y], [rect[0] / imgWidth, rect[1] / imgHeight, rect[2] / w, rect[3] / h], this[_texOptions]);
        }
        return [0, 0];
      });
    } else {
      mesh.textureCoord = mesh.positions.map(([x, y, z]) => {
        if(z > 0) { // fillTag
          [x, y] = [0.5 * (x + 1), 0.5 * (y + 1)];
          return getTexCoord([x, y], [rect[0] / imgWidth, rect[1] / imgHeight, rect[2] / w, rect[3] / h], this[_texOptions]);
        }
        return [0, 0];
      });
    }
    if(options.repeat) {
      this[_uniforms].u_repeat = 1;
    } else {
      this[_uniforms].u_repeat = 0;
    }
  }

  /**
    vector: [x0, y0, x1, y1],
    gradientColors: [{offset:0, color}, {offset:1, color}, ...],
    type: 'fill|stroke',
   */
  setLinearGradient({vector, colors: gradientColors, type = 'fill'}) {
    let {positions, fillPointCount} = this.meshData;
    let colors = this.meshData.attributes.a_color;

    gradientColors.sort((a, b) => {
      return a.offset - b.offset;
    });

    if(type === 'fill') {
      positions = positions.slice(0, fillPointCount);
      colors = colors.slice(0, fillPointCount);
    } else {
      positions = positions.slice(fillPointCount);
      colors = colors.slice(fillPointCount);
    }

    const [w, h] = this[_bound][1];
    const m = mat2d.invert(this[_transform]);

    function mixColor(out, startColor, stopColor, p) {
      const s = 1 - p;
      out[0] = startColor[0] * s + stopColor[0] * p;
      out[1] = startColor[1] * s + stopColor[1] * p;
      out[2] = startColor[2] * s + stopColor[2] * p;
      out[3] = startColor[3] * s + stopColor[3] * p;
      return out;
    }

    for(let i = 0; i < positions.length; i++) {
      const [x, y] = transformPoint(positions[i].slice(0, 2), m, w, h, false);
      const color = colors[i];

      const v1 = [x - vector[0], y - vector[1]];
      const v2 = [vector[2] - vector[0], vector[3] - vector[1]];

      const p = (v1[0] * v2[0] + v1[1] * v2[1]) / (v2[0] ** 2 + v2[1] ** 2);
      const len = gradientColors.length;

      for(let j = 0; j < len; j++) {
        const {offset, color: gradientColor} = gradientColors[j];
        if(p <= offset) {
          if(j === 0) mixColor(color, gradientColor, gradientColor, 1);
          else {
            const {color: startColor, offset: startOffset} = gradientColors[j - 1];
            const stopColor = gradientColor;
            const stopOffset = offset;
            const pp = (p - startOffset) / (stopOffset - startOffset);
            mixColor(color, startColor, stopColor, pp);
          }
          break;
        } else if(j === len - 1) {
          mixColor(color, gradientColor, gradientColor, 1);
        }
      }
    }
  }

  get uniforms() {
    return this[_uniforms];
  }

  get transformMatrix() {
    return this[_transform];
  }

  // {stroke, fill}
  get meshData() {
    if(this[_mesh]) {
      return this[_mesh];
    }

    const contours = this[_contours];
    const meshes = {};

    if(contours && contours.length) {
      if(this[_fill]) {
        const mesh = triangulate(contours);
        mesh.positions = mesh.positions.map((p) => {
          p[1] = this[_bound][1][1] - p[1];
          p.push(1);
          return p;
        });
        mesh.attributes = {
          a_color: Array.from({length: mesh.positions.length}).map(() => [...this[_fillColor]]),
        };
        meshes.fill = mesh;
      }

      if(this[_stroke]) {
        const _meshes = contours.map(lines => this[_stroke].build(lines));
        _meshes.forEach((mesh) => {
          mesh.positions = mesh.positions.map((p) => {
            p[1] = this[_bound][1][1] - p[1];
            p.push(0);
            return p;
          });
          mesh.attributes = {
            a_color: Array.from({length: mesh.positions.length}).map(() => [...this[_strokeColor]]),
          };
        });
        meshes.stroke = flattenMeshes(_meshes);
      }
    }

    const mesh = flattenMeshes([meshes.fill, meshes.stroke]);
    mesh.fillPointCount = meshes.fill ? meshes.fill.positions.length : 0;
    normalize(mesh.positions, this[_bound]);
    if(!this[_uniforms].u_texSampler) {
      mesh.textureCoord = mesh.positions.map(() => [0, 0]);
    }
    mesh.uniforms = this[_uniforms];
    if(!mesh.uniforms.u_texFlag) mesh.uniforms.u_texFlag = 0;
    this[_mesh] = mesh;
    return this[_mesh];
  }
}