attribute vec3 a_vertexPosition;

attribute vec4 a_color;
varying vec4 vColor;

attribute vec2 a_vertexTextureCoord;

attribute vec4 a_transform0;
attribute vec4 a_transform1;

varying vec2 vTextureCoord;
varying float flagBackground;

void transformPoint(inout vec2 p, vec3 m0, vec3 m1, float w, float h) {
  float x = p.x;
  float y = p.y;
  x = (x + 1.0) * 0.5 * w;
  y = (1.0 - y) * 0.5 * h;
  p.x = x * m0.x + y * m0.y + m0.z;
  p.y = x * m1.x + y * m1.y + m1.z;
  p.x = 2.0 * (p.x / w - 0.5);
  p.y = 2.0 * (0.5 - p.y / h);
}

void main() {
  gl_PointSize = 1.0;

  vec3 m0 = vec3(a_transform0.x, a_transform0.z, a_transform1.y);
  vec3 m1 = vec3(a_transform0.y, a_transform1.x, a_transform1.z);

  vec2 xy = a_vertexPosition.xy;
  transformPoint(xy, m0, m1, a_transform0.w, a_transform1.w);
  gl_Position = vec4(xy, 1.0, 1.0);
  
  flagBackground = a_vertexPosition.z;
  vColor = a_color;
  vTextureCoord = a_vertexTextureCoord;
}