import number from 'as-number';
import * as vec from './vecutil';

const tmp = vec.create();
const capEnd = vec.create();
const lineA = vec.create();
const lineB = vec.create();
const tangent = vec.create();
const miter = vec.create();

const util = require('polyline-miter-util');
const computeMiter = util.computeMiter,
  normal = util.normal,
  direction = util.direction;

const MAX_MITER_VALUE = 1e20; // infinity * 0 cause NaN, fix #7

function Stroke(opt) {
  if(!(this instanceof Stroke)) return new Stroke(opt);
  opt = opt || {};
  this.miterLimit = number(opt.miterLimit, 10);
  this.thickness = number(opt.thickness, 1);
  this.join = opt.join || 'miter';
  this.cap = opt.cap || 'butt';
  this._normal = null;
  this._lastFlip = -1;
  this._started = false;
}

Stroke.prototype.mapThickness = function (point, i, points) {
  return this.thickness;
};

Stroke.prototype.build = function (points) {
  const complex = {
    positions: [],
    cells: [],
  };

  if(points.length <= 1) return complex;

  const total = points.length;

  // clear flags
  this._lastFlip = -1;
  this._started = false;
  this._normal = null;

  // join each segment
  for(let i = 1, count = 0; i < total; i++) {
    const last = points[i - 1];
    const cur = points[i];
    const next = i < points.length - 1 ? points[i + 1] : null;
    const thickness = this.mapThickness(cur, i, points);
    const amt = this._seg(complex, count, last, cur, next, thickness / 2);
    count += amt;
  }
  return complex;
};

Stroke.prototype._seg = function (complex, index, last, cur, next, halfThick) {
  let count = 0;
  const cells = complex.cells;
  const positions = complex.positions;
  const capSquare = this.cap === 'square';
  const joinBevel = this.join === 'bevel';

  // get unit direction of line
  direction(lineA, cur, last);

  // if we don't yet have a normal from previous join,
  // compute based on line start - end
  if(!this._normal) {
    this._normal = vec.create();
    normal(this._normal, lineA);
  }

  // if we haven't started yet, add the first two points
  if(!this._started) {
    this._started = true;

    // if the end cap is type square, we can just push the verts out a bit
    if(capSquare) {
      vec.scaleAndAdd(capEnd, last, lineA, -halfThick);
      last = capEnd;
    }

    extrusions(positions, last, this._normal, halfThick);
  }

  cells.push([index + 0, index + 1, index + 2]);

  /*
    // now determine the type of join with next segment

    - round (TODO)
    - bevel
    - miter
    - none (i.e. no next segment, use normal)
     */

  if(!next) { // no next segment, simple extrusion
    // now reset normal to finish cap
    normal(this._normal, lineA);

    // push square end cap out a bit
    if(capSquare) {
      vec.scaleAndAdd(capEnd, cur, lineA, halfThick);
      cur = capEnd;
    }

    extrusions(positions, cur, this._normal, halfThick);
    cells.push(this._lastFlip === 1 ? [index, index + 2, index + 3] : [index + 2, index + 1, index + 3]);

    count += 2;
  } else { // we have a next segment, start with miter
    // get unit dir of next line
    direction(lineB, next, cur);

    // stores tangent & miter
    let miterLen = computeMiter(tangent, miter, lineA, lineB, halfThick);
    // infinity * 0 cause NaN, fix #7
    miterLen = Math.min(miterLen, MAX_MITER_VALUE);

    // normal(tmp, lineA)

    // get orientation
    let flip = (vec.dot(tangent, this._normal) < 0) ? -1 : 1;

    let bevel = joinBevel;
    if(!bevel && this.join === 'miter') {
      const limit = miterLen / (halfThick);
      if(limit > this.miterLimit) bevel = true;
    }

    if(bevel) {
      // next two points in our first segment
      vec.scaleAndAdd(tmp, cur, this._normal, -halfThick * flip);
      positions.push(vec.clone(tmp));
      vec.scaleAndAdd(tmp, cur, miter, miterLen * flip);
      positions.push(vec.clone(tmp));

      cells.push(this._lastFlip !== -flip
        ? [index, index + 2, index + 3]
        : [index + 2, index + 1, index + 3]);

      // now add the bevel triangle
      cells.push([index + 2, index + 3, index + 4]);

      normal(tmp, lineB);
      vec.copy(this._normal, tmp); // store normal for next round

      vec.scaleAndAdd(tmp, cur, tmp, -halfThick * flip);
      positions.push(vec.clone(tmp));

      // //the miter is now the normal for our next join
      count += 3;
    } else { // miter
      // next two points for our miter join
      extrusions(positions, cur, miter, miterLen);
      cells.push(this._lastFlip === 1
        ? [index, index + 2, index + 3]
        : [index + 2, index + 1, index + 3]);

      flip = -1;

      // the miter is now the normal for our next join
      vec.copy(this._normal, miter);
      count += 2;
    }
    this._lastFlip = flip;
  }
  return count;
};

function extrusions(positions, point, normal, scale) {
  // next two points to end our segment
  vec.scaleAndAdd(tmp, point, normal, -scale);
  positions.push(vec.clone(tmp));

  vec.scaleAndAdd(tmp, point, normal, scale);
  positions.push(vec.clone(tmp));
}

export default Stroke;