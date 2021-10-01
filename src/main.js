import Vue from 'vue'
import App from './App.vue'

/* eslint-disable no-new */
window.vm = new Vue({
  el: '#app',
  render: h => h(App)
})
