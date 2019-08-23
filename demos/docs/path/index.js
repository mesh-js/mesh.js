const {Figure2D, Mesh2D, Renderer} = meshjs;

const canvas = document.querySelector('canvas');

const figure = new Figure2D();
figure.addPath('M480,50L423.8,182.6L280,194.8L389.2,289.4L356.4,430L480,355.4L480,355.4L603.6,430L570.8,289.4L680,194.8L536.2,182.6Z');

const mesh1 = new Mesh2D(figure, canvas);

mesh1.setFill({
  color: [0.3, 0.6, 0, 1],
});

mesh1.scale(0.5);

const renderer = new Renderer(canvas, {
  antialias: true,
});

renderer.drawMeshes([mesh1]);