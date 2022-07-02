<script>
export default {
  name: 'CryptoWallet',
  components: {
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
  </div>
</template>

<style lang='scss'>
@import '~bourbon-neat';

#balances {
  display: flex;
  flex-wrap: wrap;

  * {
    font-size: 24px;
    font-weight: bold;
  }

  .coin {
    flex-basis: 50%;
  }

  .balance {
    flex-basis: 50%;
    justify-content: flex-end;
    text-align: right;
  }
}
</style>
