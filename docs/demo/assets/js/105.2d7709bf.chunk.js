(window.webpackJsonp=window.webpackJsonp||[]).push([[105],{530:function(n,e,t){"use strict";t.r(e),e.default="importScripts('mesh.js');\n\nself.addEventListener('message', (evt) => {\n  const fgcanvas = evt.data.canvas;\n  const wings = [[2, 126, 86, 60], [2, 64, 86, 60], [2, 2, 86, 60]];\n\n  const textureURL = 'https://p.ssl.qhimg.com/d/inn/c886d09f/birds.png';\n  (async function () {\n    const {Renderer, Figure2D, Mesh2D} = meshjs;\n    const renderer = new Renderer(fgcanvas, {\n      contextType: 'webgl2',\n    });\n\n    const center = [256, 256];\n\n    const figure = new Figure2D();\n    figure.rect(0, 0, 43, 30);\n\n    const meshList = [];\n\n    const texture = await renderer.loadTexture(textureURL);\n\n    function moveTo(bird, ang) {\n      let flip = 1;\n      if(ang > 0.5 * Math.PI && ang < 1.5 * Math.PI) {\n        flip = -1;\n      }\n      const {x: x0, y: y0} = bird;\n      const x1 = flip * 250 * Math.cos(ang);\n      const y1 = flip * 250 * Math.sin(ang);\n      const distance = Math.sqrt((x1 - x0) ** 2 + (y1 - y0) ** 2);\n      const startTime = Date.now(),\n        T = 5 * distance + 100;\n\n      requestAnimationFrame(function f() {\n        let p = (Date.now() - startTime) / T;\n        p = Math.min(1.0, p);\n        const x = x0 + p * (x1 - x0);\n        const y = y0 + p * (y1 - y0);\n        bird.x = x;\n        bird.y = y;\n        bird.setTransform(1, 0, 0, 1, x, y);\n        if(ang > 0.5 * Math.PI && ang < 1.5 * Math.PI) {\n          bird.scale(-1, 1, [43, 30]);\n        }\n        if(p < 1) {\n          requestAnimationFrame(f);\n        } else {\n          setTimeout(() => {\n            const newAng = Math.random() * 2 * Math.PI;\n            moveTo(bird, newAng);\n          }, 500);\n        }\n      });\n    }\n\n    function addBird() {\n      const bird = new Mesh2D(figure, fgcanvas);\n      // mesh.setFill({\n      //   color: [1, 0, 0, 0.8],\n      // });\n      let i = 0;\n      function setTexture(i) {\n        bird.setTexture(texture, {\n          scale: false,\n          repeat: false,\n          rect: [0, 0, 43, 30],\n          srcRect: wings[i % 3],\n        });\n      }\n      setInterval(() => {\n        setTexture(++i);\n      }, 100);\n      setTexture(i);\n      meshList.push(bird);\n\n      bird.x = 0;\n      bird.y = 0;\n\n      const ang = Math.random() * 2 * Math.PI;\n      moveTo(bird, ang);\n    }\n\n    addBird();\n\n    let birdCount = 1;\n    const timer = setInterval(() => {\n      if(birdCount++ < 1500) addBird();\n      else clearInterval(timer);\n    }, 0);\n\n    renderer.setGlobalTransform(1, 0, 0, 1, center[0] - 43, center[1] - 30);\n    function update() {\n      renderer.clear();\n      renderer.drawMeshes(meshList);\n      requestAnimationFrame(update);\n    }\n\n    update(0);\n  }());\n});"}}]);