const fs = require('fs');
const {createCanvas, loadImage} = require('canvas');
const {Renderer, Figure2D, Mesh2D} = require('../dist/mesh');

const url = 'https://p0.ssl.qhimg.com/t01a72262146b87165f.png';
const canvas = createCanvas(512, 512);

const f = new Figure2D();
f.rect(0, 0, 100, 100);

const m = new Mesh2D(f, canvas);
m.setFill({color: 'red'});

const renderer = new Renderer(canvas);

loadImage(url).then((image) => {
  const texture = renderer.createTexture(image);
  m.setTexture(texture);
  renderer.drawMeshes([m]);
  fs.writeFileSync('snap.png', canvas.toBuffer());
  console.log(renderer);
});
