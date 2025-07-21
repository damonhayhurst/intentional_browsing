/** @type {import('webpack').Configuration} */
import CopyPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import WebExtPlugin from 'web-ext-plugin';
import webpack from 'webpack';
import Dotenv from 'dotenv-webpack';
import path, { dirname } from 'path';
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
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@transformers': path.resolve(__dirname, 'node_modules/@huggingface/transformers'),
      '@huggingface/transformers': path.resolve(__dirname, 'node_modules/@huggingface/transformers')
    }
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
      firefox: '/Applications/Firefox\ Developer\ Edition.app/Contents/MacOS/firefox',
      devtools: true,
      sourceDir: path.resolve(__dirname, 'dist'),
      buildPackage: true,
      firefoxProfile: '/Users/damon/Library/Application\ Support/Firefox/Profiles/d6vpdd29.dev-edition-default'
    }),
    new Dotenv({
      path: '.env',
      safe: true
    })
  ],
  entry: {
    content: ['./src/js/content.ts'],
    background: ['./src/js/background.ts'],
    page: ['./src/js/page.ts'],
    popup: ['./src/js/popup.ts'],
    options: ['./src/js/options.ts']
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      },
      {
        test: /\.txt$/,
        use: 'raw-loader'
      }
    ]
  },
  optimization: {
    minimize: false
  }
};
