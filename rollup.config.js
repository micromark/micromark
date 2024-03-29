import {nodeResolve} from '@rollup/plugin-node-resolve'
import terser_ from '@rollup/plugin-terser'

// Note: `terser` is typed incorrectly.
const terser = /** @type {import('@rollup/plugin-terser')['default']} */ (
  /** @type {unknown} */ (terser_)
)

/** @type {import('rollup').RollupOptions} */
const config = {
  input: './packages/micromark/index.js',
  output: {
    file: './micromark.min.js',
    compact: true,
    freeze: false,
    plugins: [
      // Running terser twice shaves a couple of bytes off.
      /* eslint-disable camelcase */
      terser({output: {ascii_only: true}, mangle: {safari10: true}}),
      terser({output: {ascii_only: true}, mangle: {safari10: true}})
      /* eslint-enable camelcase */
    ]
  },
  plugins: [nodeResolve({browser: true})]
}

export default config
