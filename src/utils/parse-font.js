function sizeToPixel(value, defaultWidth) { // eslint-disable-line complexity
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

export default function parseFont(str, defaultHeight) {
  // Try for required properties first.
  const sizeFamily = sizeFamilyRe.exec(str);

  if(!sizeFamily) return; // invalid

  const lineHeight = parseFloat(sizeFamily[3]);

  // Default values and required properties
  const font = {
    weight: 'normal',
    style: 'normal',
    stretch: 'normal',
    variant: 'normal',
    size: parseFloat(sizeFamily[1]),
    unit: sizeFamily[2],
    lineHeight: Number.isFinite(lineHeight) ? lineHeight : undefined,
    lineHeightUnit: sizeFamily[4],
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
  font.pxLineHeight = sizeToPixel({size: font.lineHeight || font.size, unit: font.lineHeightUnit || font.unit}, defaultHeight);

  return font;
}
