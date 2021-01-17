import {initHtml} from './utils';

describe('figure2d', () => {
  beforeAll(async () => {
    await page.setContent(initHtml);
    await page.evaluate(() => {
      window.drawFigure = cb => {
        const renderer = new Renderer(canvas);
        const figure = new Figure2D();
        cb(figure);
        const mesh = new Mesh2D(figure, canvas);
        mesh.setFill({color: [1, 0, 0, 1]});
        renderer.drawMeshes([mesh]);
        return canvas.toDataURL();
      };
    });
  });

  it('rect', async () => {
    const result = await page.evaluate(() => {
      return drawFigure(figure => {
        figure.rect(50, 50, 100, 100);
      });
    });
    expect(result).toMatchSnapshot();
  });

  it('arc', async () => {
    const result = await page.evaluate(() => {
      return drawFigure(figure => {
        figure.arc(0, 0, 50, 0, 2 * Math.PI);
      });
    });
    expect(result).toMatchSnapshot();
  });

  it('addPath', async () => {
    const result = await page.evaluate(() => {
      return drawFigure(figure => {
        figure.addPath(
          'M480,50L423.8,182.6L280,194.8L389.2,289.4L356.4,430L480,355.4L480,355.4L603.6,430L570.8,289.4L680,194.8L536.2,182.6Z',
        );
      });
    });
    expect(result).toMatchSnapshot();
  });
});
