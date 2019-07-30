# Mesh.js

A super fast 2D renderer for modern browsers.

## Installation

From CDN:

```html
<script src="https://s2.ssl.qhres.com/static/42cee46429efa138.js"></script>
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

## LICENSE

MIT
