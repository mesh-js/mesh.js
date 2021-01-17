import {initHtml} from './utils';

describe('mesh2d', () => {
  beforeAll(async () => {
    await page.setContent(initHtml);
    await page.evaluate(() => {
      window.drawMesh = cb => {
        const renderer = new Renderer(canvas);
        const figure = new Figure2D();
        figure.rect(50, 50, 100, 100);
        const mesh = new Mesh2D(figure, canvas);
        cb(mesh);
        renderer.drawMeshes([mesh]);
        return canvas.toDataURL();
      };
    });
  });

  it('setFill', async () => {
    const result = await page.evaluate(() => {
      return drawMesh(mesh => {
        mesh.setFill({color: [1, 0, 0, 1]});
      });
    });
    expect(result).toMatchSnapshot();
  });

  it('setRadialGradient', async () => {
    const result = await page.evaluate(() => {
      return drawMesh(mesh => {
        mesh.setRadialGradient({
          vector: [0, 0, 0, 0, 0, 50],
          colors: [
            {offset: 0, color: [1, 0, 1, 1]},
            {offset: 0.5, color: [0, 1, 1, 1]},
            {offset: 1, color: [1, 0, 1, 1]},
          ],
        });
      });
    });
    expect(result).toMatchSnapshot();
  });

  it('setLinearGradient', async () => {
    const result = await page.evaluate(() => {
      return drawMesh(mesh => {
        mesh.setLinearGradient({
          vector: [0, 0, 200, 200],
          colors: [
            {offset: 0, color: [1, 0, 0, 1]},
            {offset: 0.5, color: [0, 1, 0, 1]},
            {offset: 1, color: [0, 0, 1, 1]},
          ],
        });
      });
    });
    expect(result).toMatchSnapshot();
  });
});
