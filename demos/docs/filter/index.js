const {Renderer, Figure2D, Mesh2D} = meshjs;

const canvas = document.querySelector('canvas');
const renderer = new Renderer(canvas);

const girls = [
  'https://p5.ssl.qhimg.com/t01feb7d2e05533ca2f.jpg',
  'https://p5.ssl.qhimg.com/t01deebfb5b3ac6884e.jpg',
];

const filters1 = [
  null,
  ['brightness', 1.5],
  ['grayscale', 0.5],
  ['blur', '12px'],
  ['dropShadow', 15, 15, 5, [0, 0, 1, 1]],
  ['hueRotate', 45],
];

(async function () {
  const textures = await Promise.all([
    renderer.loadTexture(girls[0]),
    renderer.loadTexture(girls[1]),
  ]);

  const meshList = [];

  const figure = new Figure2D();
  figure.rect(0, 0, 64, 64);

  for(let i = 0; i < 6; i++) {
    const mesh = new Mesh2D(figure, canvas);
    mesh.setTexture(textures[0], {
      rect: [0, 0, 64, 64],
    });
    mesh.translate(32 + 96 * i, 68);
    // if(filters1[i]) {
    //   mesh[filters1[i][0]].call(mesh, ...filters1[i].slice(1));
    // }
    mesh.dropShadow(15, 15, 5, [0, 0, 1, 1]);
    meshList.push(mesh);
  }

  renderer.drawMeshes(meshList);
}());