import Vue from 'vue';
import VueCompositionAPI from '@vue/composition-api';
import VueRouter from 'vue-router';
import { createPinia, PiniaVuePlugin } from 'pinia';
import App from './App.vue';

import LobbyPage from './pages/UserLobby';
import ProfilePage from './pages/PlayerProfile';
//import UserProfile from './pages/UserProfile';
import PendingChallenge from './pages/PendingChallenge';
import ChessGame from './pages/ChessGame';
import AboutPage from './pages/AboutPage';
import PlayAiPage from './pages/PlayComputer';
import UnderConstruction from './components/UnderConstruction';

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
      { path: '/profile/:address', component: ProfilePage },
      { path: '/challenge/:contract', component: PendingChallenge },
      { path: '/game/:contract', component: ChessGame },
      { path: '/about', component: AboutPage },
      { path: '/market', component: UnderConstruction },
      { path: '/settings', component: UnderConstruction },
    ]
  }),
  pinia,
  render: h => h(App)
});
