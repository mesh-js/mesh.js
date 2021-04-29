import {vec2} from 'gl-matrix';

function clone(arr) {
  return [arr[0], arr[1]];
}

function create() {
  return [0, 0];
}

const copy = vec2.copy;
const scaleAndAdd = vec2.scaleAndAdd;
const dot = vec2.dot;
const rotate = vec2.rotate;
const cross = vec2.cross;
const sub = vec2.sub;
const add = vec2.add;
const normalize = vec2.normalize;
const set = vec2.set;

const tmp = create();

function computeMiter(tangent, miter, lineA, lineB, halfThick) {
  // get tangent line
  add(tangent, lineA, lineB);
  normalize(tangent, tangent);

  // get miter as a unit vector
  set(miter, -tangent[1], tangent[0]);
  set(tmp, -lineA[1], lineA[0]);

  // get the necessary length of our miter
  const miterLen = halfThick / dot(miter, tmp);
  return Math.abs(miterLen); // avoid -Infinity
}

function normal(out, dir) {
  // get perpendicular
  set(out, -dir[1], dir[0]);
  return out;
}

function direction(out, a, b) {
  // get unit dir of two lines
  sub(out, a, b);
  normalize(out, out);
  return out;
}

export {
  create,
  clone,
  copy,
  scaleAndAdd,
  dot,
  rotate,
  cross,
  sub,
  add,

  computeMiter,
  normal,
  direction,
};
