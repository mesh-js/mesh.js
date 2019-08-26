const {Renderer, Figure2D, Mesh2D} = meshjs;

const canvas = document.querySelector('canvas');
const renderer = new Renderer(canvas, {
  antialias: true,
});

const figure = new Figure2D();
figure.rect(0, 0, 200, 200);

const mesh = new Mesh2D(figure, canvas);
mesh.setLinearGradient({
  vector: [0, 0, 200, 200],
  colors: [
    {offset: 0, color: [1, 0, 0, 1]},
    {offset: 0.5, color: [0, 1, 0, 1]},
    {offset: 1, color: [0, 0, 1, 1]},
  ],
});

mesh.translate(200, 50);

const figure2 = new Figure2D();
figure2.arc(0, 0, 50, 0, 2 * Math.PI);

const mesh2 = new Mesh2D(figure2, canvas);
mesh2.setRadialGradient({
  vector: [0, 0, 0, 0, 0, 50],
  colors: [
    {offset: 0, color: [1, 0, 1, 1]},
    {offset: 0.5, color: [0, 1, 1, 1]},
    {offset: 1, color: [1, 0, 1, 1]},
  ],
});
mesh2.translate(300, 150);

renderer.drawMeshes([mesh, mesh2]);
