const path = require('path')
const buble = require('rollup-plugin-buble')
const resolve = require('rollup-plugin-node-resolve')
const commonjs = require('rollup-plugin-commonjs')
const uglify = require('rollup-plugin-uglify')
const pkg = require('../package.json')
const FORMAT = process.env.FORMAT

const config = {
  entry: path.resolve(__dirname, '../index.js'),
  banner: [
    '/*!',
    ' * dependent-selects.js v' + pkg.version,
    ' * https://github.com/lmk123/dependent-selects',
    ' * Released under the MIT License.',
    ' */'
  ].join('\n'),
  plugins: [
    buble()
  ]
}

switch (FORMAT) {
  case 'cjs':
    config.format = 'cjs'
    config.dest = 'dist/dependent-selects.common.js'
    break
  case 'es':
    config.format = 'es'
    config.dest = 'dist/dependent-selects.esm.js'
    break
  default:
    config.format = 'umd'
    config.moduleName = 'DependentSelects'
    if (process.env.MIN) {
      config.dest = 'dist/dependent-selects.min.js'
      config.plugins.push(uglify({
        output: {
          comments: /^!/
        }
      }))
    } else {
      config.dest = 'dist/dependent-selects.js'
    }
    break
}

if (config.format === 'umd') {
  config.plugins.unshift(resolve(), commonjs())
} else {
  config.external = ['tiny-emitter']
}

module.exports = config
