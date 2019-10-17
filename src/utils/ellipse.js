// 根据椭圆旋转角度求椭圆上的点
const PI2 = Math.PI * 2;

export function getPoint(x0, y0, a, b, theta) {
  theta %= PI2;
  if(theta < 0) theta += PI2;
  const k = Math.tan(theta);
  if(Number.isFinite(k)) {
    // y - y0 = k (x - x0)
    // y = k x + (y0 - k x0)
    // x ** 2 / a ** 2 + y ** 2 / b ** 2 = 1
    // x ** 2 / a ** 2 + (kx + (y0 - kx0)) ** 2 / b ** 2 - 1 = 0
    const c = y0 - k * x0;
    const t = 1 / a ** 2 + k ** 2 / b ** 2;
    const p = 2 * c * k / b ** 2;
    const q = c ** 2 / b ** 2 - 1;

    // const fx = (x) => t * x ** 2 + p * x + q;
    let d = -1;
    if(theta <= Math.PI / 2 || theta > 3 * Math.PI / 2) d = 1;
    const x = (-p + d * Math.sqrt(p ** 2 - 4 * t * q)) / (2 * t);
    const y = k * x + c;
    return [x, y];
  }
  if(k === Infinity) {
    return [x0, y0 + b];
  }
  return [x0, y0 - b];
}