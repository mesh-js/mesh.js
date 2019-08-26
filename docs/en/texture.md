# Textures and Text

We can use `renderer.loadTexture` to create a texture from a remote URL or use `renderer.createTexture` to create a texture from an image or a canvas.

```js
const url = 'https://p0.ssl.qhimg.com/t01a72262146b87165f.png';

const {Renderer, Figure2D, Mesh2D} = meshjs;

const canvas = document.querySelector('canvas');
const renderer = new Renderer(canvas);

(async function () {
  const texture = await renderer.loadTexture(url);
  const figure = new Figure2D();
  figure.rect(0, 0, 196, 256);
  const mesh = new Mesh2D(figure, canvas);
  mesh.setTexture(texture);

  mesh.translate(202, 22); // 300 - 196 / 2, 150 - 256 / 2

  renderer.drawMeshes([mesh]);
}());
```

<iframe src="/demo/#/docs/texture" height="400"></iframe>

By default, texture coordinates range from 0,0 to `image.width, image.height`.

We can use `rect` option to change the coordinates.

```js
const url = 'https://p0.ssl.qhimg.com/t01a72262146b87165f.png';

const {Renderer, Figure2D, Mesh2D} = meshjs;

const canvas = document.querySelector('canvas');
const renderer = new Renderer(canvas);

(async function () {
  const texture = await renderer.loadTexture(url);
  const textureRect = [-92, -128, 196, 256];

  const figure = new Figure2D();
  figure.rect(...textureRect);

  const mesh = new Mesh2D(figure, canvas);
  mesh.setTexture(texture, {rect: textureRect});

  mesh.rotate(Math.PI / 4).translate(300, 150);

  renderer.drawMeshes([mesh]);
}());
```

<iframe src="/demo/#/docs/texture_rect" height="400"></iframe>