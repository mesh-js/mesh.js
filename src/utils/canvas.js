import vectorToRGBA from './vector-to-rgba';
import parseFont from './parse-font';

export function createCanvas(width, height) {
  let canvas;
  if(typeof OffscreenCanvas === 'function') {
    canvas = new OffscreenCanvas(width, height);
  } if(typeof global.createCanvas === 'function') {
    canvas = createCanvas(width, height);
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

export function drawMesh2D(mesh, context, enableFilter = true) {
  context.save();
  let stroke = false;
  let fill = false;
  if(mesh.strokeStyle) {
    context.strokeStyle = mesh.strokeStyle;
    stroke = true;
  }
  if(mesh.gradient && mesh.gradient.stroke) {
    const {vector, colors} = mesh.gradient.stroke;
    const gradient = context.createLinearGradient(...vector);
    colors.forEach(({offset, color}) => {
      const rgba = vectorToRGBA(color);
      gradient.addColorStop(offset, rgba);
    });
    context.strokeStyle = gradient;
    stroke = true;
  }
  if(stroke) {
    context.lineWidth = mesh.lineWidth;
    context.lineJoin = mesh.lineJoin;
    context.lineCap = mesh.lineCap;
    context.miterLimit = mesh.miterLimit;
  }

  if(mesh.fillStyle) {
    context.fillStyle = mesh.fillStyle;
    fill = true;
  }
  if(mesh.gradient && mesh.gradient.fill) {
    let {vector, colors} = mesh.gradient.fill;
    let gradient = null;
    if(vector.length === 6) {
      const h = context.canvas.height;
      vector = [...vector];
      vector[1] = h - vector[1];
      vector[4] = h - vector[4];
      gradient = context.createRadialGradient(...vector);
    } else {
      gradient = context.createLinearGradient(...vector);
    }
    colors.forEach(({offset, color}) => {
      const rgba = vectorToRGBA(color);
      gradient.addColorStop(offset, rgba);
    });
    context.fillStyle = gradient;
    fill = true;
  }
  // if(enableFilter) {
  //   const filter = mesh.filter;
  //   if(filter) {
  //     context.filter = filter;
  //   }
  // }
  context.setTransform(...mesh.transformMatrix);
  const count = mesh.contours.length;
  mesh.contours.forEach((points, i) => {
    const closed = points.closed;
    const len = points.length;
    if(points && len > 0) {
      if(fill || stroke) {
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
      context.clip();

      if(i === count - 1 && mesh.texture) {
        const {image, options} = mesh.texture;
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
            context.drawImage(image, ...srcRect, ...rect);
          } else {
            context.drawImage(image, ...rect);
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