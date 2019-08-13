export function normalize([x, y, z], w, h, d) {
  x = (x * 2) / w - 1;
  y = 1 - (y * 2) / h;
  if(Number.isFinite(d)) {
    z = (z * 2) / d - 1;
    return [x, y, z];
  }
  return [x, y];
}

export function denormalize([x, y, z], w, h, d) {
  x = (x + 1) * 0.5 * w;
  y = (1 - y) * 0.5 * h;
  if(Number.isFinite(d)) {
    z = (z + 1) * 0.5 * d;
    return [x, y, z];
  }
  return [x, y];
}