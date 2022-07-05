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
    <div id='balances' class='flex-col'>
      <div class='flex center-align'>
        <div class='flex-shrink text-lg'>ETH</div>
        <div class='flex-1 text-ml flex-end'>{{ formatBalance(ethBalance) }}</div>
      </div>
      <div class='flex center-align'>
        <div class='flex-shrink text-lg'>DAI</div>
        <div class='flex-1 text-ml flex-end'>
          {{ formatBalance(daiBalance) }}
        </div>
      </div>
    </div>
  </div>
</template>
