const {Renderer, Figure2D} = meshjs;
const canvas = document.querySelector('canvas');

/* globals Proton, MeshRenderer */
const proton = new Proton();
const emitter = new Proton.Emitter();

// set Rate
emitter.rate = new Proton.Rate(Proton.getSpan(10, 20), 0.1);

// add Initialize
emitter.addInitialize(new Proton.Radius(1, 12));
emitter.addInitialize(new Proton.Life(2, 4));
emitter.addInitialize(new Proton.Velocity(3, Proton.getSpan(0, 360), 'polar'));

// add Behaviour
emitter.addBehaviour(new Proton.Color('#ff0000', 'random'));
emitter.addBehaviour(new Proton.Alpha(1, 0));
emitter.addBehaviour(new Proton.Rotate());

// set emitter position
emitter.p.x = canvas.width / 2;
emitter.p.y = canvas.height / 2;
emitter.emit(5);

// add emitter to the proton
proton.addEmitter(emitter);

// add renderer
const renderer = new Renderer(canvas);
const figure = new Figure2D();
figure.rect(-0.5, -0.5, 1, 1);
emitter.addInitialize(new Proton.Body(figure));
const meshRenderer = new MeshRenderer(renderer);
proton.addRenderer(meshRenderer);
// const canvasRenderer = new Proton.CanvasRenderer(canvas);
// proton.addRenderer(canvasRenderer);

// use Euler integration calculation is more accurate (default false)
Proton.USE_CLOCK = false;
// proton.update()
function tick() {
  requestAnimationFrame(tick);
  proton.update();
}
tick();