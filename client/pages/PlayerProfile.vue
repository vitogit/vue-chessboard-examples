<script>
import ethMixin from '../mixins/ethereum';
import walletMixin from '../mixins/wallet';
import useWalletStore from '../stores/wallet';

export default {
  name: 'PlayerProfile',
  mixins: [ ethMixin, walletMixin ],
  data() {
    return {
      player: null
    };
  },
  created() {
    let { player } = this.$route.params;
    this.player = player;
  }
}
</script>

<template>
  <div id='profile'>
    <div class='text-xl margin-tb'>Profile</div>

    <div id='player-record' class='flex flex-around'>
      <div class='bordered container flex-1'>
        <div class='label'>Games</div>
        <div class='info'>0</div>
      </div>
      <div class='bordered container flex-1'>
        <div class='label'>Wins</div>
        <div class='info'>0</div>
      </div>
      <div class='bordered container flex-1'>
        <div class='label'>Losses</div>
        <div class='info'>0</div>
      </div>
      <div class='bordered container flex-1'>
        <div class='label'>Draws</div>
        <div class='info'>0</div>
      </div>
    </div>

    <div id='player-info' class='flex center-align margin-lg'>
      <div class='flex-1 text-ml'>Address</div>
      <div class='flex-1 flex-end text-md'>{{ truncAddress(player) }}</div>
    </div>

    <div id='actions' class='flex margin-lg'>
      <div class='flex-1 flex-start'>
        <button
          @click='$router.push("/new-challenge/"+player)'
        >Challenge</button>
      </div>
      <div id='block-controls' class='flex-1 flex-end'>
        <button class='margin-rl' disabled>Block</button>
        <button disabled>Report</button>
      </div>
    </div>

    <div id='match-history'>
      <div class='text-lg margin-lg-tb'>Match History</div>
    </div>

    <div id='player-history'>
      <div class='text-lg margin-lg-tb'>Player History</div>
    </div>
  </div>
</template>

<style lang='scss'>
@import '../styles';

#profile {
  #player-record {
    > .container {
      @extend .margin-lg-rl;
      @extend .padded;
      @extend .text-center;
      min-width: 3em;
    }
  }
}
</style>
