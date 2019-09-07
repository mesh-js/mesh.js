const {Renderer, Figure2D, Mesh2D} = meshjs;

const canvas = document.querySelector('canvas');
const renderer = new Renderer(canvas, {
  contextType: 'webgl2',
});

const vertShader = `
  attribute vec3 a_vertexPosition;

  void main() {
    gl_PointSize = 1.0;
    gl_Position = vec4(a_vertexPosition.xy, 1.0, 1.0);
  }
`;

const fragShader = `
precision mediump float;

highp float random(vec2 co)
{
    highp float a = 12.9898;
    highp float b = 78.233;
    highp float c = 43758.5453;
    highp float dt= dot(co.xy ,vec2(a,b));
    highp float sn= mod(dt,3.14);
    return fract(sin(sn) * c);
}

// Value Noise by Inigo Quilez - iq/2013
// https://www.shadertoy.com/view/lsf3WH
highp float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix( mix( random( i + vec2(0.0,0.0) ),
                    random( i + vec2(1.0,0.0) ), u.x),
                mix( random( i + vec2(0.0,1.0) ),
                    random( i + vec2(1.0,1.0) ), u.x), u.y);
}

#ifndef OCTAVES
#define OCTAVES 6
#endif
float mist(vec2 st) {
  //Initial values
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 0.0;

  // Loop of octaves
  for(int i = 0; i < OCTAVES; i++) {
    value += amplitude * noise(st);
    st *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

//  Function from Iñigo Quiles
//  https://www.shadertoy.com/view/MsS3Wc
vec3 hsb2rgb(vec3 c){
  vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0), 6.0)-3.0)-1.0, 0.0, 1.0);
  rgb = rgb * rgb * (3.0 - 2.0 * rgb);
  return c.z * mix(vec3(1.0), rgb, c.y);
}

uniform float u_time;
uniform vec2 u_resolution;

void main() {
  vec2 st = gl_FragCoord.xy / u_resolution;
  st.x += 0.1 * u_time; 
  gl_FragColor = vec4(hsb2rgb(vec3(mist(st), 1.0, 1.0)),1.0);
}
`;

const program = renderer.glRenderer.compileSync(fragShader, vertShader);

const wings = [[2, 126, 86, 60], [2, 64, 86, 60], [2, 2, 86, 60]];
const textureURL = 'https://p.ssl.qhimg.com/d/inn/c886d09f/birds.png';

(async function () {
  const birdRect = [0, 0, 43, 30];
  const birdTexture = await renderer.loadTexture(textureURL);

  const figure = new Figure2D();
  figure.rect(...birdRect);

  const bird = new Mesh2D(figure, canvas);
  bird.translate(279, 135);
  bird.setTexture(birdTexture, {
    rect: birdRect,
    srcRect: wings[0],
  });
  let i = 0;
  setInterval(() => {
    bird.setTexture(birdTexture, {
      rect: birdRect,
      srcRect: wings[++i % 3],
    });
  }, 100);

  const background = new Figure2D();
  background.rect(0, 0, canvas.width, canvas.height);

  const sky = new Mesh2D(background, canvas);
  sky.setUniforms({
    u_color: [1, 0, 1, 1],
    u_resolution: [canvas.width, canvas.height],
  });

  function update(t) {
    renderer.clear();
    sky.setUniforms({
      u_time: t / 1000,
      u_resolution: [canvas.width, canvas.height],
    });
    renderer.drawMeshes([sky], {program});
    renderer.drawMeshes([bird]);
    requestAnimationFrame(update);
  }
  update(0);
}());