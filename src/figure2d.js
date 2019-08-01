import parse from 'parse-svg-path';
import simplify from 'simplify-path';
import contours from 'svg-path-contours';
import getBounds from 'bound-points';
import arc from 'arc-to';

function buildCommand(key, args) {
  return `${key}${args.join(' ')}`;
}

const _contours = Symbol('contours');
const _path = Symbol('path');
const _simplify = Symbol('simplify');

export default class Figure2D {
  constructor(options = {}) {
    if(typeof options === 'string') options = {path: options};
    this[_path] = options.path || '';
    this[_contours] = null;
    this[_simplify] = options.simplify || 0;
  }

  clear() {
    this[_path] = '';
    this[_contours] = null;
  }

  get contours() {
    let ret = null;
    if(this[_contours]) return this[_contours].map(c => [...c]);
    if(this[_path]) {
      this[_contours] = contours(parse(this[_path])).map((path) => {
        return simplify(path, this[_simplify]);
      });
      ret = this[_contours].map(c => [...c]);
    }
    if(/Z$/ig.test(this[_path])) ret.closed = true;
    return ret;
  }

  get boundingBox() {
    return getBounds(this.contours);
  }

  get simplify() {
    return this[_simplify];
  }

  addPath(path) {
    this[_contours] = null;
    this[_path] += path;
  }

  beginPath() {
    this.moveTo(0, 0);
  }

  moveTo(x, y) {
    this[_contours] = null;
    this[_path] += buildCommand('M', [x, y]);
  }

  lineTo(x, y) {
    this[_contours] = null;
    this[_path] += buildCommand('L', [x, y]);
  }

  arcTo(rx, ry, xAxisRotation, largeArcFlag, sweepFlag, x, y) {
    this[_contours] = null;
    this[_path] += buildCommand('A', [rx, ry, xAxisRotation, largeArcFlag, sweepFlag, x, y]);
  }

  arc(x, y, radius, startAngle, endAngle, anticlockwise = 0) {
    const points = arc(x, y, radius, startAngle, endAngle, anticlockwise);
    const ang = Math.abs(endAngle - startAngle);
    const path = `${points.map(([x, y]) => `${x} ${y}`).join('L')}`;
    if(ang < 2 * Math.PI) {
      this[_path] += `M${x} ${y}L${path}Z`;
    } else {
      this[_path] += `M${path}`;
    }
  }

  rect(x, y, width, height) {
    this[_path] += `M${x} ${y}L${x + width} ${y}L${x + width} ${y + height}L${x} ${y + height}Z`;
  }

  quadraticCurveTo(x1, y1, x, y) {
    this[_contours] = null;
    this[_path] += buildCommand('Q', [x1, y1, x, y]);
  }

  bezierCurveTo(x1, y1, x2, y2, x, y) {
    this[_contours] = null;
    this[_path] += buildCommand('C', [x1, y1, x2, y2, x, y]);
  }

  closePath() {
    this[_contours] = null;
    this[_path] += 'Z';
  }
}