(window.webpackJsonp=window.webpackJsonp||[]).push([[92],{510:function(e,n,t){"use strict";t.r(n),n.default="const url = 'https://p0.ssl.qhimg.com/t01a72262146b87165f.png';\n\nconst {Renderer, Figure2D, Mesh2D} = meshjs;\n\nconst canvas = document.querySelector('canvas');\nconst renderer = new Renderer(canvas);\n\n(async function () {\n  const texture = await renderer.loadTexture(url);\n  const textureRect = [-92, -128, 196, 256];\n\n  const figure = new Figure2D();\n  figure.rect(...textureRect);\n\n  const mesh = new Mesh2D(figure, canvas);\n  mesh.setTexture(texture, {rect: textureRect});\n\n  mesh.rotate(Math.PI / 4).translate(300, 150);\n\n  renderer.drawMeshes([mesh]);\n}());"}}]);