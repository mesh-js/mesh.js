import parseFont from './parse-font';

function create2DContext() {
  let canvas;
  if(typeof OffscreenCanvas === 'function' && typeof createImageBitmap === 'function') {
    canvas = new OffscreenCanvas(1, 1);
  } else {
    canvas = document.createElement('canvas');
  }
  return canvas.getContext('2d');
}


let textContext = null;

export default function createText(text, {font, fillColor, strokeColor}, flipY = true) {
  if(!textContext) {
    // textContext = document.createElement('canvas').getContext('2d');
    textContext = create2DContext();
  }
  textContext.save();
  textContext.font = font;
  const {width} = textContext.measureText(text);
  textContext.restore();

  const fontInfo = parseFont(font);
  const height = fontInfo.pxLineHeight;

  if(!fillColor && !strokeColor) fillColor = '#000';

  const canvas = textContext.canvas;
  canvas.width = Math.ceil(width);
  canvas.height = Math.ceil(height);

  textContext.save();
  textContext.font = font;
  textContext.textAlign = 'center';
  textContext.textBaseline = 'middle';

  const top = canvas.height / 2;
  const left = canvas.width / 2;

  if(fillColor) {
    textContext.fillStyle = fillColor;
    textContext.fillText(text, left, top);
  }
  if(strokeColor) {
    textContext.strokeStyle = strokeColor;
    textContext.strokeText(text, left, top);
  }
  textContext.restore();

  let img = null;
  if(canvas.transferToImageBitmap) {
    img = canvas.transferToImageBitmap();
    if(flipY) return createImageBitmap(img, {imageOrientation: 'flipY'});
    return createImageBitmap(img);
  }
  img = new Image();
  img.src = canvas.toDataURL('image/png');
  return img;
}