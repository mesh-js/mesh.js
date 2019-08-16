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

function packData(temp, ret, enableBlend) {
  if(temp.length) {
    const meshData = flattenMeshes(temp);
    meshData.positions = GlRenderer.FLOAT(meshData.positions);
    meshData.cells = GlRenderer.USHORT(meshData.cells);
    if(meshData.textureCoord) meshData.textureCoord = GlRenderer.FLOAT(meshData.textureCoord);
    meshData.enableBlend = enableBlend;
    if(temp[0].filterCanvas) {
      meshData.filterCanvas = true;
    }
    meshData.attributes.a_color = {data: GlRenderer.UBYTE(meshData.attributes.a_color)};
    meshData.packIndex = temp[0].packIndex;
    meshData.packLength = temp.length;
    ret.push(meshData);
    temp.length = 0;
  }
}

export default function compress(renderer, meshes, maxSize = 1500) {
  const ret = [];
  const temp = [];

  let size = 0;
  let enableBlend = false;

  for(let i = 0; i < meshes.length; i++) {
    const mesh = meshes[i].meshData;
    mesh.packIndex = i;
    const filterCanvas = meshes[i].filterCanvas;
    if(filterCanvas) {
      mesh.filterCanvas = true;
    }

    let len = 0;

    if(mesh) {
      len = mesh.positions.length;

      if(filterCanvas || size + len > maxSize) { // cannot merge
        packData(temp, ret, enableBlend);
        size = 0;
        enableBlend = false;
      } else if(size) {
        const lastMesh = meshes[i - 1].meshData;
        if(meshes[i - 1].filterCanvas || !compareUniform(lastMesh, mesh)) {
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