import path from 'path'
import commonjs from '@rollup/plugin-commonjs'
import {nodeResolve} from '@rollup/plugin-node-resolve'
import babel from '@rollup/plugin-babel'
import {terser} from 'rollup-plugin-terser'
import transformConstants from './script/babel-transform-constants.mjs'
import transformUndebug from './script/babel-transform-undebug.mjs'

const configs = []

if (process.env.BUILD === 'dist') {
  configs.push({
    input: ['./lib/index.js', './lib/stream.js'],
    output: [
      {
        dir: 'dist',
        format: 'esm',
        preserveModules: true,
        entryFileNames: '[name].mjs'
      },
      {
        dir: 'dist',
        format: 'cjs',
        exports: 'named',
        preserveModules: true,
        entryFileNames: '[name].js'
      }
    ],
    onwarn: (warning) => {
      throw Error(warning.toString())
    },
    external: (id) => !id.startsWith('.') && !path.isAbsolute(id),
    plugins: [
      nodeResolve({browser: true}),
      babel.babel({
        babelHelpers: 'bundled',
        plugins: ['babel-plugin-unassert', transformUndebug, transformConstants]
      }),
      commonjs()
    ]
  })
}

if (process.env.BUILD === 'size') {
  configs.push({
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
      babel.babel({
        babelHelpers: 'bundled',
        plugins: ['babel-plugin-unassert', transformUndebug, transformConstants]
      }),
      commonjs()
    ]
  })
}

export default configs
