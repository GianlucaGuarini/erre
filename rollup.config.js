import resolve from 'rollup-plugin-node-resolve'

export default {
  input: 'index.next.js',
  name: 'erre',
  plugins: [
    resolve({
      jsnext: true
    })
  ],
  output: [
    {
      file: 'erre.js',
      format: 'umd'
    }
  ]
}