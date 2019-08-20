const {Renderer, Figure2D, Mesh2D} = meshjs;

const canvas = document.querySelector('canvas');
const renderer = new Renderer(canvas);

const textureURL = 'https://p4.ssl.qhimg.com/t012170360e1552ce17.png';

(async function () {
  let texture = await renderer.loadTexture(textureURL);
  texture = renderer.createText('abcdefg');

  const meshList = [];
  const NUM = 2000;
  const size = 20;

  for(let i = 0; i < NUM; i++) {
    const d = `M0 0L0 ${size}L${size} ${size}Z`;
    const figure = new Figure2D();
    figure.addPath(d);

    // console.log(figure.contours);

    const mesh = new Mesh2D(figure, {width: 512, height: 512});
    mesh.setStroke({
      thickness: 2,
      color: [1, 0, 1, 1],
    });

    mesh.setFill({
      color: [1, 0, 0, 1],
    });

    // mesh.setTransform(Math.cos(Math.PI / 4), Math.sin(Math.PI / 4), -Math.sin(Math.PI / 4), Math.cos(Math.PI / 4), 100, 100);

    // if(i > NUM / 2) {
    // mesh.setTexture(texture, {
    //   scale: false,
    //   repeat: false,
    //   rect: [10, 10],
    // });
    // }

    meshList.push(mesh);
  }

  function getData() {
    return meshList.map((mesh) => {
      const ang = Math.random() * Math.PI;
      mesh.setTransform(Math.cos(ang), Math.sin(ang), -Math.sin(ang), Math.cos(ang), 500 * Math.random(), 500 * Math.random());
      // mesh.setTransform(1, 0, 0, 1, 0, 0);
      // mesh.setTransform(Math.cos(Math.PI / 4), Math.sin(Math.PI / 4), -Math.sin(Math.PI / 4), Math.cos(Math.PI / 4), 100, 100);
      return mesh;
    });
  }

  window.getData = getData;

  function update() {
    const meshes = getData();
    renderer.clear();
    renderer.drawMeshes(meshes);
    requestAnimationFrame(update);
  }
  update();
}());
