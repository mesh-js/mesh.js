(window.webpackJsonp=window.webpackJsonp||[]).push([[91],{516:function(n,e,s){"use strict";s.r(e),e.default="const {Figure2D, Mesh2D, Renderer} = meshjs;\n\nconst canvas = document.querySelector('canvas');\n\nconst figure = new Figure2D();\nfigure.arc(0, 0, 30, 0, Math.PI * 2);\n\nconst mesh1 = new Mesh2D(figure);\nconst mesh2 = new Mesh2D(figure);\nconst mesh3 = new Mesh2D(figure);\n\nmesh1.setFill({\n  color: [1, 0, 0, 0.5],\n});\n\nmesh2.setFill({\n  color: [0, 0, 1, 0.5],\n});\n\nmesh3.setFill({\n  color: [0, 1, 0, 0.5],\n});\n\nmesh1.scale(3).translate(300, 150);\nmesh2.scale(2).translate(300, 150);\nmesh3.translate(300, 150);\n\nconst renderer = new Renderer(canvas, {\n  antialias: true,\n});\n\nrenderer.drawMeshes([mesh1, mesh2, mesh3]);"}}]);