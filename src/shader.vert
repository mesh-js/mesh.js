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

#ifdef CLIPPATH
attribute vec2 a_clipUV;
varying vec2 vClipUV;
#endif

#ifdef GRADIENT
uniform float u_radialGradientVector[6];
varying vec3 vGradientVector1;
varying vec3 vGradientVector2;
#endif

void main() {
  gl_PointSize = 1.0;

  vec3 pos = projectionMatrix * viewMatrix * vec3(a_vertexPosition.xy, 1.0);
  gl_Position = vec4(pos.xy, 1.0, 1.0);

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

#ifdef CLIPPATH
  vClipUV = a_clipUV;
#endif
}