attribute vec3 a_vertexPosition;

attribute vec4 a_color;
varying vec4 vColor;

attribute vec2 a_vertexTextureCoord;

varying vec2 vTextureCoord;
varying float flagBackground;

void main() {
  gl_PointSize = 1.0;
  gl_Position = vec4(a_vertexPosition.xy, 1.0, 1.0);
  
  flagBackground = a_vertexPosition.z;
  vColor = a_color;
  vTextureCoord = a_vertexTextureCoord;
}