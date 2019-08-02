export default function vectorToRGBA(vector) {
  return `rgba(${vector.map((c, i) => {
    if(i < 3) return Math.floor(c * 255);
    return c;
  }).join()})`;
}
