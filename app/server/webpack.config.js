const path = require('path')

module.exports = {
  target: 'node', // since this is a general webpack config, we need to say it's for node
  entry: './build/server/src/index.js', // after typescrypt compiler runs
  output: {
    path: path.join(__dirname, 'bundle'), // this can be any path and directory you want
    filename: 'index.js',
  },
  optimization: {
    minimize: true,
  },
}
