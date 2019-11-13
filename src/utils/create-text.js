import parseFont from './parse-font';
import {createCanvas} from './canvas';
import vectorToRGBA from './vector-to-rgba';

const cacheMap = {};

export default function createText(text, {font, fillColor, strokeColor, strokeWidth}) {
  const key = [text, font, String(fillColor), String(strokeColor)].join('###');
  let textCanvas = cacheMap[key];
  if(textCanvas) return textCanvas;

  textCanvas = createCanvas(1, 1);

  const textContext = textCanvas.getContext('2d');
  textContext.save();
  textContext.font = font;
  let {width} = textContext.measureText(text);
  textContext.restore();

  const fontInfo = parseFont(font);
  const height = Math.max(fontInfo.pxLineHeight, fontInfo.pxHeight * 1.13);
  if(/italic|oblique/.test(font)) {
    width += height * Math.tan(15 * Math.PI / 180);
  }

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
    if(Array.isArray(fillColor)) fillColor = vectorToRGBA(fillColor);
    else if(fillColor.vector) {
      let gradient;
      const {vector, colors} = fillColor;
      if(vector.length === 6) {
        gradient = textContext.createRadialGradient(...vector);
      } else {
        gradient = textContext.createLinearGradient(...vector);
      }
      colors.forEach(({offset, color}) => {
        gradient.addColorStop(offset, color);
      });
      fillColor = gradient;
    }
    textContext.fillStyle = fillColor;
    textContext.fillText(text, left, top);
  }
  if(strokeColor) {
    textContext.lineWidth = strokeWidth;
    if(Array.isArray(strokeColor)) strokeColor = vectorToRGBA(strokeColor);
    else if(strokeColor.vector) {
      let gradient;
      const {vector, colors} = strokeColor;
      if(vector.length === 6) {
        gradient = textContext.createRadialGradient(...vector);
      } else {
        gradient = textContext.createLinearGradient(...vector);
      }
      colors.forEach(({offset, color}) => {
        gradient.addColorStop(offset, color);
      });
      strokeColor = gradient;
    }
    textContext.strokeStyle = strokeColor;
    textContext.strokeText(text, left, top);
  }
  textContext.restore();

  cacheMap[key] = textCanvas;
  return textCanvas;
}