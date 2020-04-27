import flattenMeshes from './flatten-meshes';
import MeshCloud from '../mesh-cloud';

function compareUniform(a, b, temp) {
  const ua = a.uniforms || {};
  const ub = b.uniforms || {};

  if(ua.u_texSampler && ub.u_texSampler && ua.u_texSampler !== ub.u_texSampler) return false;

  const keysA = Object.keys(ua),
    keysB = Object.keys(ub);

  // console.log(keysA, keysB);
  const idx1 = keysA.indexOf('u_texSampler');
  const idx2 = keysB.indexOf('u_texSampler');
  if(idx1 >= 0) keysA.splice(idx1, 1);
  if(idx2 >= 0) keysB.splice(idx2, 1);

  if(keysA.length !== keysB.length) return false;

  const ret = keysA.every((key) => {
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

  if(ret) {
    if(ua.u_texSampler && !ub.u_texSampler) {
      b.setTexture(ua.u_texSampler, {hidden: true});
    } else if(!ua.u_texSampler && ub.u_texSampler) {
      // a.setTexture(ub.u_texSampler, {hidden: true});
      for(let i = 0; i < temp.length; i++) {
        temp[i].setTexture(ub.u_texSampler, {hidden: true});
      }
    }
  }

  return ret;
}

const bufferCache = {

};

function packData(temp, enableBlend) {
  if(temp.length) {
    const meshData = flattenMeshes(temp, bufferCache);

    meshData.enableBlend = enableBlend;
    if(temp[0].filterCanvas) {
      meshData.filterCanvas = true;
    }

    meshData.packIndex = temp[0].packIndex;
    meshData.packLength = temp.length;
    meshData.beforeRender = temp[0].beforeRender;
    meshData.pass = temp[0].pass;
    meshData.afterRender = temp[temp.length - 1].afterRender;
    temp.length = 0;
    return meshData;
  }
}

export default function* compress(renderer, meshes, ignoreTrasnparent = false) {
  const temp = [];
  const maxSize = renderer.options.bufferSize;
  let size = 0;
  let enableBlend = false;

  for(let i = 0; i < meshes.length; i++) {
    const mesh = meshes[i];

    if(mesh instanceof MeshCloud) {
      if(temp.length) yield packData(temp, enableBlend);
      size = 0;
      enableBlend = false;
      yield mesh;
    } else {
      const meshData = mesh.meshData;
      if(meshData.clipPath && !meshData.uniforms.u_clipSampler) {
        const texture = renderer.createTexture(meshData.clipPath);
        meshData.uniforms.u_clipSampler = texture;
      }
      let len = 0;

      if((!ignoreTrasnparent || !mesh.canIgnore()) && meshData && meshData.positions.length) {
        mesh.packIndex = i;
        const filterCanvas = mesh.filterCanvas;

        len = meshData.positions.length;

        if(filterCanvas || size + len > maxSize) { // cannot merge
          if(temp.length) yield packData(temp, enableBlend);
          size = 0;
          enableBlend = false;
        } else if(size) {
          const lastMesh = temp[temp.length - 1];
          if(lastMesh && (lastMesh.filterCanvas || lastMesh.afterRender || mesh.beforeRender
            || lastMesh.pass.length
            || mesh.pass.length
            || lastMesh.program !== mesh.program
            || !compareUniform(lastMesh, mesh, temp))) {
            yield packData(temp, enableBlend);
            size = 0;
            enableBlend = false;
          }
        }

        temp.push(mesh);
        enableBlend = enableBlend || mesh.enableBlend;
        size += len;
      }

      if(i === meshes.length - 1) {
        if(temp.length) {
          yield packData(temp, enableBlend);
        }
      }
    }
  }
}