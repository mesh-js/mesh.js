attribute vec3 a_vertexPosition;
attribute vec4 a_color;
varying vec4 vColor;
varying float flagBackground;

#ifdef TEXTURE
attribute vec2 a_vertexTextureCoord;
varying vec2 vTextureCoord;
#endif

#ifdef GRADIENT
uniform float u_radialGradientVector[6];
varying vec3 vGradientVector1;
varying vec3 vGradientVector2;
#endif

#ifdef GLOBALTRANSFORM
uniform float u_globalTransform[8];

void transformPoint(inout vec2 p) {
  vec3 m0 = vec3(u_globalTransform[0], u_globalTransform[2], u_globalTransform[5]);
  vec3 m1 = vec3(u_globalTransform[1], u_globalTransform[4], u_globalTransform[6]);
  float w = u_globalTransform[3];
  float h = u_globalTransform[7];
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
  
#ifdef GRADIENT
  vGradientVector1 = vec3(u_radialGradientVector[0], u_radialGradientVector[1], u_radialGradientVector[2]);
  vGradientVector2 = vec3(u_radialGradientVector[3], u_radialGradientVector[4], u_radialGradientVector[5]);
#endif

#ifdef GLOBALTRANSFORM
  vec2 xy = a_vertexPosition.xy;
  transformPoint(xy);
  gl_Position = vec4(xy, 1.0, 1.0);
#ifdef GRADIENT
  vec2 vg1 = vGradientVector1.xy;
  vec2 vg2 = vGradientVector2.xy;
  float h = u_globalTransform[7];
  float y1 = h - vg1.y;
  float y2 = h - vg2.y;

  vGradientVector1.x = vg1.x * u_globalTransform[0] + y1 * u_globalTransform[2] + u_globalTransform[5];
  vGradientVector1.y = h - (vg1.x * u_globalTransform[1] + y1 * u_globalTransform[4] + u_globalTransform[6]);

  vGradientVector2.x = vg2.x * u_globalTransform[0] + y2 * u_globalTransform[2] + u_globalTransform[5];
  vGradientVector2.y = h - (vg2.x * u_globalTransform[1] + y2 * u_globalTransform[4] + u_globalTransform[6]);
#endif
#endif
  
  flagBackground = a_vertexPosition.z;
  vColor = a_color;

#ifdef TEXTURE
  vTextureCoord = a_vertexTextureCoord;
#endif
}