import vertShader from '../shader.vert';
import fragShader from '../shader.frag';

import vertShaderCloud from '../shader-cloud.vert';
import fragShaderCloud from '../shader-cloud.frag';

const _shaders = Symbol('shaders');

export function createShaders(renderer) {
  renderer[_shaders] = [];
  for(let i = 0; i < 16; i++) {
    const defines = [];
    const hasTexture = !!(i & 0x1);
    const hasFilter = !!(i & 0x2);
    const hasGradient = !!(i & 0x4);
    const hasGlobalTransform = !!(i & 0x8);
    if(hasTexture) defines.push('#define TEXTURE 1');
    if(hasFilter) defines.push('#define FILTER 1');
    if(hasGradient) defines.push('#define GRADIENT 1');
    if(hasGlobalTransform) defines.push('#define GLOBALTRANSFORM 1');
    const prefix = `${defines.join('\n')}\n`;
    const samplerDef = [];
    if(hasTexture) {
      samplerDef.push('uniform sampler2D u_texSampler;');
    }
    // renderer.createProgram(prefix + samplerDef.join('\n') + fragShader, prefix + vertShader);
    renderer[_shaders][i] = [prefix + samplerDef.join('\n') + fragShader, prefix + vertShader];
  }
}

export function applyShader(renderer, {hasTexture = false, hasFilter = false, hasGradient = false, hasGlobalTransform = false} = {}) {
  const idx = hasTexture | ((hasFilter) << 1) | (hasGradient << 2) | (hasGlobalTransform << 3);
  let program = renderer[_shaders][idx];
  if(Array.isArray(program)) {
    program = renderer.createProgram(...program);
    renderer[_shaders][idx] = program;
  }

  if(renderer.program !== program) {
    renderer.useProgram(program, {
      a_color: {
        type: 'UNSIGNED_BYTE',
        normalize: true,
      },
    });
  }
}

const cloudShaders = [];
export function createCloudShaders(renderer) {
  for(let i = 0; i < 64; i++) {
    const defines = [];
    const hasTexture = !!(i & 0x1);
    const hasFilter = !!(i & 0x2);
    const hasGradient = !!(i & 0x4);
    const hasGlobalTransform = !!(i & 0x8);
    const hasCloudColor = !!(i & 0x10);
    const hasCloudFilter = !!(i & 0x20);
    if(hasTexture) defines.push('#define TEXTURE 1');
    if(hasFilter) defines.push('#define FILTER 1');
    if(hasGradient) defines.push('#define GRADIENT 1');
    if(hasGlobalTransform) defines.push('#define GLOBALTRANSFORM 1');
    if(hasCloudColor) defines.push('#define CLOUDCOLOR 1');
    if(hasCloudFilter) defines.push('#define CLOUDFILTER 1');
    const prefix = `${defines.join('\n')}\n`;
    const samplerDef = [];
    if(hasTexture) {
      samplerDef.push('uniform sampler2D u_texSampler;');
      for(let j = 0; j < 12; j++) {
        samplerDef.push(`uniform sampler2D u_texFrame${j};`);
      }
    }
    cloudShaders[i] = [prefix + samplerDef.join('\n') + fragShaderCloud, prefix + vertShaderCloud];
    // renderer.createProgram(prefix + samplerDef.join('\n') + fragShaderCloud, prefix + vertShaderCloud);
  }
}

export function applyCloudShader(renderer, {
  hasTexture = false, hasFilter = false, hasGradient = false,
  hasGlobalTransform = false, hasCloudColor = false, hasCloudFilter = false,
} = {}) {
  const idx = hasTexture | ((hasFilter) << 1) | (hasGradient << 2) | (hasGlobalTransform << 3)
    | (hasCloudColor << 4) | (hasCloudFilter << 5);
  let program = cloudShaders[idx];
  if(Array.isArray(program)) {
    program = renderer.createProgram(...program);
    cloudShaders[idx] = program;
  }

  if(renderer.program !== program) {
    renderer.useProgram(program, {
      a_color: {
        type: 'UNSIGNED_BYTE',
        normalize: true,
      },
      a_fillCloudColor: {
        type: 'UNSIGNED_BYTE',
        normalize: true,
      },
      a_strokeCloudColor: {
        type: 'UNSIGNED_BYTE',
        normalize: true,
      },
    });
  }
}
