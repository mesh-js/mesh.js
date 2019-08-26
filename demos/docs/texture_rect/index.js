const url = 'https://p0.ssl.qhimg.com/t01a72262146b87165f.png';

const {Renderer, Figure2D, Mesh2D} = meshjs;

const canvas = document.querySelector('canvas');
const renderer = new Renderer(canvas);

(async function () {
  const texture = await renderer.loadTexture(url);
  const textureRect = [-92, -128, 196, 256];

  const figure = new Figure2D();
  figure.rect(...textureRect);

  const mesh = new Mesh2D(figure, canvas);
  mesh.setTexture(texture, {rect: textureRect});

  mesh.rotate(Math.PI / 4).translate(300, 150);

  renderer.drawMeshes([mesh]);
}());