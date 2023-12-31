/** @type {import('webpack').Configuration} */
import WebExtPlugin from 'web-ext-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import webpack from 'webpack';

import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default {
  mode: 'development',
  devtool: 'source-map',
  output: {
    filename: 'js/[name].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  plugins: [
    new webpack.DefinePlugin({
      DEBUG: true
    }),
    new HtmlWebpackPlugin({
      template: './src/html/page.html',
      filename: 'html/page.html',
      inject: 'body',
      chunks: ['page']
    }),
    new HtmlWebpackPlugin({
      template: './src/html/popup.html',
      filename: 'html/popup.html',
      inject: 'body',
      chunks: ['popup']
    }),
    new HtmlWebpackPlugin({
      template: './src/html/options.html',
      filename: 'html/options.html',
      inject: 'body',
      chunks: ['options']
    }),
    new CopyPlugin({
      patterns: [
        "manifest.json"
      ]
    }),
    new WebExtPlugin({
        firefox: 'firefoxdeveloperedition',
        devtools: true,
        sourceDir: path.resolve(__dirname, 'dist'),
        buildPackage: true,
        firefoxProfile: '/Users/damon/Library/Application\ Support/Firefox/Profiles/d6vpdd29.dev-edition-default'
    })
  ],
  entry: {
    content: ['./src/js/content.js'],
    background: ['./src/js/background.js'],
    page: ['./src/js/page.js'],
    popup: ['./src/js/popup.js'],
    options: ['./src/js/options.js']
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      }
    ]
  },
  optimization: {
    minimize: false
  }
};