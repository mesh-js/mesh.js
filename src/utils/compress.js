import GlRenderer from 'gl-renderer';
import flattenMeshes from './flatten-meshes';

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

const bufferCache = {

};

function packData(temp, enableBlend) {
  if(temp.length) {
    const meshData = flattenMeshes(temp);

    const positionsCount = meshData.positions.length * meshData.positions[0].length;
    if(!bufferCache.positions || bufferCache.positions.length < positionsCount) {
      bufferCache.positions = GlRenderer.FLOAT(meshData.positions);
      meshData.positions = bufferCache.positions;
    } else {
      meshData.positions = GlRenderer.FLOAT(meshData.positions, bufferCache.positions);
    }

    const cellsCount = meshData.cells.length * meshData.cells[0].length;
    if(!bufferCache.cells || bufferCache.cells.length < cellsCount) {
      bufferCache.cells = GlRenderer.USHORT(meshData.cells);
      meshData.cells = bufferCache.cells;
    } else {
      meshData.cellsCount = cellsCount;
      meshData.cells = GlRenderer.USHORT(meshData.cells, bufferCache.cells);
    }

    const textureCoordCount = meshData.textureCoord.length * meshData.textureCoord[0].length;
    if(meshData.textureCoord) {
      if(!bufferCache.textureCoord || bufferCache.textureCoord.length < textureCoordCount) {
        bufferCache.textureCoord = GlRenderer.FLOAT(meshData.textureCoord);
        meshData.textureCoord = bufferCache.textureCoord;
      } else {
        meshData.textureCoord = GlRenderer.FLOAT(meshData.textureCoord, bufferCache.textureCoord);
      }
    }

    meshData.enableBlend = enableBlend;
    if(temp[0].filterCanvas) {
      meshData.filterCanvas = true;
    }

    const colorCount = meshData.attributes.a_color.length * meshData.attributes.a_color[0].length;
    if(!bufferCache.a_color || bufferCache.a_color.length < colorCount) {
      bufferCache.a_color = GlRenderer.UBYTE(meshData.attributes.a_color);
      meshData.attributes.a_color = {data: bufferCache.a_color};
    } else {
      meshData.attributes.a_color = {data: GlRenderer.UBYTE(meshData.attributes.a_color, bufferCache.a_color)};
    }

    meshData.packIndex = temp[0].packIndex;
    meshData.packLength = temp.length;
    meshData.beforeRender = temp[0].beforeRender;
    meshData.afterRender = temp[temp.length - 1].afterRender;
    temp.length = 0;
    return meshData;
  }
}

export default function* compress(renderer, meshes, maxSize = renderer.options.bufferSize) {
  const temp = [];

  let size = 0;
  let enableBlend = false;

  for(let i = 0; i < meshes.length; i++) {
    const mesh = meshes[i];
    const meshData = mesh.meshData;
    let len = 0;

    if(meshData && meshData.positions.length) {
      mesh.packIndex = i;
      const filterCanvas = mesh.filterCanvas;

      len = meshData.positions.length;

      if(filterCanvas || size + len > maxSize) { // cannot merge
        if(temp.length) yield packData(temp, enableBlend);
        size = 0;
        enableBlend = false;
      } else if(size) {
        const lastMesh = meshes[i - 1];
        if(lastMesh.filterCanvas || !compareUniform(lastMesh, mesh)
          || lastMesh.afterRender || mesh.beforeRender) {
          if(temp.length) yield packData(temp, enableBlend);
          size = 0;
          enableBlend = false;
        }
      }

      temp.push(mesh);
      enableBlend = enableBlend || mesh.enableBlend;
    }

    if(i === meshes.length - 1) {
      if(temp.length) yield packData(temp, enableBlend);
    } else {
      size += len;
    }
  }
}