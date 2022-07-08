<script>
export default {
  name: 'ConnectWallet',
  props: [ 'isInstalled' , 'isConnected', 'onConnect', 'onClick' ],
  methods: {
    // NOTE There's no built-in way to disconnect from a wallet; you
    //      have to do that inside metamask.  Rather, there should be
    //      a feature to bring up some sort of account switcher for
    //      people who have multiple connected wallets.
    // FIXME This might be broken.  Test again with a browser which
    //       hasn't connected before.
    connectWallet() {
      console.log('Connecting to metamask');
      if (typeof window.ethereum === 'undefined') {
        alert('Metamask is not installed!');
      } else if (this.isConnected === true) {
        alert('Metamask is already connected');
      } else {
        ethereum.request({ method: 'eth_requestAccounts' });
        this.isConnected = true;
      }
    },
    connect() { this.onConnect() },
    clicked() { this.onClick() }
  }
}
</script>

<template>
  <button v-if='isInstalled === false' href='https://metamask.io/download/'>Install Metamask</button>
  <button v-else-if='isConnected === false' @click='connect'>Connect Wallet</button>
  <button v-else @click='clicked'><slot>Connected</slot></button>
</template>
