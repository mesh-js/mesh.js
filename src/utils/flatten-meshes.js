function allocateBuffer(meshes, bufferCache) {
  let positionsCount = 0;
  let cellsCount = 0;
  let textureCoordCount = 0;
  let sourceRectCount = 0;
  let colorCount = 0;
  for(let i = 0; i < meshes.length; i++) {
    const mesh = meshes[i].meshData;
    if(mesh) {
      const dimension = mesh.positions[0].length;
      positionsCount += mesh.positions.length * dimension;
      cellsCount += mesh.cells.length * 3;
      colorCount += mesh.attributes.a_color.length * 4;
      const _textureCoord = mesh.textureCoord;
      if(_textureCoord) {
        textureCoordCount += _textureCoord.length * _textureCoord[0].length;
      }
      const _sourceRect = mesh.attributes.a_sourceRect;
      if(_sourceRect) {
        sourceRectCount += _sourceRect.length * 4;
      }
    }
  }
  if(!bufferCache.positions || bufferCache.positions.length < positionsCount) {
    bufferCache.positions = new Float32Array(positionsCount);
  }
  if(!bufferCache.cells || bufferCache.cells.length < cellsCount) {
    bufferCache.cells = new Uint16Array(cellsCount);
  }
  if(textureCoordCount) {
    if(!bufferCache.textureCoord || bufferCache.textureCoord.length < textureCoordCount) {
      bufferCache.textureCoord = new Float32Array(textureCoordCount);
    }
  }
  if(!bufferCache.a_color || bufferCache.a_color.length < colorCount) {
    bufferCache.a_color = new Uint8Array(colorCount);
  }
  if(sourceRectCount) {
    if(!bufferCache.a_sourceRect || bufferCache.a_sourceRect.length < sourceRectCount) {
      bufferCache.a_sourceRect = new Float32Array(sourceRectCount);
    }
  }
  return bufferCache;
}

export default function flattenMeshes(meshes, bufferCache) {
  let positions = [];
  let cells = [];
  let textureCoord = [];
  let a_color = [];
  let a_sourceRect = [];

  let idx = 0;
  let cidx = 0;

  const uniforms = meshes[0] ? meshes[0].uniforms || {} : {};

  if(bufferCache) {
    allocateBuffer(meshes, bufferCache);
    cells = bufferCache.cells;
    positions = bufferCache.positions;
    textureCoord = bufferCache.textureCoord;
    a_color = bufferCache.a_color;
    a_sourceRect = bufferCache.a_sourceRect;
  }

  for(let i = 0; i < meshes.length; i++) {
    let mesh = meshes[i];
    if(mesh) {
      if(mesh.meshData) mesh = mesh.meshData;
      if(bufferCache) {
        const _positions = mesh.positions;
        for(let j = 0; j < _positions.length; j++) {
          const p = _positions[j];
          const o = 3 * (idx + j);
          for(let k = 0; k < p.length; k++) {
            positions[o + k] = p[k];
          }
        }
      } else {
        positions.push(...mesh.positions);
      }
      const _cells = mesh.cells;
      for(let j = 0; j < _cells.length; j++) {
        const cell = _cells[j];
        if(bufferCache) {
          const o = 3 * (cidx + j);
          cells[o] = cell[0] + idx;
          cells[o + 1] = cell[1] + idx;
          cells[o + 2] = cell[2] + idx;
        } else {
          cells.push([cell[0] + idx, cell[1] + idx, cell[2] + idx]);
        }
      }
      // cells.push(...mesh.cells.map(cell => cell.map(c => c + idx)));
      if(bufferCache) {
        const _colors = mesh.attributes.a_color;
        for(let j = 0; j < _colors.length; j++) {
          const c = _colors[j];
          const o = 4 * (idx + j);
          a_color[o] = c[0];
          a_color[o + 1] = c[1];
          a_color[o + 2] = c[2];
          a_color[o + 3] = c[3];
        }
      } else {
        a_color.push(...mesh.attributes.a_color);
      }
      if(mesh.attributes.a_sourceRect) {
        if(bufferCache) {
          const _sourceRect = mesh.attributes.a_sourceRect;
          for(let j = 0; j < _sourceRect.length; j++) {
            const s = _sourceRect[j];
            const o = 4 * (idx + j);
            a_sourceRect[o] = s[0];
            a_sourceRect[o + 1] = s[1];
            a_sourceRect[o + 2] = s[2];
            a_sourceRect[o + 3] = s[3];
          }
        } else {
          a_sourceRect.push(...mesh.attributes.a_sourceRect);
        }
      }
      if(mesh.textureCoord) {
        if(bufferCache) {
          const _textureCoord = mesh.textureCoord;
          for(let j = 0; j < _textureCoord.length; j++) {
            const t = _textureCoord[j];
            const o = 3 * (idx + j);
            for(let k = 0; k < t.length; k++) {
              textureCoord[o + k] = t[k];
            }
          }
        } else {
          textureCoord.push(...mesh.textureCoord);
        }
      }
      idx += mesh.positions.length;
      cidx += mesh.cells.length;
    }
  }

  const attributes = {a_color};
  if(a_sourceRect && a_sourceRect.length > 0) attributes.a_sourceRect = a_sourceRect;
  const ret = {positions, cells, attributes, uniforms, cellsCount: cidx * 3};

  if(textureCoord && textureCoord.length) {
    ret.textureCoord = textureCoord;
  }

  return ret;
}
