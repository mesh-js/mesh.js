const {Renderer, Figure2D, Mesh2D} = meshjs;

const canvas = document.querySelector('canvas');
const renderer = new Renderer(canvas, {
  // contextType: '2d',
});

const textureURL = 'https://p4.ssl.qhimg.com/t012170360e1552ce17.png';
const meshList = [];

(async function () {
  const texture = await renderer.loadTexture(textureURL);

  const NUM = 2000;
  const size = 40;

  const figure = new Figure2D();
  figure.rect(0, 0, size, size);

  for(let i = 0; i < NUM; i++) {
    const mesh = new Mesh2D(figure, canvas);

    mesh.setFill({
      color: [1, 0, 0, 0.5],
    });

    mesh.setTexture(texture, {
      scale: false,
      repeat: false,
      rect: [0, 0, size, size],
    });

    mesh.hueRotate(180);

    meshList.push(mesh);
  }

  function getData() {
    return meshList.map((mesh) => {
      mesh.setTransform(1, 0, 0, 1, 0, 0);
      mesh.translate(500 * Math.random(), 500 * Math.random());
      return mesh;
    });
  }

  function update() {
    const meshes = getData();
    renderer.clear();
    renderer.drawMeshes(meshes);
    requestAnimationFrame(update);
  }
  update();
}());