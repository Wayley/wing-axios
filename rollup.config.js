import { terser } from 'rollup-plugin-terser';
export default {
  input: 'src/index.js',
  output: [
    {
      file: 'dist/wing-axios.js',
      name: 'wing-axios',
      format: 'umd',
    },
    {
      file: 'dist/wing-axios.es.js',
      format: 'es',
    },
    {
      file: 'dist/wing-axios.amd.js',
      format: 'amd',
    },
    {
      file: 'dist/wing-axios.cjs.js',
      format: 'cjs',
    },
  ],
  plugins: [terser()],
};
