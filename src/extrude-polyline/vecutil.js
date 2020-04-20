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
};
