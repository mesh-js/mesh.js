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

export {
  create,
  clone,
  copy,
  scaleAndAdd,
  dot,
};
