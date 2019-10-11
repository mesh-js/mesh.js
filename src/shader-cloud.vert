attribute vec3 a_vertexPosition;
attribute vec4 a_color;
varying vec4 vColor;
varying float flagBackground;
attribute vec4 a_transform0;
attribute vec4 a_transform1;

#ifdef TEXTURE
attribute vec2 a_vertexTextureCoord;
varying vec2 vTextureCoord;
attribute float a_frameIndex;
varying float frameIndex;
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

#ifdef GLOBALTRANSFORM
uniform float u_globalTransform[8];
#endif

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

#ifdef GRADIENT
  vGradientVector1 = vec3(u_radialGradientVector[0], u_radialGradientVector[1], u_radialGradientVector[2]);
  vGradientVector2 = vec3(u_radialGradientVector[3], u_radialGradientVector[4], u_radialGradientVector[5]);
#endif

#ifdef GLOBALTRANSFORM
  vec3 m3 = vec3(u_globalTransform[0], u_globalTransform[2], u_globalTransform[5]);
  vec3 m4 = vec3(u_globalTransform[1], u_globalTransform[4], u_globalTransform[6]);
  float width = u_globalTransform[3];
  float height = u_globalTransform[7];
  transformPoint(xy, m3, m4, width, height);
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
#endif

#ifdef CLOUDFILTER
  colorCloud0 = a_colorCloud0;
  colorCloud1 = a_colorCloud1;
  colorCloud2 = a_colorCloud2;
  colorCloud3 = a_colorCloud3;
  colorCloud4 = a_colorCloud4;
#endif
}