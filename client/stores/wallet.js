import { defineStore } from 'pinia';

export default defineStore({
  id: 'wallet',
  state: () => ({
    installed: false,
    connected: false,
    address: null,
    balance: 0,
    // format (ticker, balance)
    //tokens: [],
  })
});