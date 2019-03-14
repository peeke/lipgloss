// rollup.config.js
import resolve from 'rollup-plugin-node-resolve'
import babel from 'rollup-plugin-babel'
import { uglify } from 'rollup-plugin-uglify'

export default [
  {
    input: 'src/index.js',
    output: {
      file: 'dist/index.js',
      format: 'umd',
      name: 'lipgloss'
    },
    plugins: [
      resolve(),
      babel()
    ]
  },
  {
    input: 'src/index.js',
    output: {
      file: 'dist/index.min.js',
      format: 'umd',
      name: 'lipgloss'
    },
    plugins: [
      resolve(),
      babel(),
      uglify({
        mangle: {
          properties: true,
        }
      })
    ]
  }
]