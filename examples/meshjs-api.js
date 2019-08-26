const {Renderer, Figure2D, Mesh2D} = meshjs;

const canvas = document.querySelector('canvas');
const renderer = new Renderer(canvas);

const figure = new Figure2D();
figure.rect(0, 0, 200, 200);

const mesh = new Mesh2D(figure, canvas);
mesh.setFill({color: [1, 0, 0, 1]});

renderer.drawMeshes([mesh]);