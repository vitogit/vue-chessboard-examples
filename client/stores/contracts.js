import { defineStore } from 'pinia';

// TODO At some point you'll need to keep the challenges and games in here
export default defineStore({
  id: 'contracts',
  state: () => ({
    lobby: null,
    //challenges: {},
    //games: {},
    listeners: {}
  })
});
