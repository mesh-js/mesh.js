import parseFont from './parse-font';
import {createCanvas} from './canvas';

let textContext = null;

export default async function createText(text, {font, fillColor, strokeColor}) {
  if(!textContext) {
    // textContext = document.createElement('canvas').getContext('2d');
    textContext = createCanvas(1, 1).getContext('2d');
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

  const img = new Image();
  let src = null;
  // if(canvas.transferToImageBitmap) {
  //   img = canvas.transferToImageBitmap();
  //   if(flipY) return createImageBitmap(img, {imageOrientation: 'flipY'});
  //   return createImageBitmap(img);
  // }

  if(canvas.convertToBlob) {
    const blob = await canvas.convertToBlob();
    src = URL.createObjectURL(blob);
  } else {
    src = canvas.toDataURL('image/png');
  }

  return new Promise((resolve) => {
    img.onload = () => {
      resolve(img);
    };
    img.src = src;
  });
}