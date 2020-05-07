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
  this.roundSegments = opt.roundSegments || 20;
  this._normal = null;
  this._lastFlip = -1;
  this._started = false;
}

Stroke.prototype.mapThickness = function (point, i, points) {
  return this.thickness;
};

Stroke.prototype.build = function (points, closed = false) {
  points = [...points];

  const complex = {
    positions: [],
    cells: [],
  };

  if(points.length <= 1) return complex;

  let closeNext = null;
  if(closed) {
    const [a, b] = points;
    const v = [b[0] - a[0], b[1] - a[1]];
    closeNext = vec.scaleAndAdd(vec.create(), a, v, 1e-7);
    points.unshift([...points[points.length - 2]]);
  }

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
    this._seg(complex, count, last, cur, next, thickness / 2, closed, closeNext);
    count = complex.positions.length - 2;
  }
  if(closed) {
    complex.positions = complex.positions.slice(2);
    complex.cells = complex.cells.slice(2).map(([a, b, c]) => [a - 2, b - 2, c - 2]);
  }

  return complex;
};

Stroke.prototype._seg = function (complex, index, last, cur, next, halfThick, closed, closeNext, cap = this.cap) { // eslint-disable-line complexity
  const cells = complex.cells;
  const positions = complex.positions;
  const capSquare = cap === 'square';
  const capRound = cap === 'round';
  const capRoundStart = cap === 'roundStart';
  const capRoundEnd = cap === 'roundEnd';
  const joinBevel = this.join === 'bevel';
  const joinRound = this.join === 'round';

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
    if(capRound || capRoundStart) {
      round(complex, last, this._normal, halfThick, -1, this.roundSegments);
      for(let i = 1; i <= this.roundSegments; i++) {
        cells.push([index, index + i, index + i + 1]);
      }
      index += this.roundSegments + 2;
    }
    extrusions(complex, last, this._normal, halfThick);
  }

  cells.push([index + 0, index + 1, index + 2]);

  /*
    // now determine the type of join with next segment

    - round (TODO)
    - bevel
    - miter
    - none (i.e. no next segment, use normal)
     */

  if(!closed && !next) { // no next segment, simple extrusion
    // now reset normal to finish cap
    normal(this._normal, lineA);

    // push square end cap out a bit
    if(capSquare) {
      vec.scaleAndAdd(capEnd, cur, lineA, halfThick);
      cur = capEnd;
    }

    extrusions(complex, cur, this._normal, halfThick);
    cells.push(this._lastFlip === 1 ? [index, index + 2, index + 3] : [index + 2, index + 1, index + 3]);

    if(capRound || capRoundEnd) {
      const idx = complex.positions.length;
      round(complex, cur, this._normal, halfThick, 1, this.roundSegments);
      for(let i = 1; i <= this.roundSegments; i++) {
        cells.push([idx, idx + i, idx + i + 1]);
      }
      index += this.roundSegments + 2;
    }
  } else { // we have a next segment, start with miter
    // get unit dir of next line
    if(!next) direction(lineB, closeNext, cur);
    else direction(lineB, next, cur);

    // stores tangent & miter
    let miterLen = computeMiter(tangent, miter, lineA, lineB, halfThick);
    // infinity * 0 cause NaN, fix #7
    miterLen = Math.min(miterLen, MAX_MITER_VALUE);

    // normal(tmp, lineA)

    // get orientation
    let flip = (vec.dot(tangent, this._normal) < 0) ? -1 : 1;

    let bevel = joinBevel || joinRound;
    if(!bevel && this.join === 'miter') {
      const limit = miterLen / halfThick;
      if(limit > this.miterLimit) {
        miterLen = this.miterLimit * halfThick;
        bevel = true;
      }
    }

    if(bevel) {
      // next two points in our first segment
      vec.scaleAndAdd(tmp, cur, this._normal, -halfThick * flip);
      positions.push(vec.clone(tmp));

      positions.push(vec.clone(cur));
      // vec.scaleAndAdd(tmp, cur, miter, miterLen * flip);
      // positions.push(vec.clone(tmp));

      cells.push(this._lastFlip !== -flip
        ? [index, index + 2, index + 3]
        : [index + 2, index + 1, index + 3]);

      vec.scaleAndAdd(tmp, cur, miter, miterLen * flip);
      positions.push(vec.clone(tmp));

      if(!joinRound) {
        cells.push(this._lastFlip !== -flip
          ? [index, index + 3, index + 4]
          : [index + 3, index + 1, index + 4]);
      }

      if(next) {
        normal(tmp, lineB);
        vec.copy(this._normal, tmp); // store normal for next round
        vec.scaleAndAdd(tmp, cur, tmp, -halfThick * flip);
        const pE2 = vec.clone(tmp);
        // now add the bevel triangle
        if(!joinRound) {
          cells.push([index + 2, index + 3, index + 5]);
        } else {
          // join round
          const pEnd = positions.pop();
          const o = positions[index + 3];
          const p1 = vec.sub(vec.create(), positions[index + 2], o);
          const p2 = vec.sub(vec.create(), pE2, o);

          const delta = Math.PI / this.roundSegments;
          for(let i = 0; i < this.roundSegments; i++) {
            vec.rotate(p1, p1, [0, 0], flip * delta);
            // console.log(p1, p2, vec.cross([], p1, p2)[2]);
            if(i > 0 && Math.sign(vec.cross(tmp, p1, p2)[2]) !== flip) {
              vec.add(tmp, p2, o);
              positions.push(vec.clone(tmp));
              if(i === 0) {
                cells.push([index + 3, index + 2, index + 5]);
              } else {
                cells.push([index + 3, index + 5 + i - 1, index + 5 + i]);
              }
              break;
            } else {
              vec.add(tmp, p1, o);
              positions.push(vec.clone(tmp));
              if(i === 0) {
                cells.push([index + 3, index + 2, index + 5]);
              } else {
                cells.push([index + 3, index + 5 + i - 1, index + 5 + i]);
              }
            }
          }
          // console.log(index, positions.length);
          cells.push(this._lastFlip !== -flip
            ? [index, index + 3, positions.length]
            : [index + 3, index + 1, positions.length]);
          positions.push(pEnd);
        }

        positions.push(pE2);
      }
      if(!next || !joinRound) {
        cells.push([index + 3, index + 4, index + 5]);
      }
    } else { // miter
      // next two points for our miter join
      extrusions(complex, cur, miter, miterLen);
      cells.push(this._lastFlip === 1
        ? [index, index + 2, index + 3]
        : [index + 2, index + 1, index + 3]);

      flip = -1;

      // the miter is now the normal for our next join
      vec.copy(this._normal, miter);
    }
    this._lastFlip = flip;
  }
};

function extrusions(complex, point, normal, scale) {
  const positions = complex.positions;
  // next two points to end our segment
  vec.scaleAndAdd(tmp, point, normal, -scale);
  positions.push(vec.clone(tmp));

  vec.scaleAndAdd(tmp, point, normal, scale);
  positions.push(vec.clone(tmp));
}

function round(complex, point, normal, scale, dir = 1, roundSegments = 20) {
  const positions = complex.positions;
  // const positions = [];
  const t = vec.create();

  positions.push(vec.clone(point));

  for(let i = 0; i <= roundSegments; i++) {
    const rad = dir * Math.PI * i / roundSegments;
    vec.rotate(t, normal, [0, 0], rad);
    vec.scaleAndAdd(tmp, point, t, -scale);
    positions.push(vec.clone(tmp));
  }
}

export default Stroke;