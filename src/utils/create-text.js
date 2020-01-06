import parseFont from './parse-font';
import ENV from './env';
import vectorToRGBA from './vector-to-rgba';

const cacheMap = {};

function fontEx(info, ratio) {
  const {style, variant, weight, stretch, size, pxLineHeight, family} = info;
  return `${style} ${variant} ${weight} ${stretch} ${size * ratio}px/${pxLineHeight * ratio}px ${family}`;
}

export default function createText(text, {font, fillColor, strokeColor, strokeWidth}) {
  const key = [text, font, String(fillColor), String(strokeColor), String(strokeWidth)].join('###');
  let textCanvas = cacheMap[key];
  if(textCanvas) return textCanvas;

  // cannot use offscreen canvas because use offscreen canvas as texture will fail in early versions of Chrome.
  textCanvas = ENV.createCanvas(1, 1, {offscreen: false});

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
  const w = Math.ceil(width);
  const h = Math.ceil(height);

  const ratio = 2;
  canvas.width = w * ratio;
  canvas.height = h * ratio;

  textContext.save();
  textContext.font = fontEx(fontInfo, ratio);
  textContext.textAlign = 'center';
  textContext.textBaseline = 'middle';

  const top = canvas.height * 0.5 + fontInfo.pxHeight * 0.13;
  const left = canvas.width * 0.5;

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

  cacheMap[key] = {image: textCanvas, rect: [0, 0, w, h]};
  return cacheMap[key];
}