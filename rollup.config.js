import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import {string} from 'rollup-plugin-string';
import {terser} from 'rollup-plugin-terser';

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
    {
      format: 'umd',
      name: 'meshjs',
      sourcemap: true,
      file: 'dist/mesh.min.js',
      plugins: [terser()],
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
