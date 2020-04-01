const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');

function dir_path(dir) {
  return path.join(__dirname, dir)
}

module.exports = {

  entry: {
    home: path.join(__dirname, 'src', 'js', 'index.js')
  },

  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].[chunkhash].bundle.js',
    sourceMapFilename: '[file].map'
  },

  target: 'web',
  devtool: 'source-map',
  devServer: {
    port: 7000
  },

  module: {
    rules: [
      // rule for .json files
      {
        test: /\.(json)$/,
        use: {loader: 'json-loader'}
      },

      // rule for .js/.jsx files
      {
        test: /\.(js|jsx)$/,
        include: [path.join(__dirname, 'src', 'js')],
        exclude: [path.join(__dirname, 'node_modules')],
        use: {loader: 'babel-loader'}
      },

      // rule for .css files
      {
        test: /\.css$/,
        include: [path.join(__dirname, 'src', 'css')],
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: ['css-loader']
        })
      },

      // rule for .sass files
      {
        test: /\.(sass|scss)$/,
        include: [path.join(__dirname, 'src', 'sass'), path.join(__dirname, 'src', 'scss')],
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: ['css-loader', 'sass-loader']
        })
      },

      // rules for .glsl files (shaders)
      {
        test: /\.(glsl|frag|vert)$/,
        include: [path.join(__dirname, 'src', 'glsl')],
        exclude: /node_modules/,
        use: [
          'raw-loader',
          {
            loader: 'glslify-loader',
            options: {
              transform: [
                ['glslify-hex', { 'option-1': true, 'option-2': 42 }]
              ]
            }
          }
        ]
      },

      // rule for textures (images)
      {
        test: /\.(jpe?g|png)$/i,
        include: [path.join(__dirname, 'src', 'textures')],
        loader: [
          'file-loader', {
            loader: 'image-webpack-loader',
            query: {
              progressive: true,
              optimizationLevel: 7,
              interlaced: false,
              pngquant: {
                quality: '65-90',
                speed: 4
              }
            }
          }
        ]
      }
    ]
  },

  plugins: [
    new CleanWebpackPlugin(
      ['dist'], {
        root: __dirname,
        exclude: ['favicon.ico'],
        verbose: true
      }
    ),
    new ExtractTextPlugin('[name].[chunkhash].bundle.css'),
    new HtmlWebpackPlugin({
      favicon: 'favicon.ico',
      template: path.join(__dirname, 'src', 'templates', 'index.html'),
      hash: true,
      filename: 'index.html',
      inject: true,
      chunks: ['commons', 'home'],
      minify: {
        collapseWhitespace: true,
        collapseInlineTagWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true
      }
    }),
    new webpack.HashedModuleIdsPlugin(),
    new CompressionPlugin({
      filename: '[path].gz[query]',
      algorithm: 'gzip',
      test: /\.(js|css|html)$/,
      threshold: 10240,
      minRatio: 0.8
    })
  ],

  performance: {
    hints: 'warning'
  },

  optimization: {
    splitChunks: {
      name: "commons",
      minChunks: 3,
      filename: '[name].[chunkhash].bundle.js'
    }
  },

};
