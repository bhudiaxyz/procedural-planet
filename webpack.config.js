const path = require('path');
const glob = require('glob');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const IS_DEV = process.env.NODE_ENV === 'dev';

const config = {
  mode: IS_DEV ? 'development' : 'production',
  devtool: IS_DEV ? 'eval' : 'source-map',

  entry: {
    main: path.join(__dirname, 'src', 'ts', 'index.ts'),
  },
  output: {
    filename: 'js/[name].[contenthash].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.(ts|js)$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'sass-loader',
        ],
      },
      {
        test: /\.(gif|png|jpe?g|svg)$/i,
        type: 'asset',
        parser: {
          dataUrlCondition: { maxSize: 8192 },
        },
        generator: {
          filename: 'assets/textures/[name][ext]',
        },
      },
      {
        test: /\.(glsl|frag|vert)$/,
        include: [path.join(__dirname, 'src', 'ts', 'shaders')],
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
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        { from: './src/assets', to: 'assets' },
      ],
    }),
    new MiniCssExtractPlugin({
      filename: IS_DEV ? 'css/[name].css' : 'css/[name].[contenthash].css',
      chunkFilename: 'css/[id].css',
    }),
  ],
  performance: {
    // three.js + WebGL assets will always exceed webpack's 244KB default
    maxAssetSize: 4 * 1024 * 1024,
    maxEntrypointSize: 4 * 1024 * 1024,
  },
  devServer: {
    static: path.join(__dirname, 'src'),
  },
  optimization: {
    runtimeChunk: 'single',
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /node_modules/,
          chunks: 'initial',
          name: 'vendor',
          priority: 10,
          enforce: true,
        },
      },
    },
    minimizer: ['...'],
  },
};

if (!IS_DEV) {
  const TerserPlugin = require('terser-webpack-plugin');
  const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

  config.optimization.minimizer = [
    new TerserPlugin(),
    new CssMinimizerPlugin(),
  ];
}

const files = glob.sync('./src/templates/*.html');

files.forEach(file => {
  config.plugins.push(
    new HtmlWebPackPlugin({
      filename: path.basename(file),
      template: file,
      favicon: path.resolve(__dirname, './src/assets/favicon.ico'),
      minify: !IS_DEV,
    })
  );
});

module.exports = config;
