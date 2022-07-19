const path = require('path');

module.exports = {
  publicPath: '/',
  chainWebpack: conf => {
    conf.entry('app')
        .clear()
        .add('./client/main.js')
        .end();
    conf.resolve
        .alias
        .set('@', path.join(__dirname, './client'))
    conf.module.rule('svg').clear();
  },
  configureWebpack: {
    module: {
      rules: [{
        test: /bytesize-icons\/.*\.svg$/,
        loader: 'vue-svg-loader'
      }]
    }
  }
}
