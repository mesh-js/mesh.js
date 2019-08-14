attribute vec3 a_vertexPosition;

attribute vec4 a_color;
varying vec4 vColor;

attribute vec2 a_vertexTextureCoord;

attribute vec3 a_transform0;
attribute vec3 a_transform1;

varying vec2 vTextureCoord;
varying float flagBackground;

void main() {
  mat3 matrix = mat3(
    a_transform0.x, a_transform0.y, 0,
    a_transform0.z, a_transform1.x, 0,
    a_transform1.y, a_transform1.z, 1
  );
  gl_PointSize = 1.0;

  vec3 pos = matrix * vec3(a_vertexPosition.xy, 1.0);
  gl_Position = vec4(pos.xy, 1.0, 1.0);
  
  flagBackground = a_vertexPosition.z;
  vColor = a_color;
  vTextureCoord = a_vertexTextureCoord;
}