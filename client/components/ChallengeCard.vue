<script>
import ethMixin from '../mixins/ethereum';

export default {
  name: 'UserChallengeOptions',
  props: {
    color: { type: String, default: 'white' },
    address: {
      type: String,
      default: '0x0000000000000000000000000000000000000000'
    },
    balance: [ Number, Object, BigInt ],
    wager: [ Number, Object, BigInt ],
    timePerMove: [ Number, Object ],
    token: { type: String, default: 'eth' }
  },
  mixins: [ ethMixin ]
}
</script>

<template>
  <div id='challenge-card' class='pad flex-col'>
    <div id='header' class='margin-tb flex-center'>
      <slot />
    </div>

    <div id='player-color' class='margin-tb pad text-center'>
      <div class='bold text-ml text-sentance'>{{ color }}</div>
      <div class='text-md'>{{ truncAddress(address) }}</div>
    </div>

    <div v-if='balance' class='margin margin-sm-tb flex'>
      <div class='center-align text-md'>Balance</div>
      <div class='flex-1 flex-end center-align'>
        <div class='text-md'>
          {{ formatBalance(balance) }}
        </div>
        <div class='text-md margin-rl'>
          {{ token.toUpperCase() }}
        </div>
      </div>
    </div>

    <div v-if='wager' class='margin margin-sm-tb flex'>
      <div class='center-align text-md'>Wager</div>
      <div class='flex-1 flex-end center-align'>
        <div class='text-md'>
          {{ formatBalance(wager) }}
        </div>
        <div class='text-md margin-rl'>
          {{ token.toUpperCase() }}
        </div>
      </div>
    </div>

    <div v-if='timePerMove' class='margin margin-sm-tb flex'>
      <div class='center-align text-md'>Time</div>
      <div class='flex-1 flex-end center-align'>
        <div class='text-md'>
          {{ timePerMove }}
        </div>
        <div class='text-md margin-rl'>
          Min
        </div>
      </div>
    </div>
  </div>
</template>

<style lang='scss'>
@import '../styles';

#challenge-card {
  max-width: 10.5em;
  @extend .bordered;
  @extend .margin-lg-rl;
  @extend .margin-tb;

  #header {
    @extend .bold;
    @extend .text-lg;
  }

  #player-color {
    @extend .bordered;
    div {
      padding-top: .1em;
      padding-bottom: .1em;
    }
  }
}
</style>
