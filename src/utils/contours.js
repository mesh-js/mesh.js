import {distance} from './positions';

export function getTotalLength(contours) {
  if(contours.totalLength != null) return contours.totalLength;
  let length = 0;
  contours.forEach((points) => {
    let s = points[0];
    for(let i = 1; i < points.length; i++) {
      const p = points[i];
      length += distance(s, p);
      s = p;
    }
  });
  contours.totalLength = length;
  return length;
}

function splitContours(contours, length, rest = true) {
  length = Number(length);
  if(!Number.isFinite(length)) {
    throw new TypeError('Failed to execute \'getPointAtLength\' on figure: The provided float value is non-finite.');
  }

  if(length <= 0) {
    throw new TypeError('Length must > 0');
  }

  const contoursLength = getTotalLength(contours);
  if(length >= contoursLength) {
    const points = contours[contours.length - 1];
    const p0 = points[points.length - 2];
    const p1 = points[points.length - 1];
    const angle = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
    return {
      current: contours.map(c => [...c]),
      point: {
        x: p1[0],
        y: p1[1],
        angle,
      },
    };
  }

  const current = [];
  for(let i = 0; i < contours.length; i++) {
    current[i] = [];
    const points = contours[i];
    let p0 = points[0];
    for(let j = 1; j < points.length; j++) {
      const p1 = points[j];
      const d = distance(p0, p1);
      if(length < d) {
        const p = length / d;
        const angle = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
        const point = {
          x: p0[0] * (1 - p) + p1[0] * p,
          y: p0[1] * (1 - p) + p1[1] * p,
          angle,
        };
        current[i].push(p0);
        if(length > 0) current[i].push([point.x, point.y]);
        if(!rest) {
          return {
            current,
            point,
          };
        }
        const restContours = [];
        const o = i;
        for(; i < contours.length; i++) {
          restContours[i - o] = [];
          if(i === o) restContours[0].push([point.x, point.y]);
          for(; j < points.length; j++) {
            restContours[i - o].push(points[j]);
          }
          j = 0;
        }
        return {
          current,
          point,
          rest: restContours,
        };
      }
      length -= d;
      current[i].push(p0);
      p0 = p1;
    }
  }
}

export function getPointAtLength(contours, length) {
  length = Number(length);
  if(!Number.isFinite(length)) {
    throw new TypeError('Failed to execute \'getPointAtLength\' on figure: The provided float value is non-finite.');
  }
  if(contours.length <= 0) return {x: 0, y: 0, angle: 0};
  if(length <= 0) {
    const p0 = contours[0][0];
    const p1 = contours[0][1];
    const angle = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
    return {
      x: p0[0],
      y: p0[1],
      angle,
    };
  }

  return splitContours(contours, length, false).point;
}

export function getDashContours(contours, lineDash, lineDashOffset) {
  let idx = 0;
  let dash = lineDash[0];
  let rest = contours;
  const splitedContours = [];
  const lineDashLen = lineDash.length;

  if(lineDashOffset > 0) {
    do {
      lineDashOffset -= lineDash[idx % lineDashLen];
      idx++;
    } while(lineDashOffset > 0);
    if(lineDashOffset < 0) {
      dash = -lineDashOffset;
      idx--;
    }
  } else if(lineDashOffset < 0) {
    idx = -1;
    do {
      lineDashOffset += lineDash[idx % lineDashLen + lineDashLen];
      idx--;
    } while(lineDashOffset < 0);
    if(lineDashOffset > 0) {
      idx++;
      dash = lineDash[idx % lineDashLen + lineDashLen] - lineDashOffset;
    }
  }

  do {
    const splited = splitContours(rest, dash);
    rest = splited.rest;
    if(++idx % 2) splitedContours.push(...splited.current);
    let dashIndex = idx % lineDashLen;
    if(dashIndex < 0) dashIndex += lineDashLen;
    dash = lineDash[dashIndex];
  } while(rest);

  return splitedContours;
}