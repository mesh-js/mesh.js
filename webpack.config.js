const webpack = require('webpack');
const path = require('path');
const fs = require('fs');

module.exports = function (env = {}) {
  let babelConf;

  const babelRC = env.esnext ? './.es6.babelrc' : './.babelrc';
  if(fs.existsSync(babelRC)) {
    babelConf = JSON.parse(fs.readFileSync(babelRC));
    babelConf.babelrc = false;
  }

  return {
    mode: env.mode || 'none',
    entry: './src/index',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'mesh.js',
      publicPath: '/js/',
      library: 'meshjs',
      libraryTarget: 'umd',
      globalObject: 'this',
      // libraryExport: 'default',
    },
    resolve: {
      alias: {
        'gl-renderer': 'gl-renderer/src',
      },
    },

    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules\/(?!gl-renderer).*/,
          use: {
            loader: 'babel-loader',
            options: babelConf,
          },
        },
        {
          test: /\.(frag|vert|glsl)$/,
          use: {
            loader: 'raw-loader',
            options: {},
          },
        },
      ],

      /* Advanced module configuration (click to show) */
    },

    externals: {

    },
    // Don't follow/bundle these modules, but request them at runtime from the environment

    stats: 'errors-only',
    // lets you precisely control what bundle information gets displayed

    devServer: {
      contentBase: path.join(__dirname, env.server || '.'),
      compress: true,
      port: 3000,
      hot: true,
      // ...
    },

    plugins: [
      new webpack.DefinePlugin({
        __DEV__: env.mode !== 'production',
      }),
      new webpack.HotModuleReplacementPlugin({
        multiStep: true,
      }),
    ],
    // list of additional plugins

    /* Advanced configuration (click to show) */
  };
};
