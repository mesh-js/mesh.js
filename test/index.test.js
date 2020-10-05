import fs from 'fs';
import path from 'path';

const jsCode = fs.readFileSync(
  path.resolve(__dirname, '../dist/mesh.js'),
  'utf-8',
);

describe('meshjs', () => {
  beforeAll(async () => {
    await page.setContent(`
      <canvas></canvas>
      <script>${jsCode}</script>
      <script>
        const {Renderer, Figure2D, Mesh2D} = meshjs
        const canvas = document.querySelector('canvas');
      </script>
    `);
  });

  it('render', async () => {
    const result = await page.evaluate(() => {
      const renderer = new Renderer(canvas);
      const figure = new Figure2D();
      figure.rect(50, 50, 100, 100);
      const mesh = new Mesh2D(figure, canvas);
      mesh.setFill({
        color: [1, 0, 0, 1],
      });
      renderer.drawMeshes([mesh]);
      return canvas.toDataURL();
    });
    expect(result).toMatchSnapshot();
  });
});
