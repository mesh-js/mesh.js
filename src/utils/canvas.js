import {vec2} from 'gl-matrix';
import vectorToRGBA from './vector-to-rgba';
import parseFont from './parse-font';
import {mix} from './math';

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

  context.globalAlpha = mesh.getOpacity();
  if(mesh._updateMatrix) {
    const acc = mesh.transformScale / mesh.contours.scale;
    if(acc > 1.5) {
      mesh.accurate(mesh.transformScale);
    }
  }
  if(mesh.lineWidth) {
    let gradient = mesh.gradient && mesh.gradient.stroke;
    if(gradient) {
      const {vector, colors} = gradient;
      if(vector.length === 6) {
        gradient = context.createRadialGradient(...vector);
      } else if(vector.length === 4) {
        gradient = context.createLinearGradient(...vector);
      } else if(vector.length === 3) {
        gradient = context.createCircularGradient(...vector);
      } else {
        throw new TypeError('Invalid vector dimension.');
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
    const {vector, colors} = gradient;
    if(vector.length === 6) {
      gradient = context.createRadialGradient(...vector);
    } else if(vector.length === 4) {
      gradient = context.createLinearGradient(...vector);
    } else if(vector.length === 3) {
      gradient = context.createCircularGradient(...vector);
    } else {
      throw new TypeError('Invalid vector dimension.');
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
  if(mesh.clipPath) {
    const clipPath = mesh.clipPath;
    const path = new Path2D(clipPath);
    context.clip(path);
  }
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
        context.fill(mesh.fillRule);
      }

      if(drawTexture) {
        context.save();
        context.clip();
        let {image, options} = mesh.texture;
        if(cloudFrame) image = cloudFrame;
        if(options.repeat) console.warn('Context 2D not supported image repeat yet.');
        if(image.font) {
          if(options.scale) console.warn('Context 2D not supported text scale yet.');
          if(options.srcRect) console.warn('Context 2D not supported text srcRect yet.');
          let {font, fillColor, strokeColor, strokeWidth, text} = image;
          if(!fillColor && !strokeColor) fillColor = '#000';
          if(Array.isArray(fillColor)) fillColor = vectorToRGBA(fillColor);
          if(Array.isArray(strokeColor)) strokeColor = vectorToRGBA(strokeColor);
          context.font = font;
          const {width} = context.measureText(text);
          const fontInfo = parseFont(font);
          const height = Math.max(fontInfo.pxLineHeight, fontInfo.pxHeight * 1.13);
          context.textAlign = 'center';
          context.textBaseline = 'middle';
          // text ignore rect scale
          const rect = options.rect;
          const top = rect[0] + height * 0.5 + fontInfo.pxHeight * 0.06;
          const left = rect[1] + width * 0.5;
          if(rect[2] != null) {
            context.scale(rect[2] / width, rect[3] / height);
          }
          if(fillColor) {
            context.fillStyle = fillColor;
            context.fillText(text, left, top);
          }
          if(strokeColor) {
            context.lineWidth = strokeWidth;
            context.strokeStyle = strokeColor;
            context.strokeText(text, left, top);
          }
        } else {
          let rect = options.rect;
          const srcRect = options.srcRect;
          if(options.scale) {
            rect = [0, 0, context.canvas.width, context.canvas.height];
          }
          if(options.rotated && rect) {
            rect = [-rect[1], rect[0], rect[3], rect[2]];
          }
          if(srcRect) {
            rect = rect || [0, 0, srcRect[2], srcRect[3]];
          }
          if(options.rotated) {
            context.translate(0, rect ? rect[2] : image.width);
            context.rotate(-0.5 * Math.PI);
          }
          if(srcRect) {
            context.drawImage(image, ...srcRect, ...rect);
          } else if(rect) {
            context.drawImage(image, ...rect);
          } else {
            context.drawImage(image, 0, 0);
          }
        }
        context.restore();
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