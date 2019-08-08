#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D u_texSampler;
uniform int u_texFlag;
uniform int u_repeat;
uniform vec4 u_srcRect;

uniform int u_filterFlag;
uniform float u_colorMatrix[20];

varying vec4 vColor;
varying vec2 vTextureCoord;
varying float flagBackground;

void transformColor(inout vec4 color) {
  float r = color.r, g = color.g, b = color.b, a = color.a;
  color[0] = u_colorMatrix[0] * r + u_colorMatrix[1] * g + u_colorMatrix[2] * b + u_colorMatrix[3] * a + u_colorMatrix[4];
  color[1] = u_colorMatrix[5] * r + u_colorMatrix[6] * g + u_colorMatrix[7] * b + u_colorMatrix[8] * a + u_colorMatrix[9];
  color[2] = u_colorMatrix[10] * r + u_colorMatrix[11] * g + u_colorMatrix[12] * b + u_colorMatrix[13] * a + u_colorMatrix[14];
  color[3] = u_colorMatrix[15] * r + u_colorMatrix[16] * g + u_colorMatrix[17] * b + u_colorMatrix[18] * a + u_colorMatrix[19];
}

void main() {
  vec4 color = vColor;

  if(u_texFlag > 0 && flagBackground > 0.0) {
    vec2 texCoord = vTextureCoord;

    if(u_repeat == 1) {
      texCoord = fract(texCoord);
    }

    if(texCoord.x <= 1.0 && texCoord.x >= 0.0
      && texCoord.y <= 1.0 && texCoord.y >= 0.0) {
      if(u_srcRect.z > 0.0) {
        texCoord.x = u_srcRect.x + texCoord.x * u_srcRect.z;
        texCoord.y = 1.0 - (u_srcRect.y + (1.0 - texCoord.y) * u_srcRect.w);
      }
      vec4 texColor = texture2D(u_texSampler, texCoord);
      color = mix(color, texColor, texColor.a);
    }
  }

  if(u_filterFlag > 0) {
    transformColor(color);
  }

  gl_FragColor = color;
}