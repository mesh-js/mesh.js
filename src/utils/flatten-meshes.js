export default function flattenMeshes(meshes) {
  const positions = [];
  const textureCoord = [];
  const cells = [];
  const a_color = [];
  const a_sourceRect = [];
  let idx = 0;
  const uniforms = meshes[0] ? meshes[0].uniforms || {} : {};

  for(let i = 0; i < meshes.length; i++) {
    let mesh = meshes[i];
    if(mesh) {
      if(mesh.meshData) mesh = mesh.meshData;
      positions.push(...mesh.positions);
      const _cells = mesh.cells;
      for(let j = 0; j < _cells.length; j++) {
        const cell = _cells[j];
        cells.push([cell[0] + idx, cell[1] + idx, cell[2] + idx]);
      }
      // cells.push(...mesh.cells.map(cell => cell.map(c => c + idx)));
      a_color.push(...mesh.attributes.a_color);
      if(mesh.attributes.a_sourceRect) {
        a_sourceRect.push(...mesh.attributes.a_sourceRect);
      }
      if(mesh.textureCoord) textureCoord.push(...mesh.textureCoord);
      idx += mesh.positions.length;
    }
  }

  const attributes = {a_color};
  if(a_sourceRect.length > 0) attributes.a_sourceRect = a_sourceRect;

  const ret = {positions, cells, attributes, uniforms};

  if(textureCoord.length) {
    ret.textureCoord = textureCoord;
  }

  return ret;
}
