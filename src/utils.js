import GlRenderer from 'gl-renderer';
// import { loadImage } from 'gl-renderer/src/helpers';

export function flattenMeshes(meshes) {
  const positions = [];
  const textureCoord = [];
  const cells = [];
  const a_color = [];
  let idx = 0;
  const uniforms = meshes[0] ? meshes[0].uniforms || {} : {};

  meshes.forEach((mesh) => {
    if(mesh) {
      positions.push(...mesh.positions);
      cells.push(...mesh.cells.map(cell => cell.map(c => c + idx)));
      a_color.push(...mesh.attributes.a_color);
      if(mesh.textureCoord) textureCoord.push(...mesh.textureCoord);
      idx += mesh.positions.length;
    }
  });

  const ret = {positions, cells, attributes: {a_color}, uniforms};

  if(textureCoord.length) {
    ret.textureCoord = textureCoord;
  }

  return ret;
}

function compareUniform(a, b) {
  const ua = a.uniforms || {};
  const ub = b.uniforms || {};

  const keysA = Object.keys(ua),
    keysB = Object.keys(ub);

  if(keysA.length !== keysB.length) return false;

  return keysA.every((key) => {
    const va = ua[key],
      vb = ub[key];

    if(va === vb) return true;
    if(va.length && vb.length && va.length === vb.length) {
      for(let i = 0; i < va.length; i++) {
        if(va[i] !== vb[i]) return false;
      }
      return true;
    }
    return false;
  });
}

function packData(temp, ret, enableBlend) {
  if(temp.length) {
    const meshData = flattenMeshes(temp);
    meshData.positions = GlRenderer.FLOAT(meshData.positions);
    meshData.cells = GlRenderer.USHORT(meshData.cells);
    if(meshData.textureCoord) meshData.textureCoord = GlRenderer.FLOAT(meshData.textureCoord);
    meshData.enableBlend = enableBlend;
    ret.push(meshData);
    temp.length = 0;
  }
}

export function compress(meshes, maxSize = 1500) {
  const ret = [];
  const temp = [];

  let size = 0;
  let enableBlend = false;

  for(let i = 0; i < meshes.length; i++) {
    const mesh = meshes[i].meshData;
    let len = 0;

    if(mesh) {
      len = mesh.positions.length;

      if(size + len > maxSize) { // cannot merge
        packData(temp, ret, enableBlend);
        size = 0;
        enableBlend = false;
      } else if(size) {
        const lastMesh = meshes[i - 1].meshData;
        if(!compareUniform(lastMesh, mesh)) {
          packData(temp, ret, enableBlend);
          size = 0;
          enableBlend = false;
        }
      }

      temp.push(mesh);
      enableBlend = enableBlend || meshes[i].enableBlend;
    }

    if(i === meshes.length - 1) {
      packData(temp, ret, enableBlend);
    } else {
      size += len;
    }
  }
  return ret;
}

export function sizeToPixel(value, defaultWidth) { // eslint-disable-line complexity
  if(typeof value === 'string') {
    const matched = value.trim().match(/^([\d.]+)(px|pt|pc|in|cm|mm|em|ex|rem|q|vw|vh|vmax|vmin|%)$/);
    if(matched) {
      value = {size: parseFloat(matched[1]), unit: matched[2]};
    } else {
      value = {size: parseInt(value, 10), unit: 'px'};
    }
  }

  let {size, unit} = value;
  if(unit === 'pt') {
    size /= 0.75;
  } else if(unit === 'pc') {
    size *= 16;
  } else if(unit === 'in') {
    size *= 96;
  } else if(unit === 'cm') {
    size *= 96.0 / 2.54;
  } else if(unit === 'mm') {
    size *= 96.0 / 25.4;
  } else if(unit === 'em' || unit === 'rem' || unit === 'ex') {
    if(!defaultWidth && typeof getComputedStyle === 'function' && typeof document !== 'undefined') {
      const root = getComputedStyle(document.documentElement).fontSize;
      defaultWidth = sizeToPixel(root, 16);
    }
    size *= defaultWidth;
    if(unit === 'ex') size /= 2;
  } else if(unit === 'q') {
    size *= 96.0 / 25.4 / 4;
  } else if(unit === 'vw' || unit === 'vh') {
    if(typeof document !== 'undefined') {
      const val = unit === 'vw' ? document.documentElement.clientWidth
        : document.documentElement.clientHeight;
      size *= val / 100;
    }
  } else if(unit === 'vmax' || unit === 'vmin') {
    if(typeof document !== 'undefined') {
      const width = document.documentElement.clientWidth;
      const height = document.documentElement.clientHeight;
      if(unit === 'vmax') {
        size *= Math.max(width, height) / 100;
      } else {
        size *= Math.min(width, height) / 100;
      }
    }
  }

  return size;
}


// borrow from node-canvas (https://github.com/Automattic/node-canvas)

/**
 * Font RegExp helpers.
 */

const weights = 'bold|bolder|lighter|[1-9]00',
  styles = 'italic|oblique',
  variants = 'small-caps',
  stretches = 'ultra-condensed|extra-condensed|condensed|semi-condensed|semi-expanded|expanded|extra-expanded|ultra-expanded',
  units = 'px|pt|pc|in|cm|mm|em|ex|rem|q|vw|vh|vmax|vmin|%',
  string = '\'([^\']+)\'|"([^"]+)"|([\\w-]|[\u4e00-\u9fa5])+';

// [ [ <‘font-style’> || <font-variant-css21> || <‘font-weight’> || <‘font-stretch’> ]?
//    <‘font-size’> [ / <‘line-height’> ]? <‘font-family’> ]
// https://drafts.csswg.org/css-fonts-3/#font-prop
const weightRe = new RegExp(`(${weights}) +`, 'i');
const styleRe = new RegExp(`(${styles}) +`, 'i');
const variantRe = new RegExp(`(${variants}) +`, 'i');
const stretchRe = new RegExp(`(${stretches}) +`, 'i');

/* eslint-disable prefer-template */
const sizeFamilyRe = new RegExp(
  '([\\d\\.]+)(' + units + ')(?:\\/([\\d\\.]+)(' + units + '))? *'
  + '((?:' + string + ')( *, *(?:' + string + '))*)'
);
/* eslint-enable prefer-template */

/**
 * Parse font `str`.
 *
 * @param {String} str
 * @return {Object} Parsed font. `size` is in device units. `unit` is the unit
 *   appearing in the input string.
 * @api private
 */

export function parseFont(str, defaultHeight) {
  // Try for required properties first.
  const sizeFamily = sizeFamilyRe.exec(str);

  if(!sizeFamily) return; // invalid

  // Default values and required properties
  const font = {
    weight: 'normal',
    style: 'normal',
    stretch: 'normal',
    variant: 'normal',
    size: parseFloat(sizeFamily[1]),
    unit: sizeFamily[2],
    lineHeight: parseFloat(sizeFamily[3]) || parseFloat(sizeFamily[1]) * 1.2,
    lineHeightUnit: sizeFamily[4] || sizeFamily[2],
    family: sizeFamily[5].replace(/ *, */g, ','),
  };

  // Stop search at `sizeFamily.index`
  const substr = str.substring(0, sizeFamily.index);

  // Optional, unordered properties.
  const weight = weightRe.exec(substr),
    style = styleRe.exec(substr),
    variant = variantRe.exec(substr),
    stretch = stretchRe.exec(substr);

  if(weight) font.weight = weight[1];
  if(style) font.style = style[1];
  if(variant) font.variant = variant[1];
  if(stretch) font.stretch = stretch[1];

  font.pxHeight = sizeToPixel({size: font.size, unit: font.unit}, defaultHeight);
  font.pxLineHeight = sizeToPixel({size: font.lineHeight, unit: font.lineHeightUnit}, defaultHeight);

  return font;
}

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
export function createText(text, {font, fillColor, strokeColor}, flipY = true) {
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

export function vectorToRGBA(vector) {
  return `rgba(${vector.map((c, i) => {
    if(i < 3) return Math.floor(c * 255);
    return c;
  }).join()})`;
}

const imageCache = {};
export function loadImage(src) {
  if(!imageCache[src]) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    imageCache[src] = new Promise((resolve) => {
      img.onload = function () {
        imageCache[src] = img;
        resolve(img);
      };
      img.src = src;
    });
  }
  return Promise.resolve(imageCache[src]);
}