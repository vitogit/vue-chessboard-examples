import { defineStore } from 'pinia';

export default defineStore({
  id: 'wallet',
  state: () => ({
    installed: false,
    connected: false,
    address: null,
    signer: null,
    provider: null,
    ethBalance: 0,
    daiBalance: 0
  })
});
