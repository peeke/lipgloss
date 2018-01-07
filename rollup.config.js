// rollup.config.js
import resolve from 'rollup-plugin-node-resolve'
import babel from 'rollup-plugin-babel'
import uglify from 'rollup-plugin-uglify'

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/index.min.js',
    format: 'umd',
    name: 'lipgloss'
  },
  plugins: [
    resolve(),
    babel({
      exclude: 'node_modules/**' // only transpile our source code
    }),
    uglify({
      compress: {
        drop_console: true,
        passes: 2,
        unsafe: true,
        unsafe_comps: true,
        unsafe_math: true
      }
    })
  ]
}