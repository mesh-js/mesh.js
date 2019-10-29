// 根据椭圆旋转角度求椭圆上的点
const PI2 = Math.PI * 2;

export function getPoint(x0, y0, a, b, theta) {
  theta %= PI2;
  if(theta < 0) theta += PI2;
  const k = Math.tan(theta);
  if(Math.abs(k) < 1e5) {
    // y - y0 = k (x - x0)
    // y = k x + (y0 - k x0)
    // (x - x0) ** 2 / a ** 2 + (y - y0) ** 2 / b ** 2 = 1
    const c = y0 - k * x0;
    const t = 1 / a ** 2 + k ** 2 / b ** 2;
    let d = -1;
    if(theta <= Math.PI / 2 || theta > 3 * Math.PI / 2) d = 1;
    const x = d * Math.sqrt(1 / t) + x0;
    const y = k * x + c;
    return [x, y];
  }
  if(theta < Math.PI) {
    return [x0, y0 + b];
  }
  return [x0, y0 - b];
}