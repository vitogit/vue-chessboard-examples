<template>
  <button v-if='isInstalled === false' href='https://metamask.io/download/'>Install Metamask</button>
  <button v-else-if='isConnected === false' @click='connectWallet'>Connect Wallet</button>
  <button v-else @click='clicked'><slot>Connected</slot></button>
</template>

<script>
export default {
  name: 'ConnectWallet',
  props: [ 'isInstalled' , 'isConnected', 'onClick' ],
  methods: {
    clicked() {
      this.onClick();
    }
  }
}
</script>
