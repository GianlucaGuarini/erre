import resolve from 'rollup-plugin-node-resolve'

export default {
  input: 'index.next.js',
  plugins: [
    resolve({
      jsnext: true
    })
  ],
  output: [
    {
      name: 'erre',
      file: 'index.cjs',
      format: 'umd'
    },
    {
      name: 'erre',
      file: 'index.js',
      format: 'es'
    }
  ]
}
