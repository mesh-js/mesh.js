const imageCache = {};

export default function loadImage(src) {
  if(!imageCache[src]) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    imageCache[src] = new Promise((resolve) => {
      img.onload = function () {
        imageCache[src] = img;
        resolve(img);
      };
      img.src = src;
    });
  }
  return Promise.resolve(imageCache[src]);
}