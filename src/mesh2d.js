import {vec2, mat2d} from 'gl-matrix';
import getBounds from 'bound-points';
import Stroke from './extrude-contours';
import flattenMeshes from './utils/flatten-meshes';
import vectorToRGBA from './utils/vector-to-rgba';
import {multiply, grayscale, brightness,
  saturate, contrast, invert,
  sepia, opacity, hueRotate} from './utils/color-matrix';
import {isUnitTransform} from './utils/transform';
import {getPointAtLength, getTotalLength, getDashContours} from './utils/contours';
import triangulate from './triangulate-contours';
import createContours from './svg-path-contours';
import parseColor from './utils/parse-color';
import Figure2D from './figure2d';
import ENV from './utils/env';

const _mesh = Symbol('mesh');
const _contours = Symbol('contours');
const _stroke = Symbol('stroke');
const _fill = Symbol('fill');
const _strokeColor = Symbol('strokeColor');
const _fillColor = Symbol('fillColor');
const _transform = Symbol('transform');
const _invertTransform = Symbol('invertTransform');
const _uniforms = Symbol('uniforms');
const _texOptions = Symbol('texOptions');
const _blend = Symbol('blend');
const _applyTexture = Symbol('applyTexture');
const _applyTransform = Symbol('applyTransform');
const _applyGradientTransform = Symbol('applyGradientTransform');
const _applyProgram = Symbol('applyProgram');
const _gradient = Symbol('gradient');

const _filter = Symbol('filter');
const _opacity = Symbol('opacity');

const _program = Symbol('program');
const _attributes = Symbol('attributes');

const _pass = Symbol('pass');

const _clipContext = Symbol('clipContext');
const _applyClipPath = Symbol('applyClipPath');

// function normalizePoints(points, bound) {
//   const [w, h] = bound[1];
//   for(let i = 0; i < points.length; i++) {
//     const point = points[i];
//     point[0] = 2 * point[0] / w - 1;
//     point[1] = 1 - 2 * point[1] / h;
//   }
// }

function generateUV(bounds, positions) {
  const [w, h] = [bounds[1][0] - bounds[0][0], bounds[1][1] - bounds[0][1]];
  const ret = [];
  for(let j = 0; j < positions.length; j++) {
    const p = positions[j];
    const uv = [(p[0] - bounds[0][0]) / w, 1 - (p[1] - bounds[0][1]) / h];
    ret.push(uv);
  }
  return ret;
}

function getTexCoord([x, y], [ox, oy, w, h], {scale}) {
  if(!scale) {
    x /= w;
    y = 1 - y / h;
    x -= ox;
    y += oy;
  }

  return [x, y, 0];
}

function accurate(path, scale, simplify) {
  const contours = createContours(path, scale, simplify);
  contours.path = path;
  contours.simplify = simplify;
  contours.scale = scale;
  return contours;
}

export default class Mesh2D {
  constructor(figure) {
    this[_stroke] = null;
    this[_fill] = null;
    this[_transform] = [1, 0, 0, 1, 0, 0];
    this[_opacity] = 1.0;
    this[_uniforms] = {};
    this[_filter] = [];
    this[_blend] = null;
    this[_texOptions] = {};
    this.contours = figure.contours;
    this[_program] = null;
    this[_attributes] = {};
    this[_pass] = [];
  }

  get contours() {
    return this[_contours];
  }

  set contours(contours) {
    this[_mesh] = null;
    this[_contours] = contours;
    const scale = contours.scale;
    const acc = this.transformScale / scale;
    if(acc > 1.5) {
      this.accurate(this.transformScale);
    }
  }

  setProgram(program) {
    this[_program] = program;
    if(this[_mesh]) {
      this[_applyProgram](program);
    }
  }

  get program() {
    return this[_program];
  }

  setAttribute(key, setter) {
    if(setter == null) {
      delete this[_attributes][key];
    } else {
      this[_attributes][key] = setter;
    }
  }

  getOpacity() {
    return this[_opacity];
  }

  setOpacity(value) {
    if(value < 0 || value > 1.0) throw new TypeError('Invalid opacity value.');
    if(this[_mesh]) {
      this[_mesh].positions.forEach((p) => {
        p[2] = 1 / p[2] > 0 ? value : -value;
      });
    }
    this[_opacity] = value;
  }

  setClipPath(path) {
    this.clipPath = path;
    if(this[_uniforms].u_clipSampler) {
      this[_uniforms].u_clipSampler.delete();
    }
    this.setUniforms({
      u_clipSampler: null,
    });
    if(this[_mesh]) {
      delete this[_mesh].attributes.a_clipUV;
    }
    if(path && this[_mesh]) {
      this[_applyClipPath]();
    }
  }

  [_applyClipPath]() {
    if(this.clipPath) {
      if(!this[_clipContext]) {
        this[_clipContext] = ENV.createCanvas(1, 1);
      }
      const [[x, y], [w, h]] = this.boundingBox;
      if(w && h) {
        this[_clipContext].width = w - x;
        this[_clipContext].height = h - y;
      }
      const context = this[_clipContext].getContext('2d');
      const path = new Path2D(this.clipPath);
      context.clearRect(0, 0, this[_clipContext].width, this[_clipContext].height);
      context.save();
      context.translate(-x, -y);
      context.fillStyle = 'white';
      context.fill(path);
      context.restore();
      this[_mesh].clipPath = this[_clipContext];
      const uv = generateUV(this.boundingBox, this[_mesh].position0);
      this[_mesh].attributes.a_clipUV = uv;
    }
  }

  getPointAtLength(length) {
    return getPointAtLength(this[_contours], length);
  }

  getTotalLength() {
    return getTotalLength(this[_contours]);
  }

  get blend() {
    return this[_blend] == null ? 'auto' : this[_blend];
  }

  set blend(blend) {
    this[_blend] = blend;
    if(this[_mesh]) this[_mesh].enableBlend = this.enableBlend;
  }

  get boundingBox() {
    if(this[_mesh] && this[_mesh].boundingBox) return this[_mesh].boundingBox;

    const meshData = this.meshData;
    if(meshData) {
      const positions = meshData.position0;
      if(positions.length) meshData.boundingBox = getBounds(positions);
      else return [[0, 0], [0, 0]];
      return meshData.boundingBox;
    }
    return [[0, 0], [0, 0]];
  }

  get boundingCenter() {
    const bound = this.boundingBox;
    if(bound) {
      return [0.5 * (bound[0][0] + bound[1][0]), 0.5 * (bound[0][1] + bound[1][1])];
    }
    return [0, 0];
  }

  get fillRule() {
    if(this[_fill]) {
      return this[_fill].rule;
    }
    return 'nonzero';
  }

  get lineWidth() {
    if(this[_stroke]) {
      return this[_stroke].lineWidth;
    }
    return 0;
  }

  get lineCap() {
    if(this[_stroke]) {
      return this[_stroke].lineCap;
    }
    return '';
  }

  get lineJoin() {
    if(this[_stroke]) {
      return this[_stroke].lineJoin;
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

  get lineDash() {
    if(this[_stroke]) {
      return this[_stroke].lineDash;
    }
    return null;
  }

  get lineDashOffset() {
    if(this[_stroke]) {
      return this[_stroke].lineDashOffset;
    }
    return 0;
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
    return this[_opacity] < 1.0
      || this[_strokeColor] != null && this[_strokeColor][3] < 1.0
      || this[_fillColor] != null && this[_fillColor][3] < 1.0
      || this[_uniforms].u_colorMatrix != null && this[_uniforms].u_colorMatrix[18] < 1.0
      || this[_uniforms].u_radialGradientVector != null
      || this.beforeRender
      || this.afterRender;
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

  get invertMatrix() {
    if(!this[_invertTransform]) {
      const m = mat2d.invert(this[_transform]);
      this[_invertTransform] = m;
    }
    return this[_invertTransform];
  }

  get transformScale() {
    const m = this[_transform];
    return Math.max(Math.hypot(m[0], m[1]), Math.hypot(m[2], m[3]));
  }

  get uniforms() {
    return this[_uniforms];
  }

  get pass() {
    return this[_pass];
  }

  [_applyProgram](program) {
    const attributes = this[_attributes];
    const positions = this[_mesh].position0;
    const attribs = Object.entries(program._attribute);
    for(let i = 0; i < attribs.length; i++) {
      const [name, opts] = attribs[i];
      if(name !== 'a_color' && name !== 'a_sourceRect' && opts !== 'ignored') {
        const setter = attributes[name];
        // console.log(opts.size);
        if(name === 'uv' && !setter) {
          const bounds = this[_mesh].boundingBox || getBounds(positions);
          this[_mesh].attributes[name] = generateUV(bounds, positions);
        } else {
          this[_mesh].attributes[name] = [];
          for(let j = 0; j < positions.length; j++) {
            const p = positions[j];
            this[_mesh].attributes[name].push(setter ? setter(p, i, positions) : Array(opts.size).fill(0));
          }
        }
      }
    }
  }

  // {stroke, fill}
  get meshData() { // eslint-disable-line complexity
    if(this._updateMatrix) {
      const acc = this.transformScale / this.contours.scale;
      if(acc > 1.5) {
        this.accurate(this.transformScale);
      }
    }
    if(!this[_mesh]) {
      if(!this[_fill] && !this[_stroke]) {
        this.setFill();
      }

      const contours = this[_contours];
      const meshes = {};

      if(contours && contours.length) {
        if(this[_fill]) {
          try {
            const mesh = triangulate(contours, this[_fill]);
            mesh.positions = mesh.positions.map((p) => {
              p.push(this[_opacity]);
              return p;
            });
            mesh.attributes = {
              a_color: Array.from({length: mesh.positions.length}).map(() => this[_fillColor].map(c => Math.round(255 * c))),
              // a_sourceRect: Array.from({length: mesh.positions.length}).map(() => [0, 0, 0, 0]),
            };
            meshes.fill = mesh;
          } catch (ex) {
            // ignore this[_fill]
          }
        }

        if(this[_stroke]) {
          const lineDash = this[_stroke].lineDash;
          let strokeContours = contours;
          if(lineDash) {
            const lineDashOffset = this[_stroke].lineDashOffset;
            strokeContours = getDashContours(contours, lineDash, lineDashOffset);
          }
          const _meshes = strokeContours.map((lines, i) => {
            const closed = lines.length > 1 && vec2.equals(lines[0], lines[lines.length - 1]);
            const points = this[_stroke].build(lines, closed);
            return triangulate([points]);
          });
          _meshes.forEach((mesh) => {
            mesh.positions = mesh.positions.map((p) => {
              p.push(-this[_opacity]);
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
      mesh.position0 = mesh.positions.map(([x, y, z]) => [x, y, z]);

      mesh.uniforms = this[_uniforms];
      // if(!mesh.uniforms.u_filterFlag) mesh.uniforms.u_filterFlag = 0;
      // if(!mesh.uniforms.u_radialGradientVector) mesh.uniforms.u_radialGradientVector = [0, 0, 0, 0, 0, 0];
      this[_mesh] = mesh;

      if(!this[_uniforms].u_texSampler) {
        // mesh.textureCoord = mesh.positions.map(() => [0, 0]);
      } else {
        this[_applyTexture](mesh, this[_texOptions]);
      }

      const transform = this[_transform];
      if(!isUnitTransform(transform)) {
        this[_applyTransform](mesh, transform);
        if(this[_uniforms].u_radialGradientVector) this[_applyGradientTransform]();
      }

      if(this.clipPath) {
        this[_applyClipPath]();
      }

      if(this[_program]) this[_applyProgram](this[_program]);
    }

    if(this._updateMatrix) {
      this[_mesh].matrix = this[_transform];
      this[_applyTransform](this[_mesh], this[_transform]);
      if(this[_uniforms].u_radialGradientVector) this[_applyGradientTransform]();
    }
    return this[_mesh];
  }

  [_applyTransform](mesh, m) {
    const {positions, position0: p} = mesh;

    for(let i = 0; i < positions.length; i++) {
      const [x, y] = p[i];
      const position = positions[i];
      position[0] = x * m[0] + y * m[2] + m[4];
      position[1] = x * m[1] + y * m[3] + m[5];
    }
    this._updateMatrix = false;
  }

  [_applyGradientTransform]() {
    const m = this[_transform];
    const vector = [...this._radialGradientVector];
    if(vector) {
      const [x1, y1, , x2, y2] = vector;
      vector[0] = x1 * m[0] + y1 * m[2] + m[4];
      vector[1] = x1 * m[1] + y1 * m[3] + m[5];
      vector[3] = x2 * m[0] + y2 * m[2] + m[4];
      vector[4] = x2 * m[1] + y2 * m[3] + m[5];
      this[_uniforms].u_radialGradientVector = vector;
    }
  }

  [_applyTexture](mesh, options) {
    function compareRect(r1, r2) {
      if(r1 == null && r2 == null) return true;
      if(r1 == null || r2 == null) return false;
      return r1[0] === r2[0] && r1[1] === r2[1] && r1[2] === r2[2] && r1[3] === r2[3];
    }

    const texture = this[_uniforms].u_texSampler;
    if(!texture) return;

    const {width: imgWidth, height: imgHeight} = texture._img;

    const srcRect = options.srcRect;

    let rect = options.rect || [0, 0];

    if(options.rotated) {
      rect = [-rect[1], rect[0], rect[3], rect[2]];
    }

    if(rect[2] == null) rect[2] = srcRect ? srcRect[2] : imgWidth;
    if(rect[3] == null) rect[3] = srcRect ? srcRect[3] : imgHeight;

    if(options.hidden) {
      mesh.textureCoord = mesh.positions.map(() => [-1, -1, -1]);
    } else if(!mesh.textureCoord
      || !compareRect(this[_texOptions].rect, options.rect)
      || this[_texOptions].hidden !== options.hidden
      || this[_texOptions].rotated !== options.rotated) {
      let m = null;
      if(options.rotated) {
        m = mat2d.rotate(mat2d(1, 0, 0, 1, 0, 0), 0.5 * Math.PI);
        m = mat2d.translate(m, [0, -rect[2]]);
      }
      mesh.textureCoord = mesh.position0.map(([x, y, z]) => {
        if(1 / z > 0) {
          // fillTag
          if(options.rotated) {
            const x0 = x * m[0] + y * m[2] + m[4];
            const y0 = x * m[1] + y * m[3] + m[5];
            [x, y] = [x0, y0];
          }
          const texCoord = getTexCoord([x, y], [rect[0] / rect[2], rect[1] / rect[3], rect[2], rect[3]], options);
          if(options.repeat) texCoord[2] = 1;
          return texCoord;
        }
        return [-1, -1, -1];
      });
    }

    if(srcRect) {
      const sRect = [srcRect[0] / imgWidth, srcRect[1] / imgHeight, srcRect[2] / imgWidth, srcRect[3] / imgHeight];
      mesh.attributes.a_sourceRect = mesh.positions.map(() => [...sRect]);
    } else {
      mesh.attributes.a_sourceRect = mesh.positions.map(() => [0, 0, 0, 0]);
    }
  }

  accurate(scale) {
    if(!this.contours) return;
    const path = this.contours.path;
    if(path) {
      const simplify = this.contours.simplify;
      const contours = accurate(this.contours.path, 2 * scale, simplify);
      this[_mesh] = null;
      this[_contours] = contours;
    }
  }

  canIgnore() {
    const noStroke = this[_stroke] == null || this[_stroke].lineWidth === 0 || this[_strokeColor][3] === 0;
    const noFill = this[_fill] == null || this[_fillColor][3] === 0;
    const noGradient = this[_uniforms].u_radialGradientVector == null;
    const noTexture = this[_uniforms].u_texSampler == null;
    return this[_opacity] === 0 || (this[_program] == null
      && noStroke && noFill && noGradient && noTexture && !this.beforeRender && !this.afterRender);
  }

  // join: 'miter' or 'bevel'
  // cap: 'butt' or 'square'
  // lineDash: null
  // lineDashOffset: 0
  setStroke({
    thickness = 1,
    cap = 'butt',
    join = 'miter',
    miterLimit = 10,
    color = [0, 0, 0, 0],
    lineDash = null,
    lineDashOffset = 0,
    roundSegments = 20,
  } = {}) {
    this[_mesh] = null;
    this[_stroke] = new Stroke({
      lineWidth: thickness,
      lineCap: cap,
      lineJoin: join,
      miterLimit,
      roundSegments});
    if(typeof color === 'string') color = parseColor(color);
    this[_strokeColor] = color;
    this[_stroke].lineDash = lineDash;
    this[_stroke].lineDashOffset = lineDashOffset;
    return this;
  }

  setFill({rule = this.fillRule, color = [0, 0, 0, 0]} = {}) {
    this[_mesh] = null;
    this[_fill] = {rule};
    if(typeof color === 'string') color = parseColor(color);
    this[_fillColor] = color;
    return this;
  }

  /**
    options: {
      scale: false,
      repeat: false,
      rotated: false,
      rect: [10, 10],
      srcRect: [...],
      hidden: false,
    }
   */
  setTexture(texture, options = {}) {
    if(texture && texture.image) {
      const {image, rect} = texture;
      texture = image;
      if(options.rect) {
        for(let i = 0; i < options.rect.length; i++) {
          rect[i] = options.rect[i];
        }
      }
      options.rect = rect;
    }
    if(!this[_fill]) {
      this.setFill();
    }
    this.setUniforms({
      u_texSampler: texture,
    });

    if(this[_mesh]) {
      this[_applyTexture](this[_mesh], options);
    }
    this[_texOptions] = options;
    return this;
  }

  setCircularGradient({vector, colors: gradientColors, type = 'fill'} = {}) {
    if(vector.length !== 3) throw new TypeError('Invalid linearGradient.');
    this.setGradient({vector, colors: gradientColors, type});
  }

  setLinearGradient({vector, colors: gradientColors, type = 'fill'} = {}) {
    if(vector.length !== 4) throw new TypeError('Invalid linearGradient.');
    this.setGradient({vector, colors: gradientColors, type});
  }

  setRadialGradient({vector, colors: gradientColors, type = 'fill'} = {}) {
    if(vector.length !== 6) throw new TypeError('Invalid radialGradient.');
    this.setGradient({vector, colors: gradientColors, type});
  }

  /**
    vector: [x0, y0, r0, x1, y1, r1],
    colors: [{offset:0, color}, {offset:1, color}, ...],
   */
  setGradient({vector, colors: gradientColors, type = 'fill'} = {}) {
    gradientColors = gradientColors.map(({offset, color}) => {
      if(typeof color === 'string') color = parseColor(color);
      return {offset, color};
    });

    this[_gradient] = this[_gradient] || {};
    this[_gradient][type] = {vector, colors: gradientColors};

    gradientColors.sort((a, b) => {
      return a.offset - b.offset;
    });

    const colorSteps = [];
    gradientColors.forEach(({offset, color}) => {
      colorSteps.push(offset, ...color);
    });

    let _vector;
    if(vector.length === 4) {
      // linear gradient;
      _vector = [vector[0], vector[1], 0, vector[2], vector[3], 0];
    } else {
      _vector = [...vector];
    }

    if(colorSteps.length < 40) colorSteps.push(-1);
    if(colorSteps.length > 40) throw new Error('Too many colors, should be less than 8 colors');

    this._radialGradientVector = _vector;
    this[_uniforms].u_colorSteps = colorSteps;
    if(type === 'fill') this[_uniforms].u_gradientType = 1;
    else this[_uniforms].u_gradientType = 0;

    this[_applyGradientTransform]();

    return this;
  }

  setUniforms(uniforms = {}) {
    Object.assign(this[_uniforms], uniforms);
    return this;
  }

  setTransform(...m) {
    const transform = this[_transform];
    if(!mat2d.equals(m, transform)) {
      this[_transform] = m;
      delete this[_invertTransform];
      this._updateMatrix = true;
    }
    return this;
  }

  transform(...m) {
    const transform = this[_transform];
    this[_transform] = mat2d(transform) * mat2d(m);
    delete this[_invertTransform];
    this._updateMatrix = true;
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
    this.setColorTransform(...transform);
    return this;
  }

  blur(length) {
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
    if(Array.isArray(color)) color = vectorToRGBA(color);
    this[_filter].push(`drop-shadow(${offsetX}px ${offsetY}px ${blurRadius}px ${color})`);
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
    this[_filter].push(`url(${svgFilter})`);
    return this;
  }

  isPointCollision(x, y, type = 'both') {
    const meshData = this.meshData;
    const {positions, cells} = meshData;

    const m = this.invertMatrix;
    const x0 = m[0] * x + m[2] * y + m[4];
    const y0 = m[1] * x + m[3] * y + m[5];
    const box = this.boundingBox;
    if(x0 < box[0][0] || x0 > box[1][0] || y0 < box[0][1] || y0 > box[1][1]) {
      return false;
    }

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
      if(s1 === 1 && s2 === 1 && s3 === 1
        || s1 === -1 && s2 === -1 && s3 === -1) {
        return true;
      }
    }

    return false;
  }

  isPointInFill(x, y) {
    return this.isPointCollision(x, y, 'fill');
  }

  isPointInStroke(x, y) {
    return this.isPointCollision(x, y, 'stroke');
  }

  addPass(program, {width, height, ...uniforms} = {}) {
    const figure = new Figure2D();
    figure.rect(0, 0, width, height);
    const mesh = new Mesh2D(figure, {width, height});
    mesh.setUniforms(uniforms);
    mesh.setProgram(program);
    this[_pass].push(mesh);
  }
}
