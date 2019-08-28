# Mesh.js

A graphics system born for visualization 😘.

## Why mesh.js

- Blazing fast rendering massive sprites. See our [benchmark](http://meshjs.org/demo/#/benchmark/triangles).
- Cross platform. Support both canvas2d and webgl.
- Support SVG Path.
- Support gradients and filters.
- Support Worker and OffscreenCanvas.

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

```js
const {Renderer, Figure2D, Mesh2D} = meshjs;

const canvas = document.querySelector('canvas');
const renderer = new Renderer(canvas);

const figure = new Figure2D();
figure.rect(-100, -100, 200, 200);

const mesh1 = new Mesh2D(figure, canvas);
mesh1.setFill({
  color: [1, 0, 0, 0.5],
});

const mesh2 = new Mesh2D(figure, canvas);
mesh2.setFill({
  color: [0, 0, 1, 0.5],
});

[mesh1, mesh2].forEach((m) => {
  m.translate(300, 150);
});

function update(t) {
  mesh2.rotate(0.01 * Math.PI, [300, 150]);
  renderer.drawMeshes([mesh1, mesh2]);
  requestAnimationFrame(update);
}

update(0);
```

<iframe src="/demo/#/docs/index" height="400"></iframe>

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
