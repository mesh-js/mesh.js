importScripts('/js/mesh.js');

self.addEventListener('message', (evt) => {
  const {Figure2D, Mesh2D, Renderer} = meshjs;

  const canvas = evt.data.canvas;

  const figure = new Figure2D();
  figure.rect(-100, -100, 200, 200);

  const mesh1 = new Mesh2D(figure, canvas);
  const mesh2 = new Mesh2D(figure, canvas);

  mesh1.setFill({
    color: [1, 0, 0, 0.5],
  });

  mesh2.setFill({
    color: [0, 0, 1, 0.5],
  });

  mesh2.rotate(Math.PI / 4);

  mesh1.translate(300, 150);
  mesh2.translate(300, 150);

  const renderer = new Renderer(canvas);

  renderer.drawMeshes([mesh1, mesh2]);
});