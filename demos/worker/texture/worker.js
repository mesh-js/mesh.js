importScripts('mesh.js');

self.addEventListener('message', (evt) => {
  const url = 'https://p0.ssl.qhimg.com/t01a72262146b87165f.png';

  const {Renderer, Figure2D, Mesh2D} = meshjs;

  const canvas = evt.data.canvas;
  const renderer = new Renderer(canvas);

  (async function () {
    const texture = await renderer.loadTexture(url);
    const figure = new Figure2D();
    figure.rect(0, 0, 196, 256);
    const mesh = new Mesh2D(figure);
    mesh.setTexture(texture);

    mesh.translate(158, 128); // 256 - 196 / 2, 256 - 256 / 2

    renderer.drawMeshes([mesh]);
  }());
});