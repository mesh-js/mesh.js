const typeMap = {
  UNSIGNED_BYTE: Uint8Array,
  UNSIGNED_SHORT: Uint16Array,
  BYTE: Int8Array,
  SHORT: Int16Array,
  FLOAT: Float32Array,
};

function allocateBuffer(meshes, bufferCache) { // eslint-disable-line complexity
  let positionsCount = 0;
  let cellsCount = 0;
  let textureCoordCount = 0;
  let sourceRectCount = 0;
  let clipUVCount = 0;
  let colorCount = 0;
  let count = 0;
  const program = meshes[0].program;
  for(let i = 0; i < meshes.length; i++) {
    const mesh = meshes[i].meshData;
    if(mesh) {
      count += mesh.positions.length;
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
      const _clipUV = mesh.attributes.a_clipUV;
      if(_clipUV) {
        clipUVCount += _clipUV.length * 2;
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
  if(clipUVCount) {
    if(!bufferCache.a_clipUV || bufferCache.a_clipUV.length < clipUVCount) {
      bufferCache.a_clipUV = new Float32Array(clipUVCount);
    }
  }
  if(program) {
    const attribs = Object.entries(program._attribute);
    const meta = program._attribOpts || {};
    for(let i = 0; i < attribs.length; i++) {
      const [key, opts] = attribs[i];
      if(key !== 'a_color' && key !== 'a_sourceRect' && opts !== 'ignored') {
        const type = meta[key] ? meta[key].type : 'FLOAT';
        const TypeArray = typeMap[type];
        const attribCount = opts.size * count;
        if(!bufferCache[key] || bufferCache[key].length < attribCount) {
          bufferCache[key] = new TypeArray(attribCount);
        }
      }
    }
  }
  return bufferCache;
}

export default function flattenMeshes(meshes, bufferCache) { // eslint-disable-line complexity
  let positions = [];
  let cells = [];
  let textureCoord = [];
  let a_color = [];
  let a_sourceRect = []; // sourceRect no buffer;
  let a_clipUV = []; // uv no buffer

  let idx = 0;
  let cidx = 0;

  const uniforms = meshes[0] ? meshes[0].uniforms || {} : {};
  const program = meshes[0] ? meshes[0].program : null;

  if(bufferCache) {
    allocateBuffer(meshes, bufferCache);
    cells = bufferCache.cells;
    positions = bufferCache.positions;
    textureCoord = bufferCache.textureCoord;
    a_color = bufferCache.a_color;
    a_sourceRect = bufferCache.a_sourceRect;
    a_clipUV = bufferCache.a_clipUV;
  }

  let hasSourceRect = false;
  let hasClipPath = false;

  const attributes = {};
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
        hasSourceRect = true;
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
      if(mesh.attributes.a_clipUV) {
        hasClipPath = true;
        if(bufferCache) {
          const _clipUV = mesh.attributes.a_clipUV;
          for(let j = 0; j < _clipUV.length; j++) {
            const s = _clipUV[j];
            const o = 2 * (idx + j);
            a_clipUV[o] = s[0];
            a_clipUV[o + 1] = s[1];
          }
        } else {
          a_clipUV.push(...mesh.attributes.a_clipUV);
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

      if(program) {
        const attribs = Object.entries(program._attribute);
        for(let j = 0; j < attribs.length; j++) {
          const [name, opts] = attribs[j];
          if(name !== 'a_color' && name !== 'a_sourceRect' && opts !== 'ignored') {
            attributes[name] = [];
            if(bufferCache) {
              attributes[name] = bufferCache[name];
              const _attr = mesh.attributes[name];
              const size = _attr[0].length;
              for(let k = 0; k < _attr.length; k++) {
                const t = _attr[k];
                const o = size * (idx + k);
                for(let w = 0; w < t.length; w++) {
                  attributes[name][o + w] = t[w];
                }
              }
            } else {
              attributes[name].push(...mesh.attributes[name]);
            }
          }
        }
      }

      idx += mesh.positions.length;
      cidx += mesh.cells.length;
    }
  }

  attributes.a_color = a_color;
  if(hasSourceRect && a_sourceRect && a_sourceRect.length > 0) attributes.a_sourceRect = a_sourceRect;
  const ret = {positions, cells, attributes, uniforms, cellsCount: cidx * 3, program};

  if(textureCoord && textureCoord.length) {
    ret.textureCoord = textureCoord;
  }

  if(hasClipPath && a_clipUV.length > 0) attributes.a_clipUV = a_clipUV;

  return ret;
}
