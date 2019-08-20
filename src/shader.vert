attribute vec3 a_vertexPosition;
attribute vec4 a_color;
varying vec4 vColor;
varying float flagBackground;

#ifdef TEXTURE
attribute vec2 a_vertexTextureCoord;
varying vec2 vTextureCoord;
#endif

#ifdef GLOBALTRANSFORM
uniform float u_globalTransform[8];

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
#endif

void main() {
  gl_PointSize = 1.0;
  gl_Position = vec4(a_vertexPosition.xy, 1.0, 1.0);
  
#ifdef GLOBALTRANSFORM
  vec3 m0 = vec3(u_globalTransform[0], u_globalTransform[2], u_globalTransform[5]);
  vec3 m1 = vec3(u_globalTransform[1], u_globalTransform[4], u_globalTransform[6]);
  float width = u_globalTransform[3];
  float height = u_globalTransform[7];
  vec2 xy = a_vertexPosition.xy;
  transformPoint(xy, m0, m1, width, height);
  gl_Position = vec4(xy, 1.0, 1.0);
#endif
  
  flagBackground = a_vertexPosition.z;
  vColor = a_color;

#ifdef TEXTURE
  vTextureCoord = a_vertexTextureCoord;
#endif
}