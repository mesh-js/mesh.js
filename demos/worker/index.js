const worker = new Worker('./worker.js');
const canvas = document.querySelector('canvas');
const offscreenCanvas = canvas.transferControlToOffscreen();
worker.postMessage({type: 'created', canvas: offscreenCanvas}, [offscreenCanvas]);