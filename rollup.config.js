import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import {string} from 'rollup-plugin-string';

const pkg = require('./package.json');

/** @type {import('rollup').RollupOptions} */
const config = {
  input: './src/index',
  output: [
    {
      format: 'es',
      sourcemap: true,
      file: pkg.module,
    },
    {
      format: 'umd',
      name: 'meshjs',
      sourcemap: true,
      file: pkg.main,
    },
  ],
  plugins: [
    babel({
      babelHelpers: 'runtime',
      skipPreflightCheck: true,
    }),
    resolve(),
    commonjs({
      transformMixedEsModules: true,
    }),
    string({
      include: ['**/*.frag', '**/*.vert', '**/*.glsl'],
    }),
  ],
  watch: {
    clearScreen: false,
  },
};

export default config;
