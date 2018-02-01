const path = require('path');
const merge = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {

  devtool: 'inline-source-map',

  devServer: {
    host: 'localhost',
    port: 8080,
    contentBase: path.join(__dirname, 'dist'),
    inline: true, // live reloading
    stats: {
      colors: true,
      reasons: true,
      chunks: false,
      modules: false
    }
  }

});

