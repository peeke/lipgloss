// rollup.config.js
import resolve from 'rollup-plugin-node-resolve'
import babel from 'rollup-plugin-babel'

const plugins = () => ([
  resolve(),
  babel({
    exclude: 'node_modules/**' // only transpile our source code
  })
])

const configFor = file => ({
  input: `src/examples/js/${file}`,
  output: {
    file: `examples/statics/js/${file}`,
    format: 'iife'
  },
  plugins: plugins()
})

export default [
  configFor('basic.js'),
  configFor('animated-transition.js'),
  configFor('lightbox.js'),
  configFor('sequenced.js')
]