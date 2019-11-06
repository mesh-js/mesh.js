import {vec2} from 'gl-matrix';
import vectorToRGBA from './vector-to-rgba';
import parseFont from './parse-font';
import {mix} from './math';

export function createCanvas(width, height, {offscreen = true} = {}) {
  let canvas;
  if(typeof global.createCanvas === 'function') {
    canvas = global.createCanvas(width, height, offscreen);
  } else if(offscreen && typeof OffscreenCanvas === 'function') {
    canvas = new OffscreenCanvas(width, height);
  } else {
    canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
  }
  return canvas;
}

export function applyFilter(context, filter) {
  const canvas = context.canvas;
  context.save();
  context.filter = filter;
  context.drawImage(canvas, 0, 0, canvas.width, canvas.height);
  context.restore();
}

function mixRGBA(a, b) {
  const pattern = /rgba\((\d+),(\d+),(\d+),(\d+)\)/;
  a = a.match(pattern).slice(1, 5).map(Number);
  b = b.match(pattern).slice(1, 5).map(Number);
  const c = [];
  const alpha = b[3];
  for(let i = 0; i < 4; i++) {
    c[i] = mix(a[i], b[i], alpha);
  }
  return `rgba(${c.join()})`;
}

export function drawMesh2D(mesh, context, enableFilter = true, cloudFill = null,
  cloudStroke = null, cloudFrame = null, cloudTransform = null) {
  context.save();
  let stroke = false;
  let fill = false;

  context.globalAlpha = mesh.uniforms.u_opacity;

  if(mesh.lineWidth) {
    let gradient = mesh.gradient && mesh.gradient.stroke;
    if(gradient) {
      let {vector, colors} = gradient;
      if(vector.length === 6) {
        vector = [...vector];
        gradient = context.createRadialGradient(...vector);
      } else {
        gradient = context.createLinearGradient(...vector);
      }
      colors.forEach(({offset, color}) => {
        let rgba = vectorToRGBA(color);
        if(cloudStroke) rgba = mixRGBA(rgba, cloudStroke);
        gradient.addColorStop(offset, rgba);
      });
      context.strokeStyle = gradient;
      stroke = true;
    } else if(mesh.strokeStyle) {
      if(cloudStroke) {
        context.strokeStyle = mixRGBA(mesh.strokeStyle, cloudStroke);
      } else {
        context.strokeStyle = mesh.strokeStyle;
      }
      stroke = true;
    }
  }
  if(stroke) {
    context.lineWidth = mesh.lineWidth;
    context.lineJoin = mesh.lineJoin;
    context.lineCap = mesh.lineCap;
    context.miterLimit = mesh.miterLimit;
    if(mesh.lineDash) {
      context.setLineDash(mesh.lineDash);
      if(mesh.lineDashOffset) {
        context.lineDashOffset = mesh.lineDashOffset;
      }
    }
  }

  let gradient = mesh.gradient && mesh.gradient.fill;
  if(gradient) {
    let {vector, colors} = gradient;
    if(vector.length === 6) {
      vector = [...vector];
      gradient = context.createRadialGradient(...vector);
    } else {
      gradient = context.createLinearGradient(...vector);
    }
    colors.forEach(({offset, color}) => {
      let rgba = vectorToRGBA(color);
      if(cloudStroke) rgba = mixRGBA(rgba, cloudStroke);
      gradient.addColorStop(offset, rgba);
    });
    context.fillStyle = gradient;
    fill = true;
  } else if(mesh.fillStyle) {
    if(cloudFill) {
      context.fillStyle = mixRGBA(mesh.fillStyle, cloudFill);
    } else {
      context.fillStyle = mesh.fillStyle;
    }
    fill = true;
  }
  // if(enableFilter) {
  //   const filter = mesh.filter;
  //   if(filter) {
  //     context.filter = filter;
  //   }
  // }
  if(cloudTransform) {
    context.transform(...cloudTransform);
  }
  context.transform(...mesh.transformMatrix);
  const count = mesh.contours.length;
  mesh.contours.forEach((points, i) => { // eslint-disable-line complexity
    const len = points.length;
    const closed = len > 1 && vec2.equals(points[0], points[len - 1]);
    const drawTexture = i === count - 1 && mesh.texture;
    if(points && len > 0) {
      if(fill || stroke || drawTexture) {
        context.beginPath();
        context.moveTo(...points[0]);
        for(let i = 1; i < len; i++) {
          if(i === len - 1 && closed) {
            context.closePath();
          } else {
            context.lineTo(...points[i]);
          }
        }
      }
      if(fill) {
        context.fill();
      }

      if(drawTexture) {
        context.clip();
        let {image, options} = mesh.texture;
        if(cloudFrame) image = cloudFrame;
        if(options.repeat) console.warn('Context 2D not supported image repeat yet.');
        if(image.font) {
          if(options.scale) console.warn('Context 2D not supported text scale yet.');
          if(options.srcRect) console.warn('Context 2D not supported text srcRect yet.');
          let {font, fillColor, strokeColor, text} = image;
          if(!fillColor && !strokeColor) fillColor = '#000';
          context.font = font;
          const {width} = context.measureText(text);
          const fontInfo = parseFont(font);
          const height = fontInfo.pxLineHeight;
          context.textAlign = 'center';
          context.textBaseline = 'middle';
          if(fillColor) context.fillStyle = fillColor;
          if(strokeColor) context.strokeStyle = strokeColor;
          const rect = options.rect;
          const top = rect[0] + height / 2;
          const left = rect[1] + width / 2;
          context.scale(rect[2] / width, rect[3] / height);
          context.fillText(text, left, top);
        } else {
          let rect = options.rect;
          const srcRect = options.srcRect;
          if(options.scale) {
            rect = [0, 0, context.canvas.width, context.canvas.height];
          }
          if(srcRect) {
            rect = rect || [0, 0, srcRect[2], srcRect[3]];
            context.drawImage(image, ...srcRect, ...rect);
          } else if(rect) {
            context.drawImage(image, ...rect);
          } else {
            context.drawImage(image, 0, 0);
          }
        }
      }

      if(stroke) {
        context.stroke();
      }
    }
  });
  context.restore();

  if(enableFilter) {
    const filter = mesh.filter;
    if(filter) {
      applyFilter(context, filter);
    }
  }
}