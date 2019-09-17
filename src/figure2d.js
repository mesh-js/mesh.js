import parse from 'parse-svg-path';
import simplify from 'simplify-path';
import contours from 'svg-path-contours';
import arc from 'arc-to';
import {distance} from './utils/positions';
import {getPointAtLength, getTotalLength, splitContours} from './utils/contours';

function buildCommand(key, args) {
  return `${key}${args.join(' ')}`;
}

function getLength(contours) {
  let length = 0;
  contours.forEach((points) => {
    let s = points[0];
    for(let i = 1; i < points.length; i++) {
      const p = points[i];
      length += distance(s, p);
      s = p;
    }
  });
  return length;
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

  get contours() {
    let ret = null;
    if(!this[_contours] && this[_path]) {
      this[_contours] = contours(parse(this[_path])).map((path) => {
        return simplify(path, this[_simplify]);
      });
    }
    if(this[_contours]) {
      ret = this[_contours].map(c => [...c]);
    }
    return ret;
  }

  get path() {
    return this[_path];
  }

  get simplify() {
    return this[_simplify];
  }

  splitContours(length, rest = true) {
    if(this.contours) {
      return splitContours(this[_contours], length, rest);
    }
  }

  getPointAtLength(length) {
    if(this.contours) {
      return getPointAtLength(this[_contours], length);
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
    this[_path] += path;
  }

  beginPath() {
    this[_path] = '';
    this.moveTo(0, 0);
  }

  clear() {
    this[_path] = '';
    this[_contours] = null;
  }

  arc(x, y, radius, startAngle, endAngle, anticlockwise = 0) {
    const points = arc(x, y, radius, startAngle, endAngle, anticlockwise);
    const ang = Math.abs(endAngle - startAngle);
    const path = `${points.map(([x, y]) => `${x} ${y}`).join('L')}`;
    if(ang < 2 * Math.PI) {
      this[_path] += `M${x} ${y}L${path}Z`;
    } else {
      this[_path] += `M${path}Z`;
    }
  }

  arcTo(rx, ry, xAxisRotation, largeArcFlag, sweepFlag, x, y) {
    this[_contours] = null;
    this[_path] += buildCommand('A', [rx, ry, xAxisRotation, largeArcFlag, sweepFlag, x, y]);
  }

  moveTo(x, y) {
    this[_contours] = null;
    this[_path] += buildCommand('M', [x, y]);
  }

  lineTo(x, y) {
    this[_contours] = null;
    this[_path] += buildCommand('L', [x, y]);
  }

  bezierCurveTo(x1, y1, x2, y2, x, y) {
    this[_contours] = null;
    this[_path] += buildCommand('C', [x1, y1, x2, y2, x, y]);
  }

  quadraticCurveTo(x1, y1, x, y) {
    this[_contours] = null;
    this[_path] += buildCommand('Q', [x1, y1, x, y]);
  }

  rect(x, y, width, height) {
    this[_path] += `M${x} ${y}L${x + width} ${y}L${x + width} ${y + height}L${x} ${y + height}Z`;
  }

  closePath() {
    this[_contours] = null;
    this[_path] += 'Z';
  }
}