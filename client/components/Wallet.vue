<script>
import ConnectWallet from './ConnectWallet.vue';

export default {
  name: 'Wallet',
  components: {
    ConnectWallet
  },
  data () {
    return {
      walletConnected: false,
      ethBalance: 0,
      daiBalance: 0
    }
  },
  mounted () {
    if (typeof window.ethereum === 'undefined') {
      alert('Metamask is NOT installed!');
      return;
    }
    this.walletInstalled = true;
    this.walletConnected = ethereum.isConnected();
  }
}
</script>

<template>
  <div id='wallet'>
    <div id='balances'>
      <div class='coin'>ETH</div>
      <div class='balance'>0.000</div>
      <div class='coin'>DAI</div>
      <div class='balance'>0.000</div>
    </div>

    <ConnectWallet class='outline font-blocky' />
  </div>
</template>

<style lang='scss'>
@import '~bourbon-neat';

#balances {
  font-size: 24px;
  font-weight: bold;
  @include grid-container;
  $balances: (columns: 3, gutter: 23px);

  .coin {
    @include grid-column(2, $balances);
  }

  .balance {
    @include grid-column(1, $balances);
  }
}
</style>
