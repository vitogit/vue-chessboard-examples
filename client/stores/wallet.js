import { defineStore } from 'pinia';

export default defineStore({
  id: 'wallet',
  state: () => ({
    isInstalled: true,
    isConnected: false,
    address: null,
    ethBalance: 0,
    daiBalance: 0
  })
});
