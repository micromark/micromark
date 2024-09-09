/**
 * @import Terser from '@rollup/plugin-terser'
 * @import {RollupOptions} from 'rollup'
 */

import {nodeResolve} from '@rollup/plugin-node-resolve'
import terser_ from '@rollup/plugin-terser'

// Note: `terser` is typed incorrectly.
const terser = /** @type {(typeof Terser)['default']} */ (
  /** @type {unknown} */ (terser_)
)

/** @type {RollupOptions} */
const config = {
  input: './packages/micromark/index.js',
  output: {
    compact: true,
    file: './micromark.min.js',
    freeze: false,
    plugins: [
      // Running terser twice shaves a couple of bytes off.
      /* eslint-disable camelcase */
      terser({mangle: {safari10: true}, output: {ascii_only: true}}),
      terser({mangle: {safari10: true}, output: {ascii_only: true}})
      /* eslint-enable camelcase */
    ]
  },
  plugins: [nodeResolve({browser: true})]
}

export default config
