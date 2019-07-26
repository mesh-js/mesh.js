const {Scene, Path} = spritejs;

const scene = new Scene('#app', {
  viewport: ['auto', 'auto'],
  resolution: [512, 512],
});

const NUM = 1000;
const size = 20;
const d = `M0 0L0 ${size}L${size} ${size}Z`;
const list = [];
for(let i = 0; i < NUM; i++) {
  const s = new Path(d);
  s.attr({
    fillColor: 'red',
    strokeColor: '#f0f',
    lineWidth: 2,
  });
  list.push(s);
}

scene.layer().append(...list);

function update() {
  list.forEach((s) => {
    const ang = Math.random() * 180;
    s.attr({
      transform: {
        translate: [500 * Math.random(), 500 * Math.random()],
        rotate: ang,
      },
    });
  });
  requestAnimationFrame(update);
}
update();