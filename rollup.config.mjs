import module from 'module'
import path from 'path'
import commonjs from '@rollup/plugin-commonjs'
import {nodeResolve} from '@rollup/plugin-node-resolve'
import {terser} from 'rollup-plugin-terser'
import transformConstants from './script/babel-transform-constants.mjs'
import transformUndebug from './script/babel-transform-undebug.mjs'

// eslint-disable-next-line node/no-deprecated-api -- Remove when `@rollup/plugin-babel` supports ESM.
var requireUtil = module.createRequireFromPath(
  path.join(process.cwd(), 'rollup.config.mjs')
)
var babel = requireUtil('@rollup/plugin-babel').babel

// eslint-disable-next-line import/no-mutable-exports
var configs = []

if (process.env.BUILD === 'size') {
  configs.push({
    input: './lib/index.mjs',
    output: {
      file: './micromark.min.js',
      format: 'umd',
      name: 'micromark',
      freeze: false,
      plugins: [
        // Running terser twice shaves a couple of bytes off.
        /* eslint-disable camelcase */
        terser({output: {ascii_only: true}, mangle: {safari10: true}}),
        terser({output: {ascii_only: true}, mangle: {safari10: true}})
        /* eslint-enable camelcase */
      ]
    },
    plugins: [
      nodeResolve({browser: true}),
      babel({
        babelHelpers: 'external',
        skipPreflightCheck: true,
        plugins: ['babel-plugin-unassert', transformUndebug, transformConstants]
      }),
      commonjs({includes: /node_modules/})
    ]
  })
} else {
  configs.push({
    input: [
      './lib/index.mjs',
      './lib/stream.mjs',
      // Preserve compiled away constants for ecosystem packages
      './lib/character/codes.mjs',
      './lib/character/values.mjs',
      './lib/constant/constants.mjs',
      './lib/constant/types.mjs'
    ],
    output: [
      {
        dir: 'dist',
        format: 'esm',
        freeze: false,
        preserveModules: true,
        entryFileNames: '[name].mjs'
      },
      {
        dir: 'dist',
        format: 'cjs',
        exports: 'named',
        freeze: false,
        preserveModules: true,
        entryFileNames: '[name].js'
      }
    ],
    onwarn: warn,
    external: external,
    plugins: [
      babel({
        babelHelpers: 'external',
        skipPreflightCheck: true,
        plugins: ['babel-plugin-unassert', transformUndebug, transformConstants]
      })
    ]
  })
}

export default configs

function external(id) {
  return !id.startsWith('.') && !path.isAbsolute(id)
}

function warn(warning) {
  throw new Error(String(warning))
}
