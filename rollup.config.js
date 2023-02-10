import {nodeResolve} from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'

const configs = [
  {
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
]

export default configs
