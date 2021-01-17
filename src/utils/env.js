import GlRenderer from 'gl-renderer';
import parseFont from './parse-font';
import vectorToRGBA from './vector-to-rgba';

const cacheMap = {};

function fontEx(info, ratio) {
  const {style, variant, weight, stretch, size, pxLineHeight, family} = info;
  if(stretch === 'normal') {
    // fix iOS10 bug
    return `${style} ${variant} ${weight} ${size * ratio}px/${pxLineHeight * ratio}px ${family}`;
  }
  return `${style} ${variant} ${weight} ${stretch} ${size * ratio}px/${pxLineHeight * ratio}px ${family}`;
}

function createText(text, {font, fillColor, strokeColor, strokeWidth, ratio = 1, textCanvas, cachable = false}) {
  let key;
  if(cachable) {
    key = [text, font, String(fillColor), String(strokeColor), String(strokeWidth)].join('###');
    const cachedCanvas = cacheMap[key];
    if(cachedCanvas) return cachedCanvas;
  }

  if(!textCanvas) {
    textCanvas = createCanvas(1, 1);
  }

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

  canvas.width = Math.round(w * ratio);
  canvas.height = Math.round(h * ratio);

  textContext.save();
  textContext.font = fontEx(fontInfo, ratio);
  textContext.textAlign = 'center';
  textContext.textBaseline = 'middle';

  const top = canvas.height * 0.5 + fontInfo.pxHeight * 0.05 * ratio;
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
    textContext.lineWidth = strokeWidth * ratio;
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

  const ret = {image: textCanvas, rect: [0, 0, w, h]};

  if(cachable) {
    cacheMap[key] = ret;
  }
  return ret;
}

// Fixed: use offscreen canvas as texture will fail in early chrome.
let isEarlyChrome = false;
if(typeof navigator === 'object' && typeof navigator.userAgent === 'string') {
  const matched = navigator.userAgent.toLowerCase().match(/chrome\/(\d+)/);
  if(matched) {
    isEarlyChrome = Number(matched[1]) < 70;
  }
}

function createCanvas(width, height, options = {}) {
  const offscreen = options.offscreen || !isEarlyChrome && options.offscreen !== false;
  let canvas;
  if(typeof global.createCanvas === 'function') {
    canvas = global.createCanvas(width, height, options);
  } else if(offscreen && typeof OffscreenCanvas === 'function') {
    canvas = new OffscreenCanvas(width, height);
  } else {
    canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
  }
  return canvas;
}

const ENV = {
  createCanvas,
  createText,
  loadImage: GlRenderer.loadImage,
};

export default ENV;