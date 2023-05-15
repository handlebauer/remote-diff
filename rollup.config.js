import pkg from './package.json' assert { type: 'json' }

const input = './src/index.js'

// eslint-disable-next-line import/no-default-export
export default {
  input,
  external: ['fs/promises', 'cheerio', 'diff'],
  output: [
    { file: pkg.main, format: 'cjs' },
    { file: pkg.module, format: 'esm' },
  ],
}
