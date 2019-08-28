importScripts('/js/mesh.js');

self.addEventListener('message', (evt) => {
  const {Renderer, Figure2D, Mesh2D} = meshjs;

  const canvas = evt.data.canvas;

  const renderer = new Renderer(canvas, {
    contextType: 'webgl2',
    // antialias: true,
  });

  const figure = new Figure2D();
  figure.rect(50, 50, 50, 50);

  const meshList = [];

  for(let i = 0; i < 3000; i++) {
    const pos = [Math.random() * 400, Math.random() * 400];
    const mesh = new Mesh2D(figure, canvas);
    // mesh.blend = false;
    mesh.pos = pos;
    mesh.setFill({
      // thickness: 6,
      color: [1, 0, 0, 0.5],
    });
    // if(i > 500) {
    //   mesh.saturate(0.5);
    // }
    meshList.push(mesh);
  }

  function update(t) {
    meshList.forEach((mesh) => {
      mesh.setTransform(1, 0, 0, 1, ...mesh.pos);
      mesh.rotate(t * 0.001 * Math.PI, [mesh.pos[0] + 75, mesh.pos[1] + 75]);
    });
    renderer.clear();
    renderer.drawMeshes(meshList);
    requestAnimationFrame(update);
  }
  update(0);
});
