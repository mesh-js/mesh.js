#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D u_texSampler;
uniform int u_texFlag;
uniform int u_repeat;

varying vec4 vColor;
varying vec2 vTextureCoord;
varying float flagBackground;

void main() {
  gl_FragColor = vColor;

  vec2 texCoord = vTextureCoord;

  if(u_repeat == 1) {
    texCoord = fract(texCoord);
  }

  if(u_texFlag > 0 && flagBackground > 0.0 
    && texCoord.x <= 1.0 && texCoord.x >= 0.0
    && texCoord.y <= 1.0 && texCoord.y >= 0.0) {
    vec4 texColor = texture2D(u_texSampler, texCoord);
    gl_FragColor = mix(vColor, texColor, texColor.a);
    // gl_FragColor = texColor;
  }
}