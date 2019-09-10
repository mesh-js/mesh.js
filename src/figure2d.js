import parse from 'parse-svg-path';
import simplify from 'simplify-path';
import contours from 'svg-path-contours';
import arc from 'arc-to';
import {distance} from './utils/positions';

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
      this[_contours].totalLength = getLength(this[_contours]);
      this[_contours].closed = /Z$/ig.test(this[_path]);
    }
    if(this[_contours]) {
      ret = this[_contours].map(c => [...c]);
      ret.totalLength = this[_contours].totalLength;
      ret.closed = this[_contours].closed;
    }
    return ret;
  }

  get contoursLength() {
    return this.contours.totalLength;
  }

  get path() {
    return this[_path];
  }

  get simplify() {
    return this[_simplify];
  }

  getPointAtLength(length) {
    length = Number(length);
    if(!Number.isFinite(length)) {
      throw new TypeError('Failed to execute \'getPointAtLength\' on figure: The provided float value is non-finite.');
    }

    const contours = this.contours;

    if(length <= 0) {
      const p0 = contours[0][0];
      const p1 = contours[0][1];
      const angle = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
      return {
        x: p0[0],
        y: p0[1],
        angle,
      };
    }

    if(length > this.contoursLength) {
      const points = contours[contours.length - 1];
      const p0 = points[points.length - 2];
      const p1 = points[points.length - 1];
      const angle = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
      return {
        x: p1[0],
        y: p1[1],
        angle,
      };
    }

    for(let i = 0; i < contours.length; i++) {
      const points = contours[i];
      let p0 = points[0];
      for(let j = 1; j < points.length; j++) {
        const p1 = points[j];
        const d = distance(p0, p1);
        if(length < d) {
          const p = length / d;
          const angle = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
          return {
            x: p0[0] * (1 - p) + p1[0] * p,
            y: p0[1] * (1 - p) + p1[1] * p,
            angle,
          };
        }
        length -= d;
        p0 = p1;
      }
    }
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