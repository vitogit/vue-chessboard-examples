import Vue from 'vue';
import VueCompositionAPI from '@vue/composition-api';
import VueRouter from 'vue-router';
import { createPinia, PiniaVuePlugin } from 'pinia';
import App from './App.vue';

import LobbyPage from './pages/UserLobby';
import ProfilePage from './pages/PlayerProfile';
//import UserProfile from './pages/UserProfile';
import ChallengePage from './pages/ChallengeUser';
import PendingChallenge from './pages/PendingChallenge';
import ModifyChallenge from './pages/ModifyChallenge';
import ChessGame from './pages/ChessGame';
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
      { path: '/ai', component: PlayAiPage },
      { path: '/lobby', component: LobbyPage },
      { path: '/profile/:player', component: ProfilePage },
      { path: '/new-challenge/:player', component: ChallengePage },
      { path: '/challenge/:contract', component: PendingChallenge },
      { path: '/modify/:contract', component: ModifyChallenge },
      { path: '/game/:contract', component: ChessGame },
      { path: '/about', component: AboutPage },
      { path: '/settings', component: SettingsPage },
    ]
  }),
  pinia,
  render: h => h(App)
});
