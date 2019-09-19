import parse from 'parse-svg-path';
import simplify from 'simplify-path';
import getBounds from 'bound-points';
import contours from './svg-path-contours';
import {getPointAtLength, getTotalLength, splitContours} from './utils/contours';

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

  get boundingBox() {
    const contours = this.contours;
    if(contours) {
      const points = contours.reduce((a, b) => [...a, ...b]);
      return getBounds(points);
    }
    return null;
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
    this[_path] += path;
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
    this[_contours] = null;
    this[_path] += `M${x} ${y}L${x + width} ${y}L${x + width} ${y + height}L${x} ${y + height}Z`;
  }

  closePath() {
    this[_contours] = null;
    this[_path] += 'Z';
  }
}