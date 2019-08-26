import triangulate from 'triangulate-contours';
import {mat2d} from 'gl-matrix';
import getBounds from 'bound-points';
import stroke from './extrude-polyline';
import flattenMeshes from './utils/flatten-meshes';
import vectorToRGBA from './utils/vector-to-rgba';
import {normalize, denormalize} from './utils/positions';
import {multiply, grayscale, brightness,
  saturate, contrast, invert,
  sepia, opacity, hueRotate} from './utils/color-matrix';

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
const _blend = Symbol('blend');
const _enableBlend = Symbol('enableBlend');
const _applyTexture = Symbol('applyTexture');
const _applyGradient = Symbol('applyGradient');
const _applyTransform = Symbol('applyTransform');
const _gradient = Symbol('gradient');

const _filter = Symbol('filter');

function normalizePoints(points, bound) {
  const [w, h] = bound[1];
  for(let i = 0; i < points.length; i++) {
    const point = points[i];
    point[0] = 2 * point[0] / w - 1;
    point[1] = 2 * point[1] / h - 1;
  }
}

function transformPoint(p, m, w, h, flipY) {
  const [x, y] = denormalize(p, w, h);
  p[0] = x * m[0] + y * m[2] + m[4];
  p[1] = x * m[1] + y * m[3] + m[5];
  if(flipY) p[1] = h - p[1];
  return p;
}

function isUnitTransform(m) {
  return m[0] === 1 && m[1] === 0 && m[2] === 0 && m[3] === 1 && m[4] === 0 && m[5] === 0;
}

function getTexCoord([x, y], [ox, oy, w, h], {scale, repeat}) {
  if(!scale) {
    x /= w;
    y = 1 - (1 - y) / h;
    x -= ox;
    y += oy;
  }

  return [x, y];
}

export default class Mesh2D {
  constructor(figure, {width, height} = {width: 300, height: 150}) {
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
    this[_filter] = [];
    this[_blend] = null;
  }

  setResolution(width, height) {
    this[_mesh] = null;
    this[_bound][1][0] = width;
    this[_bound][1][1] = height;
  }

  get width() {
    return this[_bound][1][0];
  }

  get height() {
    return this[_bound][1][1];
  }

  get contours() {
    return this[_contours];
  }

  set contours(contours) {
    this[_mesh] = null;
    this[_contours] = contours;
  }

  get blend() {
    return this[_blend] == null ? 'auto' : this[_blend];
  }

  set blend(blend) {
    this[_blend] = blend;
  }

  get boundingBox() {
    if(this[_mesh] && this[_mesh].boundingBox) return this[_mesh].boundingBox;

    const meshData = this.meshData;
    if(meshData) {
      let {positions} = meshData;
      const m = mat2d.invert(this[_transform]);
      const [w, h] = this[_bound][1];
      positions = positions.map(([x, y]) => {
        return transformPoint([x, y], m, w, h, false);
      });
      meshData.boundingBox = getBounds(positions);
      return meshData.boundingBox;
    }
    return null;
  }

  get boundingCenter() {
    const bound = this.boundingBox;
    if(bound) {
      return [0.5 * (bound[0][0] + bound[1][0]), 0.5 * (bound[0][1] + bound[1][1])];
    }
    return null;
  }

  get lineWidth() {
    if(this[_stroke]) {
      return this[_stroke].thickness;
    }
    return 0;
  }

  get lineCap() {
    if(this[_stroke]) {
      return this[_stroke].cap;
    }
    return '';
  }

  get lineJoin() {
    if(this[_stroke]) {
      return this[_stroke].join;
    }
    return '';
  }

  get miterLimit() {
    if(this[_stroke]) {
      return this[_stroke].miterLimit;
    }
    return 0;
  }

  get strokeStyle() {
    if(this[_strokeColor] && this[_strokeColor][3] !== 0) {
      return vectorToRGBA(this[_strokeColor]);
    }
    return '';
  }

  get fillStyle() {
    if(this[_fillColor] && this[_fillColor][3] !== 0) {
      return vectorToRGBA(this[_fillColor]);
    }
    return '';
  }

  get gradient() {
    return this[_gradient];
  }

  get texture() {
    if(this[_uniforms].u_texSampler) {
      return {
        image: this[_uniforms].u_texSampler._img,
        options: this[_texOptions],
      };
    }
    return null;
  }

  get enableBlend() {
    if(this[_blend] === true || this[_blend] === false) return this[_blend];
    return this[_enableBlend];
  }

  get filterCanvas() {
    return /blur|drop-shadow|url/.test(this.filter);
  }

  get filter() {
    return this[_filter].join(' ');
  }

  get transformMatrix() {
    return this[_transform];
  }

  get uniforms() {
    return this[_uniforms];
  }

  // {stroke, fill}
  get meshData() {
    if(this[_mesh]) {
      return this[_mesh];
    }
    if(!this[_fill] && !this[_stroke]) {
      this.setFill();
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
          a_color: Array.from({length: mesh.positions.length}).map(() => this[_fillColor].map(c => Math.round(255 * c))),
        };
        meshes.fill = mesh;
      }

      if(this[_stroke]) {
        const closed = contours.closed;
        const len = contours.length;
        const _meshes = contours.map((lines, i) => {
          if(closed && i === len - 1) {
            return this[_stroke].build([...lines], true);
          }
          return this[_stroke].build(lines);
        });
        _meshes.forEach((mesh) => {
          mesh.positions = mesh.positions.map((p) => {
            p[1] = this[_bound][1][1] - p[1];
            p.push(0);
            return p;
          });
          mesh.attributes = {
            a_color: Array.from({length: mesh.positions.length}).map(() => this[_strokeColor].map(c => Math.round(255 * c))),
          };
        });
        meshes.stroke = flattenMeshes(_meshes);
      }
    }

    const mesh = flattenMeshes([meshes.fill, meshes.stroke]);
    mesh.fillPointCount = meshes.fill ? meshes.fill.positions.length : 0;
    mesh.enableBlend = this.enableBlend;
    normalizePoints(mesh.positions, this[_bound]);
    if(!this[_uniforms].u_texSampler) {
      mesh.textureCoord = mesh.positions.map(() => [0, 0]);
    } else {
      this[_applyTexture](mesh, this[_texOptions], false);
    }
    mesh.uniforms = this[_uniforms];
    if(!mesh.uniforms.u_texFlag) mesh.uniforms.u_texFlag = 0;
    if(!mesh.uniforms.u_filterFlag) mesh.uniforms.u_filterFlag = 0;
    if(!mesh.uniforms.u_radialGradientVector) mesh.uniforms.u_radialGradientVector = [0, 0, 0, 0, 0, 0];
    this[_mesh] = mesh;

    const transform = this[_transform];
    if(!isUnitTransform(transform)) {
      this[_applyTransform](mesh, transform);
    }

    if(this[_gradient] && this[_gradient].fill) {
      this[_applyGradient](this[_mesh], this[_gradient].fill);
    } else if(this[_gradient] && this[_gradient].stroke) {
      this[_applyGradient](this[_mesh], this[_gradient].stroke);
    }

    return this[_mesh];
  }

  [_applyTransform](mesh, m) {
    const {positions} = mesh;
    const [w, h] = this[_bound][1];

    for(let i = 0; i < positions.length; i++) {
      const point = positions[i];
      transformPoint(point, m, w, h, true);
    }
    const vector = this[_uniforms].u_radialGradientVector;
    if(vector) {
      let [x1, y1, , x2, y2] = vector;
      y1 = h - y1;
      y2 = h - y2;
      vector[0] = x1 * m[0] + y1 * m[2] + m[4];
      vector[1] = h - (x1 * m[1] + y1 * m[3] + m[5]);
      vector[3] = x2 * m[0] + y2 * m[2] + m[4];
      vector[4] = h - (x2 * m[1] + y2 * m[3] + m[5]);
      this[_uniforms].u_radialGradientVector = vector;
    }
    normalizePoints(positions, this[_bound]);
  }

  [_applyTexture](mesh, options, transformed) {
    const texture = this[_uniforms].u_texSampler;
    if(!texture) return;

    const {width: imgWidth, height: imgHeight} = texture._img;

    const transform = this[_transform];
    const srcRect = options.srcRect;
    const rect = options.rect || [0, 0];

    if(rect[2] == null) rect[2] = srcRect ? srcRect[2] : imgWidth;
    if(rect[3] == null) rect[3] = srcRect ? srcRect[3] : imgHeight;

    const [w, h] = this[_bound][1];

    if(transformed && !isUnitTransform(transform)) {
      const m = mat2d.invert(transform);
      mesh.textureCoord = mesh.positions.map(([x, y, z]) => {
        if(z > 0) {
          [x, y] = transformPoint([x, y], m, w, h, true);
          [x, y] = [x / w, y / h];
          return getTexCoord([x, y], [rect[0] / rect[2], rect[1] / rect[3], rect[2] / w, rect[3] / h], this[_texOptions]);
        }
        return [0, 0];
      });
    } else {
      mesh.textureCoord = mesh.positions.map(([x, y, z]) => {
        if(z > 0) {
          // fillTag
          [x, y] = [0.5 * (x + 1), 0.5 * (y + 1)];
          return getTexCoord([x, y], [rect[0] / rect[2], rect[1] / rect[3], rect[2] / w, rect[3] / h], this[_texOptions]);
        }
        return [0, 0];
      });
    }

    if(srcRect) {
      const sRect = [srcRect[0] / imgWidth, srcRect[1] / imgHeight, srcRect[2] / imgWidth, srcRect[3] / imgHeight];
      this[_uniforms].u_srcRect = sRect;
    }
    if(options.repeat) {
      this[_uniforms].u_repeat = 1;
    } else {
      this[_uniforms].u_repeat = 0;
    }
  }

  [_applyGradient](mesh, {vector, colors: gradientColors, type}) {
    if(vector.length > 4) {
      // radial gradient
      return;
    }
    let {positions, fillPointCount} = mesh;
    let colors = mesh.attributes.a_color;

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
      out[0] = Math.round(255 * (startColor[0] * s + stopColor[0] * p));
      out[1] = Math.round(255 * (startColor[1] * s + stopColor[1] * p));
      out[2] = Math.round(255 * (startColor[2] * s + stopColor[2] * p));
      out[3] = Math.round(255 * (startColor[3] * s + stopColor[3] * p));
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

  // join: 'miter' or 'bevel'
  // cap: 'butt' or 'square'
  setStroke({
    thickness = 1,
    cap = 'butt',
    join = 'miter',
    miterLimit = 10,
    color = [0, 0, 0, 0],
  } = {}) {
    this[_mesh] = null;
    this[_stroke] = stroke({thickness, cap, join, miterLimit});
    this[_strokeColor] = color;
    this[_enableBlend] = color[3] < 1.0;
    return this;
  }

  setFill({delaunay = true, clean = true, randomization = 0, color = [0, 0, 0, 0]} = {}) {
    this[_mesh] = null;
    this[_fill] = {delaunay, clean, randomization};
    this[_fillColor] = color;
    this[_enableBlend] = color[3] < 1.0;
    return this;
  }

  /**
    options: {
      scale: false,
      repeat: false,
      rect: [10, 10],
      srcRect: [...],
    }
   */
  setTexture(texture, options = {}) {
    if(!this[_fill]) {
      this.setFill();
    }
    this.setUniforms({
      u_texFlag: 1,
      u_texSampler: texture,
    });

    this[_texOptions] = options;

    if(this[_mesh]) {
      this[_applyTexture](this[_mesh], options, true);
    }
    return this;
  }

  /**
    vector: [x0, y0, x1, y1],
    colors: [{offset:0, color}, {offset:1, color}, ...],
    type: 'fill|stroke',
   */
  setLinearGradient({vector, colors: gradientColors, type = 'fill'}) {
    if(type === 'fill' && !this[_fill]) {
      this.setFill();
    }
    if(type === 'stroke' && !this[_stroke]) {
      this.setStroke();
    }
    this[_gradient] = this[_gradient] || {};
    this[_gradient][type] = {vector, colors: gradientColors, type};

    if(this[_mesh]) this[_applyGradient](this[_mesh], this[_gradient][type]);
    return this;
  }

  /**
    vector: [x0, y0, r0, x1, y1, r1],
    colors: [{offset:0, color}, {offset:1, color}, ...],
    type: 'fill|stroke
   */
  setRadialGradient({vector, colors: gradientColors, type = 'fill'}) {
    // if r0 < 0 || r1 < 0 throw IndexSizeError DOMException
    // if x0 == x1 && y0 == y1 && r0 == r1 draw Nothing
    if(type === 'fill' && !this[_fill]) {
      this.setFill();
    }
    if(type === 'stroke' && !this[_stroke]) {
      this.setStroke();
    }
    this[_gradient] = this[_gradient] || {};
    this[_gradient][type] = {vector, colors: gradientColors, type};

    gradientColors.sort((a, b) => {
      return a.offset - b.offset;
    });

    const colorSteps = [];
    gradientColors.forEach(({offset, color}) => {
      colorSteps.push(offset, ...color);
    });

    const [, h] = this[_bound][1];
    vector[1] = h - vector[1];
    vector[4] = h - vector[4];

    this[_uniforms].u_radialGradientVector = vector;
    this[_uniforms].u_colorSteps = colorSteps;

    return this;
  }

  setUniforms(uniforms = {}) {
    Object.assign(this[_uniforms], uniforms);
    return this;
  }

  setTransform(...m) {
    const transform = this[_transform];
    this[_transform] = m;
    m = mat2d(m) * mat2d.invert(transform);
    if(this[_mesh]) this[_applyTransform](this[_mesh], m);
    return this;
  }

  transform(...m) {
    const transform = this[_transform];
    this[_transform] = mat2d(m) * mat2d(transform);
    if(this[_mesh]) this[_applyTransform](this[_mesh], m);
    return this;
  }

  translate(x, y) {
    let m = mat2d.create();
    m = mat2d.translate(m, [x, y]);
    return this.transform(...m);
  }

  rotate(rad, [ox, oy] = [0, 0]) {
    let m = mat2d.create();
    m = mat2d.translate(m, [ox, oy]);
    m = mat2d.rotate(m, rad);
    m = mat2d.translate(m, [-ox, -oy]);
    return this.transform(...m);
  }

  scale(x, y = x, [ox, oy] = [0, 0]) {
    let m = mat2d.create();
    m = mat2d.translate(m, [ox, oy]);
    m = mat2d.scale(m, [x, y]);
    m = mat2d.translate(m, [-ox, -oy]);
    return this.transform(...m);
  }

  skew(x, y = x, [ox, oy] = [0, 0]) {
    let m = mat2d.create();
    m = mat2d.translate(m, [ox, oy]);
    m = mat2d(m) * mat2d(1, Math.tan(y), Math.tan(x), 1, 0, 0);
    m = mat2d.translate(m, [-ox, -oy]);
    return this.transform(...m);
  }

  clearFilter() {
    this.setColorTransform(null);
    this[_filter].length = 0;
    return this;
  }

  setColorTransform(...m) {
    if(m[0] === null) {
      this.setUniforms({
        u_filterFlag: 0,
        u_colorMatrix: 0,
      });
    } else {
      this.setUniforms({
        u_filterFlag: 1,
        u_colorMatrix: m,
      });
    }
    return this;
  }

  // apply linear color transform
  transformColor(...m) {
    let transform = this.uniforms.u_colorMatrix;
    if(transform) {
      transform = multiply(transform, m);
    } else {
      transform = m;
    }
    this.setUniforms({
      u_filterFlag: 1,
      u_colorMatrix: transform,
    });
    return this;
  }

  blur(length) {
    this[_mesh] = null;
    this[_filter].push(`blur(${length}px)`);
    return this;
  }

  brightness(p = 1.0) {
    this[_filter].push(`brightness(${100 * p}%)`);
    return this.transformColor(...brightness(p));
  }

  contrast(p = 1.0) {
    this[_filter].push(`contrast(${100 * p}%)`);
    return this.transformColor(...contrast(p));
  }

  dropShadow(offsetX, offsetY, blurRadius = 0, color = [0, 0, 0, 1]) {
    this[_mesh] = null;
    this[_filter].push(`drop-shadow(${offsetX}px ${offsetY}px ${blurRadius}px ${vectorToRGBA(color)})`);
    return this;
  }

  grayscale(p = 1.0) {
    this[_filter].push(`grayscale(${100 * p}%)`);
    return this.transformColor(...grayscale(p));
  }

  // https://github.com/phoboslab/WebGLImageFilter/blob/master/webgl-image-filter.js#L371
  hueRotate(deg = 0) {
    this[_filter].push(`hue-rotate(${deg}deg)`);
    return this.transformColor(...hueRotate(deg));
  }

  invert(p = 1.0) {
    this[_filter].push(`invert(${100 * p}%)`);
    return this.transformColor(...invert(p));
  }

  opacity(p = 1.0) {
    this[_filter].push(`opacity(${100 * p}%)`);
    return this.transformColor(...opacity(p));
  }

  saturate(p = 1.0) {
    this[_filter].push(`saturate(${100 * p}%)`);
    return this.transformColor(...saturate(p));
  }

  sepia(p = 1.0) {
    this[_filter].push(`sepia(${100 * p}%)`);
    return this.transformColor(...sepia(p));
  }

  url(svgFilter) {
    this[_mesh] = null;
    this[_filter].push(`url(${svgFilter})`);
    return this;
  }

  isPointCollision(x, y, type = 'both') {
    const [w, h] = this[_bound][1];
    [x, y] = normalize([x, y], w, h);

    const meshData = this.meshData;
    const {positions, cells} = meshData;

    function projectionOn([x0, y0], [x1, y1], [x2, y2]) {
      const v2x = x2 - x1;
      const v2y = y2 - y1;
      const p = ((x0 - x1) * v2x + (y0 - y1) * v2y) / (v2x ** 2 + v2y ** 2);
      return p >= 0 && p <= 1;
    }

    for(let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      if(type === 'fill' && cell[0] >= meshData.fillPointCount) break;
      if(type === 'stroke' && cell[0] < meshData.fillPointCount) continue; // eslint-disable-line no-continue
      const [[x1, y1], [x2, y2], [x3, y3]] = cell.map(idx => positions[idx]);
      const s1 = Math.sign((x - x1) * (y2 - y1) - (x2 - x1) * (y - y1));
      if(s1 === 0 && projectionOn([x, y], [x1, y1], [x2, y2])) {
        return true;
      }
      const s2 = Math.sign((x - x2) * (y3 - y2) - (x3 - x2) * (y - y2));
      if(s2 === 0 && projectionOn([x, y], [x2, y2], [x3, y3])) {
        return true;
      }
      const s3 = Math.sign((x - x3) * (y1 - y3) - (x1 - x3) * (y - y3));
      if(s3 === 0 && projectionOn([x, y], [x3, y3], [x1, y1])) {
        return true;
      }
      if(s1 === s2 && s1 === s3) return true;
    }

    return false;
  }

  isPointInPath(x, y) {
    return this.isPointCollision(x, y, 'fill');
  }

  isPointInStroke(x, y) {
    return this.isPointCollision(x, y, 'stroke');
  }
}
