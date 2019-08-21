(async function () {
  const {Renderer} = meshjs;
  const canvas = document.querySelector('canvas');

  /* globals Proton, MeshRenderer */
  const proton = new Proton();
  const emitter = new Proton.Emitter();

  emitter.rate = new Proton.Rate(new Proton.Span(5, 13), 0.1);

  emitter.addInitialize(new Proton.Mass(1));
  emitter.addInitialize(new Proton.P(new Proton.CircleZone(300, 500, 10)));
  emitter.addInitialize(new Proton.Life(5, 7));
  emitter.addInitialize(new Proton.V(new Proton.Span(2, 3), new Proton.Span(0, 30, true), 'polar'));

  emitter.addBehaviour(new Proton.Scale(1, 0.2));
  emitter.addBehaviour(new Proton.Alpha(1, 0.2));

  emitter.emit();
  proton.addEmitter(emitter);

  // add renderer
  const renderer = new Renderer(canvas);
  const gl = renderer.glRenderer.gl;
  gl.blendFunc(gl.ONE, gl.ONE);
  const textureURL = 'https://p0.ssl.qhimg.com/t018109a4ae06d3e4d0.png';
  const texture = await renderer.loadTexture(textureURL);
  emitter.addInitialize(new Proton.Body(texture));
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
}());