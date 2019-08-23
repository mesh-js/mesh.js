const {Figure2D, Mesh2D, Renderer} = meshjs;

const canvas = document.querySelector('canvas');

const figure = new Figure2D();
figure.arc(0, 0, 30, 0, Math.PI * 2);

const mesh1 = new Mesh2D(figure, canvas);
const mesh2 = new Mesh2D(figure, canvas);
const mesh3 = new Mesh2D(figure, canvas);

mesh1.setFill({
  color: [1, 0, 0, 0.5],
});

mesh2.setFill({
  color: [0, 0, 1, 0.5],
});

mesh3.setFill({
  color: [0, 1, 0, 0.5],
});

mesh1.scale(3).translate(300, 150);
mesh2.scale(2).translate(300, 150);
mesh3.translate(300, 150);

const renderer = new Renderer(canvas, {
  antialias: true,
});

renderer.drawMeshes([mesh1, mesh2, mesh3]);