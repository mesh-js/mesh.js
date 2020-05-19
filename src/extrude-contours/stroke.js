import {
  create,
  scaleAndAdd,
  direction,
  normal,
  copy,
  clone,
  computeMiter,
  dot,
  sub,
  rotate,
  cross,
  add,
} from './utils';

const tmp = create();
const lineA = create();
const lineB = create();
const tangent = create();
const miter = create();

const MAX_MITER_VALUE = 1e20; // infinity * 0 cause NaN, fix #7

export class Stroke {
  constructor({
    lineWidth = 1,
    lineJoin = 'miter',
    miterLimit = 10,
    lineCap = 'butt',
    roundSegments = 20} = {}) {
    this.lineWidth = lineWidth;
    this.lineJoin = lineJoin;
    this.miterLimit = miterLimit;
    this.lineCap = lineCap;
    this.roundSegments = roundSegments;
    this._normal = null;
  }

  build(points, closed = false) {
    let total = points.length;
    points = [...points];
    if(total < 2) return points;

    if(closed) {
      if(points[0][0] !== points[total - 1][0] || points[0][1] !== points[total - 1][1]) {
        points.push([...points[0]]);
      }
      points.push([...points[1]]);
    }
    total = points.length;

    // clear flags
    this._normal = null;
    const contours = {
      left: [],
      right: [],
    };

    const halfThick = this.lineWidth / 2;

    const cap = this.lineCap;
    if(!closed && cap === 'square') {
      direction(lineA, points[0], points[1]);
      scaleAndAdd(points[0], points[0], lineA, halfThick);
      const idx = points.length - 1;
      direction(lineA, points[idx], points[idx - 1]);
      scaleAndAdd(points[idx], points[idx], lineA, halfThick);
    }

    // join each segment
    for(let i = 1; i < total; i++) {
      const last = points[i - 1];
      const cur = points[i];
      const next = points[i + 1];
      this._seg(contours, last, cur, next, halfThick, closed);
    }

    if(!closed && cap === 'round') {
      capRound(contours, this.roundSegments);
    }

    const ret = [
      ...contours.left,
      ...contours.right.reverse(),
    ];

    return ret;
  }

  _seg(contours, last, cur, next, halfThick, closed) {
    const joinBevel = this.lineJoin === 'bevel';
    const joinRound = this.lineJoin === 'round';

    // get unit direction of line
    direction(lineA, cur, last);

    // if we don't yet have a normal from previous join,
    // compute based on line start - end
    if(!this._normal) {
      this._normal = create();
      normal(this._normal, lineA);
    }

    if(!contours.left.length) {
      // start
      extrusions(contours, last, this._normal, halfThick);
    }

    if(!next) { // no next segment, simple extrusion
      normal(this._normal, lineA);
      if(!closed) {
        extrusions(contours, cur, this._normal, halfThick);
      } else {
        extrusions(contours, last, this._normal, halfThick);
      }
    } else { // we have a next segment, start with miter
      // get unit dir of next line
      direction(lineB, next, cur);

      // stores tangent & miter
      let miterLen = computeMiter(tangent, miter, lineA, lineB, halfThick);
      // infinity * 0 cause NaN, fix #7
      miterLen = Math.min(miterLen, MAX_MITER_VALUE);

      // get orientation
      const flip = (dot(tangent, this._normal) < 0) ? -1 : 1;

      let bevel = joinBevel || joinRound;

      if(!bevel && this.lineJoin === 'miter') {
        const limit = miterLen / halfThick;
        if(limit > this.miterLimit) {
          // miterLen = this.miterLimit * halfThick;
          bevel = true;
        }
      }

      // let len = Infinity;
      // if(next && !nextnext) len = Math.hypot(next[0] - cur[0], next[1] - cur[1]);

      if(bevel) {
        // next two points in our first segment
        scaleAndAdd(tmp, cur, this._normal, -halfThick * flip);
        addPoint(contours, tmp, flip);
        let maxLen = Infinity;
        if(last) {
          maxLen = Math.min(maxLen, Math.hypot(cur[0] - last[0], cur[1] - last[1]));
        }
        if(next) {
          maxLen = Math.min(maxLen, Math.hypot(next[0] - cur[0], next[1] - cur[1]));
        }
        const len = Math.max(halfThick, Math.min(miterLen, maxLen));
        scaleAndAdd(tmp, cur, miter, len * flip);
        addPoint(contours, tmp, -flip);

        if(next) {
          normal(tmp, lineB);
          copy(this._normal, tmp); // store normal for next round
          scaleAndAdd(tmp, cur, tmp, -halfThick * flip);
          if(joinRound) {
            const pEnd = clone(tmp);
            const pStart = flip > 0 ? contours.left[contours.left.length - 1]
              : contours.right[contours.right.length - 1];
            const o = clone(cur);
            const p1 = sub(create(), pStart, o);
            const p2 = sub(create(), pEnd, o);
            const delta = Math.PI / this.roundSegments;
            for(let i = 0; i < this.roundSegments; i++) {
              rotate(p1, p1, [0, 0], flip * delta);
              if(Math.sign(cross(tmp, p1, p2)[2]) !== flip) {
                break;
              } else {
                add(tmp, p1, o);
              }
              addPoint(contours, tmp, flip);
            }
            addPoint(contours, pEnd, flip);
          } else {
            addPoint(contours, tmp, flip);
          }
        }
      } else {
        extrusions(contours, cur, miter, miterLen);
        copy(this._normal, miter);
      }
    }
  }
}

function addPoint(contours, point, flip) {
  if(flip > 0) {
    contours.left.push(clone(point));
  } else {
    contours.right.push(clone(point));
  }
}

function extrusions(contours, point, normal, scale, flip = -1) {
  // next two points to end our segment
  scaleAndAdd(tmp, point, normal, -scale);
  addPoint(contours, tmp, -flip);

  scaleAndAdd(tmp, point, normal, scale);
  addPoint(contours, tmp, flip);
}

function capRound({left, right}, roundSegments) {
  const t = create();
  const normal = create();

  let pStart = left[0];
  let pEnd = right[0];
  let center = [0.5 * (pStart[0] + pEnd[0]), 0.5 * (pStart[1] + pEnd[1])];
  sub(normal, pStart, center);

  for(let i = 1; i <= roundSegments; i++) {
    const rad = -1 * Math.PI * i / roundSegments;
    rotate(t, normal, [0, 0], rad);
    add(tmp, center, t);
    left.unshift(clone(tmp));
  }

  pStart = right[right.length - 1];
  pEnd = left[left.length - 1];
  center = [0.5 * (pStart[0] + pEnd[0]), 0.5 * (pStart[1] + pEnd[1])];
  sub(normal, pStart, center);

  for(let i = 1; i <= roundSegments; i++) {
    const rad = -1 * Math.PI * i / roundSegments;
    rotate(t, normal, [0, 0], rad);
    add(tmp, center, t);
    right.push(clone(tmp));
  }
}