import resolve from 'rollup-plugin-node-resolve'

export default {
  input: 'index.next.js',
  name: 'erre',
  plugins: [
    resolve({
      jsnext: true
    })
  ],
  targets: [

    {
      dest: 'erre.js',
      format: 'umd'
    }
  ]
}