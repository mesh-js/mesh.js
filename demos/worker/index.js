const worker = new Worker('./basic.worker.js');

worker.onmessage = function (event) {
  const bitmap = event.data.buffer;
  const canvas = document.querySelector('canvas');
  const bitmapContext = canvas.getContext('bitmaprenderer');
  if(bitmapContext) {
    bitmapContext.transferFromImageBitmap(bitmap);
  } else {
    const context = canvas.getContext('2d');
    context.drawImage(bitmap, 0, 0);
  }
};