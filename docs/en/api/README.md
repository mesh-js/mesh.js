## Overview

MeshJS is a graphics system provides low-level api to browsers or other platforms.

It based on canvas environment and can use both WebGL or 2D renderering contexts to draw shapes and objects.

![](https://s3.ssl.qhres.com/static/b5e9224fc42157fb.svg)

There are three concepts.

- Figure2D represents a graph with shape.
- Mesh2D get contours form a figure2D and triangulate it's contours to triangular meshes.
- Renderer create a drawing context and draw meshData to canvas.

![](https://p2.ssl.qhimg.com/t0100b6a9d8e41e4065.jpg)

---

## Classes

  - [Figure2D](/en/api/figure2D)
  - [Mesh2D](/en/api/mesh2D)
  - [Renderer](/en/api/renderer)