import {vectorToRGBA, loadImage} from './utils';

export default class CanvasRenderer {
  constructor(canvas, options) {
    this.context = canvas.getContext('2d');
    this.options = options;
  }

  createTexture(img) {
    const texture = {_img: img};
    return texture;
  }

  async loadTexture(textureURL) {
    const image = await loadImage(textureURL);
    return this.createTexture(image);
  }

  deleteTexture(texture) {
    return texture;
  }

  drawMeshes(meshes, clearBuffer = true) {
    const context = this.context;
    if(clearBuffer) {
      context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    }
    meshes.forEach((mesh) => {
      context.save();
      if(mesh.strokeStyle) {
        context.strokeStyle = mesh.strokeStyle;
        context.lineWidth = mesh.lineWidth;
        context.lineJoin = mesh.lineJoin;
        context.lineCap = mesh.lineCap;
        context.miterLimit = mesh.miterLimit;
        if(mesh.gradient && mesh.gradient.stroke) {
          const {vector, colors} = mesh.gradient.stroke;
          const gradient = context.createLinearGradient(...vector);
          colors.forEach(({offset, color}) => {
            const rgba = vectorToRGBA(color);
            gradient.addColorStop(offset, rgba);
          });
          context.strokeStyle = gradient;
        }
      }
      if(mesh.fillStyle) {
        context.fillStyle = mesh.fillStyle;
        if(mesh.gradient && mesh.gradient.fill) {
          const {vector, colors} = mesh.gradient.fill;
          const gradient = context.createLinearGradient(...vector);
          colors.forEach(({offset, color}) => {
            const rgba = vectorToRGBA(color);
            gradient.addColorStop(offset, rgba);
          });
          context.fillStyle = gradient;
        }
      }
      context.setTransform(...mesh.transformMatrix);
      mesh.contours.forEach((points) => {
        const closed = points.closed;
        const len = points.length;
        if(points && len > 0) {
          context.beginPath();
          context.moveTo(...points[0]);
          for(let i = 1; i < len; i++) {
            if(i === len - 1 && closed) {
              context.closePath();
            } else {
              context.lineTo(...points[i]);
            }
          }
          if(mesh.fillStyle) {
            context.fill();
          }
          if(mesh.texture) {
            const {image, options} = mesh.texture;
            if(options.repeat) console.warn('Context 2D not supported image repeat yet.');
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
          if(mesh.strokeStyle) {
            context.stroke();
          }
        }
      });
      context.restore();
    });
  }
}