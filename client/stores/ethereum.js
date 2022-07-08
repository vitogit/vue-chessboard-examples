import { defineStore } from 'pinia';

export default defineStore({
  id: 'ethereum',
  state: () => ({
    signer: null,
    provider: null,
    //network: null,
    //chainId: null
  })
});
