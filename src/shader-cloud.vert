attribute vec3 a_vertexPosition;
attribute vec4 a_color;
varying vec4 vColor;
varying float flagBackground;
attribute vec3 a_transform0;
attribute vec3 a_transform1;
uniform vec2 u_resolution;
uniform mat3 viewMatrix;
uniform mat3 projectionMatrix;

#ifdef TEXTURE
attribute vec3 a_vertexTextureCoord;
varying vec3 vTextureCoord;
attribute float a_frameIndex;
varying float frameIndex;
attribute vec4 a_sourceRect;
varying vec4 vSourceRect;
#endif

#ifdef CLIPPATH
attribute vec2 a_clipUV;
varying vec2 vClipUV;
#endif

#ifdef CLOUDFILTER
attribute vec4 a_colorCloud0;
attribute vec4 a_colorCloud1;
attribute vec4 a_colorCloud2;
attribute vec4 a_colorCloud3;
attribute vec4 a_colorCloud4;
varying vec4 colorCloud0;
varying vec4 colorCloud1;
varying vec4 colorCloud2;
varying vec4 colorCloud3;
varying vec4 colorCloud4;
#endif

#ifdef CLOUDCOLOR
attribute vec4 a_fillCloudColor;
attribute vec4 a_strokeCloudColor;
#endif

#ifdef GRADIENT
uniform float u_radialGradientVector[6];
varying vec3 vGradientVector1;
varying vec3 vGradientVector2;
#endif

void main() {
  gl_PointSize = 1.0;

  mat3 modelMatrix = mat3(
    a_transform0.x, a_transform1.x, 0, 
    a_transform0.y, a_transform1.y, 0,
    a_transform0.z, a_transform1.z, 1
  );

  vec3 pos = projectionMatrix * viewMatrix * modelMatrix * vec3(a_vertexPosition.xy, 1.0);
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

#ifdef CLOUDCOLOR
  if(flagBackground > 0.0) {
    vColor = mix(a_color, a_fillCloudColor, a_fillCloudColor.a);
  } else {
    vColor = mix(a_color, a_strokeCloudColor, a_strokeCloudColor.a);
  }
#else
  vColor = a_color;
#endif

#ifdef TEXTURE
  vTextureCoord = a_vertexTextureCoord;
  frameIndex = a_frameIndex;
  vSourceRect = a_sourceRect;
#endif

#ifdef CLIPPATH
  vClipUV = a_clipUV;
#endif

#ifdef CLOUDFILTER
  colorCloud0 = a_colorCloud0;
  colorCloud1 = a_colorCloud1;
  colorCloud2 = a_colorCloud2;
  colorCloud3 = a_colorCloud3;
  colorCloud4 = a_colorCloud4;
#endif
}