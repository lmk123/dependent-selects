const webpack = require('webpack')
const OpenPack = require('openpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')

const config = {
  entry: path.resolve(__dirname, '../index'),
  output: {
    library: 'DependentSelects'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        include: [
          path.resolve(__dirname, '../index.js')
        ],
        loader: 'babel-loader'
      }
    ]
  },
  plugins: [
    new OpenPack(),
    new HtmlWebpackPlugin({
      inject: 'head',
      template: path.resolve(__dirname, '../dev.html'),
      chunksSortMode: 'dependency'
    }),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('development')
      }
    })
  ],
  watch: true,
  devServer: {
    noInfo: true,
    port: '13456',
    contentBase: false
  },
  devtool: 'source-map'
}

module.exports = config
