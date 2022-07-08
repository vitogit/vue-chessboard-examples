<script>
import { formatEther } from 'ethers/lib/utils';
import ethMixin from '../mixins/ethereum';

export default {
  name: 'CryptoWallet',
  props: [ 'ethBalance' ],
  mixins: [ ethMixin ]
}
</script>

<template>
  <div>
    <div id='balances' class='flex-col'>
      <div class='flex center-align'>
        <div class='flex-shrink text-lg'>ETH</div>
        <div class='flex-1 text-ml flex-end'>{{ formatBalance(ethBalance) }}</div>
      </div>
    </div>
  </div>
</template>
