const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    bundle: [
      './src/index.js'
    ],
  },
  output: {
    filename: 'bundle.js',
    path: path.join(__dirname, 'public'),
    publicPath: '/'
  },
  devtool: 'eval',
  resolve: {
    extensions: ['.js']
  },
  module: {
    rules: [
      { test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader"
      },
      {
        test: /\.scss$/,
        loaders: ['style-loader', 'css-loader', 'sass-loader']
      },
      {
        test: /\.css$/,
        loaders: ['style-loader', 'css-loader']
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2)$/,
        loader: "file-loader",
        options: {
          name: "assets/fonts/[name].[ext]"
        }
      }
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'index.html',
    }),
    new webpack.HotModuleReplacementPlugin(),
    new CopyWebpackPlugin([{ from: 'src/asset', to: 'asset' }]),
  ],
};