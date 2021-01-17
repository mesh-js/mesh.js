import fs from 'fs';
import path from 'path';

const jsCode = fs.readFileSync(
  path.resolve(__dirname, '../dist/mesh.js'),
  'utf-8',
);

export const initHtml = `
<canvas></canvas>
<script>${jsCode}</script>
<script>
  const {Renderer, Figure2D, Mesh2D} = meshjs
  const canvas = document.querySelector('canvas');
</script>
`;
