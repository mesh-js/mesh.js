importScripts('mesh.js');

self.addEventListener('message', (evt) => {
  const fgcanvas = evt.data.canvas;
  const wings = [[2, 126, 86, 60], [2, 64, 86, 60], [2, 2, 86, 60]];

  const textureURL = 'https://p.ssl.qhimg.com/d/inn/c886d09f/birds.png';
  (async function () {
    const {Renderer, Figure2D, Mesh2D} = meshjs;
    const renderer = new Renderer(fgcanvas, {
      contextType: 'webgl2',
    });

    const center = [256, 256];

    const figure = new Figure2D();
    figure.rect(0, 0, 43, 30);

    const meshList = [];

    const texture = await renderer.loadTexture(textureURL);

    function moveTo(bird, ang) {
      let flip = 1;
      if(ang > 0.5 * Math.PI && ang < 1.5 * Math.PI) {
        flip = -1;
      }
      const {x: x0, y: y0} = bird;
      const x1 = flip * 250 * Math.cos(ang);
      const y1 = flip * 250 * Math.sin(ang);
      const distance = Math.sqrt((x1 - x0) ** 2 + (y1 - y0) ** 2);
      const startTime = Date.now(),
        T = 5 * distance + 100;

      requestAnimationFrame(function f() {
        let p = (Date.now() - startTime) / T;
        p = Math.min(1.0, p);
        const x = x0 + p * (x1 - x0);
        const y = y0 + p * (y1 - y0);
        bird.x = x;
        bird.y = y;
        bird.setTransform(1, 0, 0, 1, x, y);
        if(ang > 0.5 * Math.PI && ang < 1.5 * Math.PI) {
          bird.scale(-1, 1, [43, 30]);
        }
        if(p < 1) {
          requestAnimationFrame(f);
        } else {
          setTimeout(() => {
            const newAng = Math.random() * 2 * Math.PI;
            moveTo(bird, newAng);
          }, 500);
        }
      });
    }

    function addBird() {
      const bird = new Mesh2D(figure, fgcanvas);
      // mesh.setFill({
      //   color: [1, 0, 0, 0.8],
      // });
      let i = 0;
      function setTexture(i) {
        bird.setTexture(texture, {
          scale: false,
          repeat: false,
          rect: [0, 0, 43, 30],
          srcRect: wings[i % 3],
        });
      }
      setInterval(() => {
        setTexture(++i);
      }, 100);
      setTexture(i);
      meshList.push(bird);

      bird.x = 0;
      bird.y = 0;

      const ang = Math.random() * 2 * Math.PI;
      moveTo(bird, ang);
    }

    addBird();

    let birdCount = 1;
    const timer = setInterval(() => {
      if(birdCount++ < 1500) addBird();
      else clearInterval(timer);
    }, 0);

    renderer.setGlobalTransform(1, 0, 0, 1, center[0] - 43, center[1] - 30);
    function update() {
      renderer.clear();
      renderer.drawMeshes(meshList);
      requestAnimationFrame(update);
    }

    update(0);
  }());
});