(window.webpackJsonp=window.webpackJsonp||[]).push([[3],{284:function(e,n,s){"use strict";s.r(n),n.default="const worker = new Worker('./worker.js');\nconst canvas = document.querySelector('canvas');\nconst offscreenCanvas = canvas.transferControlToOffscreen();\nworker.postMessage({type: 'created', canvas: offscreenCanvas}, [offscreenCanvas]);"}}]);