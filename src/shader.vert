attribute vec3 a_vertexPosition;
attribute vec4 a_color;
varying vec4 vColor;
varying float flagBackground;

#ifdef TEXTURE
attribute vec2 a_vertexTextureCoord;
varying vec2 vTextureCoord;
#endif

void main() {
  gl_PointSize = 1.0;
  gl_Position = vec4(a_vertexPosition.xy, 1.0, 1.0);
  
  flagBackground = a_vertexPosition.z;
  vColor = a_color;

#ifdef TEXTURE
  vTextureCoord = a_vertexTextureCoord;
#endif
}