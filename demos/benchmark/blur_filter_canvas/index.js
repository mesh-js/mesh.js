function loadImage(src) {
  const img = new Image();
  return new Promise((resolve) => {
    img.onload = function () {
      resolve(img);
    };
    img.src = src;
  });
}

const canvas = document.querySelector('canvas');

(async function () {
  const textureURL = 'https://p4.ssl.qhimg.com/t012170360e1552ce17.png';
  const img = await loadImage(textureURL);

  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';

  function draw() {
    const NUM = 20;
    ctx.clearRect(0, 0, 512, 512);
    for(let i = 0; i < NUM; i++) {
      ctx.save();
      ctx.filter = 'blur(3px)';
      ctx.translate(500 * Math.random(), 500 * Math.random());
      ctx.beginPath();
      ctx.rect(0, 0, 40, 40);
      ctx.fill();
      ctx.drawImage(img, 0, 0, 40, 40);
      ctx.restore();
    }
    requestAnimationFrame(draw);
  }

  draw();
}());
