attribute vec3 a_vertexPosition;
attribute vec4 a_color;
varying vec4 vColor;
varying float flagBackground;
uniform vec2 u_resolution;
uniform mat3 viewMatrix;
uniform mat3 projectionMatrix;

#ifdef TEXTURE
attribute vec3 a_vertexTextureCoord;
varying vec3 vTextureCoord;
attribute vec4 a_sourceRect;
varying vec4 vSourceRect;
#endif

#ifdef GRADIENT
uniform float u_radialGradientVector[6];
varying vec3 vGradientVector1;
varying vec3 vGradientVector2;
#endif

#ifdef GLOBALTRANSFORM
uniform float u_globalTransform[6];

void transformPoint(inout vec2 p) {
  vec3 m0 = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
  vec3 m1 = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
  float w = u_resolution.x;
  float h = u_resolution.y;
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
  vec2 xy = a_vertexPosition.xy;
  transformPoint(xy);
  gl_Position = vec4(xy, 1.0, 1.0);
#endif

#ifdef GRADIENT
  vec3 vg1 = viewMatrix * vec3(u_radialGradientVector[0], u_radialGradientVector[1], 1.0);
  vec3 vg2 = viewMatrix * vec3(u_radialGradientVector[3], u_radialGradientVector[4], 1.0);
  float h = u_resolution.y;
  vg1.y = h - vg1.y;
  vg2.y = h - vg2.y;
  vGradientVector1 = vec3(vg1.xy, u_radialGradientVector[2]);
  vGradientVector2 = vec3(vg2.xy, u_radialGradientVector[5]);
#endif
  
  flagBackground = a_vertexPosition.z;
  vColor = a_color;

#ifdef TEXTURE
  vTextureCoord = a_vertexTextureCoord;
  vSourceRect = a_sourceRect;
#endif
}