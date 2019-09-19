
import rgba from 'color-rgba';

export default function parseColor(colorStr) {
  const ret = rgba(colorStr);
  if(!ret || !ret.length) throw new TypeError('Invalid color value.');
  return [ret[0] / 255, ret[1] / 255, ret[2] / 255, ret[3]];
}
