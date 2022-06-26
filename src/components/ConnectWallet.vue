<template>
  <button v-if='isInstalled === false' href='https://metamask.io/download/'>Install Metamask</button>
  <button v-else-if='isConnected === false' @click='connectWallet'>Connect Wallet</button>
  <button v-else='isConnected === false' disabled>Connected</button>
</template>

<script>
export default {
  name: 'ConnectWallet',
  data () {
    return {
      isInstalled: false,
      isConnected: false
    }
  },
  methods: {
    connectWallet() {
      console.log('Connect to metamask');

      if (typeof window.ethereum === 'undefined') {
        alert('Metamask is not installed!');
      } else if (this.isConnected === true) {
        alert('Metamask is already connected');
      } else {
        ethereum.request({ method: 'eth_requestAccounts' });
        this.isConnected = true;
      }
    },
    // FIXME: There's no built-in way to disconnect from a wallet; you
    //        have to do that inside metamask.  Rather, there should be
    //        a feature to bring up some sort of account switcher for
    //        people who have multiple connected wallets.
  },
  mounted () {
      if (typeof window.ethereum === 'undefined') {
        console.log('Metamask is NOT installed!');
        return;
      } else {
        console.log('Metamask is installed!');
        this.isInstalled = true;
        this.isConnected = ethereum.isConnected();
        console.log(ethereum);
      }
  }
}
</script>
