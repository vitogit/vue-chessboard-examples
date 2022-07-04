<script>
import useWalletStore from '../stores/wallet';
import { ethers } from 'ethers';
//import { formatUnits } from 'ethers/lib/utils';
import { formatEther, commify } from 'ethers/lib/utils';

export default {
  name: 'CryptoWallet',
  props: [ 'ethBalance', 'daiBalance' ],
  methods: {
    formatBalance(balance) {
      return parseFloat(formatEther(balance)).toFixed(3);
    }
  }
}
</script>

<template>
  <div>
    <div id='balances'>
      <div class='container'>
        <div class='coin'>ETH</div>
        <div class='balance'>{{ formatBalance(ethBalance) }}</div>
      </div>
      <div class='container'>
        <div class='coin'>DAI</div>
        <div class='balance'>{{ formatBalance(daiBalance) }}</div>
      </div>
    </div>
  </div>
</template>

<style lang='scss'>
#balances {
  * {
    font-size: 24px;
    font-weight: bold;
  }

  .container {
    flex: 1;
    display: flex;
    .coin {
      flex-shrink: 1;
    }

    .balance {
      flex-grow: 1;
      justify-content: flex-end;
      text-align: right;
    }
  }
}
</style>
