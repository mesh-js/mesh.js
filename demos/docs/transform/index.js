/* globals dat */
const config = {
  originX: 300,
  originY: 150,
  x: 300,
  y: 150,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
  skewX: 0,
  skewY: 0,
};

const {Renderer, Figure2D, Mesh2D} = meshjs;

const canvas = document.querySelector('canvas');
const renderer = new Renderer(canvas);

const figure = new Figure2D();
figure.rect(-75, -75, 150, 150);

const sprite = new Mesh2D(figure, canvas);
sprite.setLinearGradient({
  vector: [-75, -75, 150, 150],
  colors: [
    {offset: 0, color: [1, 0, 0, 1]},
    {offset: 1, color: [0, 1, 0, 1]},
  ],
});

const crossFigure = new Figure2D();
crossFigure.addPath('M-5 0L5 0M0 -5L0 5');

const originSign = new Mesh2D(crossFigure, canvas);
originSign.setStroke({
  thinckness: 2,
  color: [0, 0, 1, 1],
});

originSign.translate(config.originX, config.originY);

function updateSprite() {
  renderer.clear();
  sprite.setTransform(1, 0, 0, 1, 0, 0);
  sprite.translate(config.x, config.y);
  sprite.rotate(Math.PI * config.rotation / 180, [config.originX, config.originY]);
  sprite.scale(config.scaleX, config.scaleY, [config.originX, config.originY]);
  sprite.skew(config.skewX, config.skewY, [config.originX, config.originY]);
  renderer.drawMeshes([sprite, originSign]);
}

function updateTransformOrigin() {
  originSign.setTransform(1, 0, 0, 1, 0, 0);
  originSign.translate(config.originX, config.originY);
  updateSprite();
}

const initGui = () => {
  const gui = new dat.GUI();

  gui.add(config, 'originX', 0, 600).onChange(updateTransformOrigin);
  gui.add(config, 'originY', 0, 300).onChange(updateTransformOrigin);
  gui.add(config, 'x', 0, 600).onChange(updateSprite);
  gui.add(config, 'y', 0, 300).onChange(updateSprite);
  gui.add(config, 'rotation', 0, 360).onChange(updateSprite);
  gui.add(config, 'scaleX', -1, 2).onChange(updateSprite);
  gui.add(config, 'scaleY', -1, 2).onChange(updateSprite);
  gui.add(config, 'skewX', 0, 5).onChange(updateSprite);
  gui.add(config, 'skewY', 0, 5).onChange(updateSprite);
};

initGui();

updateSprite();