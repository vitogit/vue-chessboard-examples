<script>
import humanizeDuration from 'humanize-duration';
import ethMixin from '../mixins/ethereum';
import challengeMixin from '../mixins/challenges';
import WhitePawn from '../assets/icons/whitepawn.svg';
import BlackPawn from '../assets/icons/blackpawn.svg';

export default {
  name: 'ChallengeCard',
  props: {
    contract: { type: String },
  },
  components: { WhitePawn, BlackPawn },
  mixins: [ ethMixin, challengeMixin ],
  computed: {
    displayTPM() { return humanizeDuration(this.timePerMove*1000, { largest: 1 }) }
  },
  created() {
    this.initChallenge(this.contract);
  }
}
</script>

<template>
  <div v-if='challengeLoaded' id='challenge-card' class='pad bordered container flex-col align-center'>
    <WhitePawn v-if='startAsWhite' />
    <BlackPawn v-else-if='startAsBlack' />
    <div class='text-sm text-center'>
      <div>{{ truncAddress(opponent) }}</div>
      <div>{{ displayTPM }}</div>
    </div>
    <div id='status' class='flex-end'>
      <div id='circle' :class='isSender ? "sender" : "receiver"' />
    </div>
  </div>
</template>

<style lang='scss'>
#challenge-card {
  width: 5em;
  height: 5em;

  #status {
    position: absolute;
    width: 4.5em;

    #circle {
      margin-top: .1em;
      height: .5em;
      width: .5em;
      background-color: green;
      border-radius: 50%;
    }

    #circle.sender { background-color: orange }
    #circle.receiver { background-color: green }
  }
}
</style>
