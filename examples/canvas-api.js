const canvas = document.querySelector('canvas');

const context = canvas.getContext('2d');

context.fillStyle = 'red';

context.beginPath();
context.rect(0, 0, 200, 200);

context.fill();