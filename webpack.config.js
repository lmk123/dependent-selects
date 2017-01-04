const webpack = require('webpack')
const IS_PRODUCTION = !!process.env.PRODUCTION

const config = {
  entry: './index',
  output: {
    path: './dist',
    filename: IS_PRODUCTION ? 'multilevel.min.js' : 'multilevel.js',
    library: 'MultiLevel',
    libraryTarget: 'umd'
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: IS_PRODUCTION ? '"production"' : '"development"'
      }
    })
  ],
  devtool: '#source-map'
}

if (IS_PRODUCTION) {
  config.plugins.push(
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    })
  )
}

module.exports = config
