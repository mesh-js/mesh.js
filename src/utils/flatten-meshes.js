export default function flattenMeshes(meshes) {
  const positions = [];
  const textureCoord = [];
  const cells = [];
  const a_color = [];
  let idx = 0;
  const uniforms = meshes[0] ? meshes[0].uniforms || {} : {};

  meshes.forEach((mesh) => {
    if(mesh) {
      if(mesh.meshData) mesh = mesh.meshData;
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
