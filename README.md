# Mesh.js

A graphics system born for visualization 😘.

As simple as Canvas2D and as FAST as WebGL/WebGPU.

![](https://p2.ssl.qhimg.com/t01300899f9a1c796df.jpg)

## Why mesh.js

- Blazing fast rendering massive sprites. See our [benchmark](http://meshjs.org/demo/#/benchmark/triangles).
- Cross platform. Support both canvas2d and webgl.
- Support SVG Path.
- Support gradients and filters.
- Support Worker and OffscreenCanvas.

Learn more at [meshjs.org](http://meshjs.org).

## Installation

From CDN:

```html
<script src="https://unpkg.com/@mesh.js/core/dist/mesh.js"></script>
```

Use NPM:

```bash
npm i @mesh.js/core --save;
```

```js
import {Renderer, Figure2D, Mesh2D} from meshjs;
```

## Usage

👉🏻 [online demo](https://code.h5jun.com/tedom/edit?html,js,output)

```js
const {Renderer, Figure2D, Mesh2D} = meshjs;

const canvas = document.querySelector('canvas');
const renderer = new Renderer(canvas);

const figure = new Figure2D();
figure.rect(50, 50, 100, 100);

const mesh1 = new Mesh2D(figure, canvas);
mesh1.setFill({
  color: [1, 0, 0, 1],
});

const mesh2 = new Mesh2D(figure, canvas);
mesh2.setFill({
  color: [0, 0, 1, 1],
});

function update(t) {
  mesh2.setTransform(1, 0, 0, 1, 50, 50);
  mesh2.rotate(t * 0.001 * Math.PI, [150, 150]);
  renderer.drawMeshes([mesh1, mesh2]);
  requestAnimationFrame(update);
}

update(0);
```

## Roadmap

- [ ] Complete documentations
- [ ] More demos and benchmark.
- [ ] Unit tests.
- [ ] Figure3D and Mesh3D.
- [ ] Optimize mesh compressor.
- [ ] WebGPU.
- [x] Work with Worker+OffscreenCanvas.

## LICENSE

MIT
