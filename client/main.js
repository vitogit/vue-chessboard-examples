import Vue from 'vue';
import VueRouter from 'vue-router';
import App from './App.vue';

import LobbyPage from './pages/Lobby';
import AboutPage from './pages/About';
import PlayAiPage from './pages/PlayAI';
import SettingsPage from './pages/Settings';

Vue.use(VueRouter);

/* eslint-disable no-new */
window.vm = new Vue({
  el: '#app',
  router: new VueRouter({
    routes: [
      { path: '/lobby', component: LobbyPage },
      { path: '/about', component: AboutPage },
      { path: '/ai', component: PlayAiPage },
      { path: '/settings', component: SettingsPage },
    ]
  }),
  render: h => h(App)
});
