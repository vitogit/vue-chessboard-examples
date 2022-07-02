<script>
import useWalletStore from '../stores/wallet';

export default {
  name: 'CryptoWallet',
  props: [ 'ethBalance', 'daiBalance' ]
}
</script>

<template>
  <div id='wallet'>
    <div id='balances'>
      <div class='coin'>ETH</div>
      <div class='balance'>{{ ethBalance }}</div>
      <div class='coin'>DAI</div>
      <div class='balance'>{{ daiBalance }}</div>
    </div>
  </div>
</template>

<style lang='scss'>
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
