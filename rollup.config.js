import commonjs from '@rollup/plugin-commonjs'
import {nodeResolve} from '@rollup/plugin-node-resolve'
import {babel} from '@rollup/plugin-babel'
import {terser} from 'rollup-plugin-terser'

const config = {
  input: './lib/index.js',
  output: {
    file: './micromark.min.js',
    format: 'umd',
    name: 'Micromark',
    plugins: [
      // Took from here https://github.com/browserify/tinyify/blob/default/index.js
      terser({
        // No need to mangle here, will do that at the end.
        mangle: false,
        output: {
          // eslint-disable-next-line camelcase
          ascii_only: true
        }
      }),
      terser({
        output: {
          // eslint-disable-next-line camelcase
          ascii_only: true
        },
        mangle: {
          safari10: true
        }
      })
    ]
  },
  plugins: [
    nodeResolve({browser: true}),
    babel({
      babelHelpers: 'bundled',
      plugins: [
        'babel-plugin-unassert',
        './script/babel-transform-undebug.js',
        './script/babel-transform-constants.js'
      ]
    }),
    commonjs()
  ]
}

export default config
