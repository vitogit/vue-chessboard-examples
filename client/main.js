import Vue from 'vue';
import VueCompositionAPI from '@vue/composition-api';
import VueRouter from 'vue-router';
import { createPinia, PiniaVuePlugin } from 'pinia';
import App from './App.vue';

import LobbyPage from './pages/UserLobby';
import ProfilePage from './pages/UserProfile';
import ChallengePage from './pages/ChallengeUser';
import AboutPage from './pages/AboutPage';
import PlayAiPage from './pages/PlayComputer';
import SettingsPage from './pages/SettingsPage';

Vue.use(VueRouter);
Vue.use(VueCompositionAPI);
Vue.use(PiniaVuePlugin);
const pinia = createPinia();

/* eslint-disable no-new */
window.vm = new Vue({
  el: '#app',
  router: new VueRouter({
    routes: [
      { path: '/', redirect: '/ai' },
      { path: '/lobby', component: LobbyPage },
      { path: '/profile/:address', component: ProfilePage },
      { path: '/challenge/:address', component: ChallengePage },
      { path: '/ai', component: PlayAiPage },
      { path: '/about', component: AboutPage },
      { path: '/settings', component: SettingsPage },
    ]
  }),
  pinia,
  render: h => h(App)
});
