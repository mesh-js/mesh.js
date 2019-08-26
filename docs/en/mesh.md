# Drawing meshes

Drawing a graph using mesh.js is usually divided into three steps:

- Create reusable geometry using Figure2D
- Generate Mesh2D objects using the created geometry
- Render multiple Mesh2D objects with Renderer

```js
const {Figure2D, Mesh2D, Renderer} = meshjs;

const canvas = document.querySelector('canvas');

const figure = new Figure2D();
figure.rect(-100, -100, 200, 200);

const mesh1 = new Mesh2D(figure, canvas);
const mesh2 = new Mesh2D(figure, canvas);

mesh1.setFill({
  color: [1, 0, 0, 0.5],
});

mesh2.setFill({
  color: [0, 0, 1, 0.5],
});

mesh2.rotate(Math.PI / 4);

mesh1.translate(300, 150);
mesh2.translate(300, 150);

const renderer = new Renderer(canvas);

renderer.drawMeshes([mesh1, mesh2]);
```

<iframe src="/demo/#/docs/basic" height="400"></iframe>

### Different shapes

We can draw different shapes using the Figure2D API, which are similar to the Canvas2D API.

For example:

```js
const {Figure2D, Mesh2D, Renderer} = meshjs;

const canvas = document.querySelector('canvas');

const figure = new Figure2D();
figure.arc(0, 0, 30, 0, Math.PI * 2);

const mesh1 = new Mesh2D(figure, canvas);
const mesh2 = new Mesh2D(figure, canvas);
const mesh3 = new Mesh2D(figure, canvas);

mesh1.setFill({
  color: [1, 0, 0, 0.5],
});

mesh2.setFill({
  color: [0, 0, 1, 0.5],
});

mesh3.setFill({
  color: [0, 1, 0, 0.5],
});

mesh1.scale(3).translate(300, 150);
mesh2.scale(2).translate(300, 150);
mesh3.translate(300, 150);

const renderer = new Renderer(canvas, {
  antialias: true,
});

renderer.drawMeshes([mesh1, mesh2, mesh3]);
```

<iframe src="/demo/#/docs/circles" height="400"></iframe>

We can use svg-path as well.

```js
const {Figure2D, Mesh2D, Renderer} = meshjs;

const canvas = document.querySelector('canvas');

const figure = new Figure2D();
figure.addPath('M480,50L423.8,182.6L280,194.8L389.2,289.4L356.4,430L480,355.4L480,355.4L603.6,430L570.8,289.4L680,194.8L536.2,182.6Z');

const mesh1 = new Mesh2D(figure, canvas);

mesh1.setFill({
  color: [0.3, 0.6, 0, 1],
});

mesh1.scale(0.5);

const renderer = new Renderer(canvas);

renderer.drawMeshes([mesh1]);
```

<iframe src="/demo/#/docs/path" height="400"></iframe>