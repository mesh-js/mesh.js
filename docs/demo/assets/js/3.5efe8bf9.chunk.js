(window.webpackJsonp=window.webpackJsonp||[]).push([[3],{284:function(n,t,e){"use strict";e.r(t),t.default="const worker = new Worker('./worker.js');\n\nworker.onmessage = function (event) {\n  const bitmap = event.data.buffer;\n  const canvas = document.querySelector('canvas');\n  const bitmapContext = canvas.getContext('bitmaprenderer');\n  if(bitmapContext) {\n    bitmapContext.transferFromImageBitmap(bitmap);\n  } else {\n    const context = canvas.getContext('2d');\n    context.drawImage(bitmap, 0, 0);\n  }\n};"}}]);