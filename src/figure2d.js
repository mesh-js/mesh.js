import parse from 'parse-svg-path';
import getBounds from 'bound-points';
import abs from 'abs-svg-path';
import normalize from './normalize-svg-path';
import createContours from './svg-path-contours';
import {getPointAtLength, getTotalLength} from './utils/contours';

const _contours = Symbol('contours');
const _path = Symbol('path');
const _simplify = Symbol('simplify');
const _scale = Symbol('scale');

export default class Figure2D {
  constructor(options = {}) {
    if(typeof options === 'string') options = {path: options};
    if(options.path) this[_path] = parse(options.path);
    else this[_path] = [];
    this[_contours] = null;
    this[_simplify] = options.simplify || 0;
    this[_scale] = options.scale || 1;
  }

  get contours() {
    let ret = null;
    if(!this[_contours] && this[_path]) {
      const path = normalize(abs(this[_path]));
      this[_contours] = createContours(path, this[_scale], this[_simplify]);
      this[_contours].path = path;
      this[_contours].simplify = this[_simplify];
      this[_contours].scale = this[_scale];
    }
    if(this[_contours]) {
      ret = this[_contours].map(c => [...c]);
      ret.path = this[_contours].path;
      ret.simplify = this[_contours].simplify;
      ret.scale = this[_contours].scale;
    }
    return ret;
  }

  get path() {
    return this[_path];
  }

  get simplify() {
    return this[_simplify];
  }

  get boundingBox() {
    const contours = this.contours;
    if(contours) {
      const points = contours.reduce((a, b) => [...a, ...b]);
      return getBounds(points);
    }
    return null;
  }

  getPointAtLength(length) {
    if(this.contours) {
      return getPointAtLength(this[_contours], length * this.getTotalLength());
    }
    return null;
  }

  getTotalLength() {
    if(this.contours) {
      return getTotalLength(this[_contours]);
    }
    return 0;
  }

  addPath(path) {
    this[_contours] = null;
    this[_path].push(...parse(path));
  }

  beginPath() {
    this[_path] = [];
    this.moveTo(0, 0);
  }

  clear() {
    this[_path] = [];
    this[_contours] = null;
  }

  arc(x, y, radius, startAngle, endAngle, anticlockwise = 0) {
    const PI2 = 2 * Math.PI;
    if(endAngle === startAngle) return;
    endAngle = (endAngle - startAngle) % PI2;
    if(endAngle <= 0) endAngle += PI2;

    let path = '';

    const startPoint = [x + radius * Math.cos(startAngle), y + radius * Math.sin(startAngle)];
    const direction = anticlockwise ? -1 : 1;
    const endPoint = [x + radius * Math.cos(endAngle), y + direction * radius * Math.sin(endAngle)];

    const largeArcFlag = endAngle > Math.PI ? 1 : 0;
    const sweepFlag = Number(!anticlockwise);

    if(endAngle < PI2) {
      path += `M${x} ${y}L${startPoint.join(' ')}`;
    } else {
      endPoint[1] += direction * 1e-2;
      path += `M${startPoint.join(' ')}`;
    }

    path += `A${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${endPoint.join(' ')}`;
    if(endAngle >= PI2) {
      path += 'Z';
    }
    this.addPath(path);
  }

  arcTo(rx, ry, xAxisRotation, largeArcFlag, sweepFlag, x, y) {
    this[_contours] = null;
    this[_path].push(['A', rx, ry, xAxisRotation, largeArcFlag, sweepFlag, x, y]);
  }

  moveTo(x, y) {
    this[_contours] = null;
    this[_path].push(['M', x, y]);
  }

  lineTo(x, y) {
    this[_contours] = null;
    this[_path].push(['L', x, y]);
  }

  bezierCurveTo(x1, y1, x2, y2, x, y) {
    this[_contours] = null;
    this[_path].push(['C', x1, y1, x2, y2, x, y]);
  }

  quadraticCurveTo(x1, y1, x, y) {
    this[_contours] = null;
    this[_path].push(['Q', x1, y1, x, y]);
  }

  rect(x, y, width, height) {
    const path = `M${x} ${y}L${x + width} ${y}L${x + width} ${y + height}L${x} ${y + height}Z`;
    this.addPath(path);
  }

  closePath() {
    this[_contours] = null;
    this[_path].push('Z');
  }
}