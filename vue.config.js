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
  }
}
