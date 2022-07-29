<script>
import humanizeDuration from 'humanize-duration';
import ethMixin from '../mixins/ethereum';
import gameMixin from '../mixins/games';
import WhiteRook from '../assets/icons/whiterook.svg';
import BlackRook from '../assets/icons/blackrook.svg';

export default {
  name: 'GameCard',
  props: {
    contract: { type: String },
  },
  components: { WhiteRook, BlackRook },
  mixins: [ ethMixin, gameMixin ],
  computed: {
    displayTTM() { return humanizeDuration(this.timeUntilExpiry*1000, { largest: 1 }) }
  },
  created() {
    this.initGame(this.contract);
  }
}
</script>

<template>
  <div id='game-card' class='pad bordered text-center flex-col align-center'>
    <WhiteRook v-if='isWhitePlayer' />
    <BlackRook v-else />

    <div class='text-sm'>
      <div>{{ truncAddress(opponent) }}</div>
      <div>{{ displayTTM }}</div>
    </div>

    <div id='status' class='flex-end'>
      <div id='circle' :class='isCurrentMove ? "player" : "opponent"' />
    </div>
  </div>
</template>

<style lang='scss'>
#game-card {
  width: 5em;
  height: 5em;

  #status {
    position: absolute;
    width: 4.5em;

    #circle {
      height: .5em;
      width: .5em;
      background-color: green;
      border-radius: 50%;
    }
    #circle.player { background-color: green }
    #circle.opponent { background-color: orange }
  }
}
</style>
