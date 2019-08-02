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
    ret.push(meshData);
    temp.length = 0;
  }
}

export default function compress(meshes, maxSize = 1500) {
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