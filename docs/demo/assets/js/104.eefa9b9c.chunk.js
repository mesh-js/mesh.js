(window.webpackJsonp=window.webpackJsonp||[]).push([[104],{529:function(e,n,s){"use strict";s.r(n),n.default="importScripts('mesh.js');\n\nself.addEventListener('message', (evt) => {\n  const {Figure2D, Mesh2D, Renderer} = meshjs;\n\n  const canvas = evt.data.canvas;\n\n  const figure = new Figure2D();\n  figure.rect(-100, -100, 200, 200);\n\n  const mesh1 = new Mesh2D(figure);\n  const mesh2 = new Mesh2D(figure);\n\n  mesh1.setFill({\n    color: [1, 0, 0, 0.5],\n  });\n\n  mesh2.setFill({\n    color: [0, 0, 1, 0.5],\n  });\n\n  mesh1.translate(300, 150);\n  mesh2.translate(300, 150);\n  mesh2.rotate(Math.PI / 4);\n\n  const renderer = new Renderer(canvas);\n\n  renderer.drawMeshes([mesh1, mesh2]);\n});"}}]);