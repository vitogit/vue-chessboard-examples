<script>
import humanizeDuration from 'humanize-duration';
import ethMixin from '../mixins/ethereum';
import walletMixin from '../mixins/wallet';
import challengeMixin from '../mixins/challenges';
import Card from './Card';
import LoadingCard from './LoadingCard';
import WhitePawn from '../assets/icons/whitepawn.svg';
import BlackPawn from '../assets/icons/blackpawn.svg';

export default {
  name: 'ChallengeCard',
  props: {
    loading: Boolean,
    player1: String,
    player2: String,
    sender: String,
    receiver: String,
    p1IsWhite: Boolean,
    timePerMove: [ Number, Object ]
  },
  components: { Card, LoadingCard, WhitePawn, BlackPawn },
  mixins: [ ethMixin, walletMixin ],
  computed: {
    isSender() { return this.address === this.sender },
    isReceiver() { return this.address === this.receiver },
    opponent() {
      if (this.wallet.address === this.player1) return this.player2;
      else if (this.wallet.address === this.player2) return this.player1;
      else return this.player1;
    },
    startAsWhite() {
      if (this.wallet.address === this.player1) return this.p1IsWhite;
      else if (this.wallet.address === this.player2) return !this.p1IsWhite;
      else return this.p1IsWhite;
    },
    displayTPM() { return humanizeDuration(this.timePerMove*1000
                                        , { largest: 1 })
    },
    indicator() {
      if (this.isReceiver) return 'green';
      else if (this.isSender) return 'orange';
      else return 'grey';
    }
  }
}
</script>

<template>
  <LoadingCard v-if='loading' v-bind:player='player1' />
  <Card v-else v-bind='{ indicator }'>
    <WhitePawn v-if='startAsWhite' />
    <BlackPawn v-else />

    <div class='text-sm text-center'>
      <div>{{ truncAddress(opponent) }}</div>
      <div>{{ displayTPM }}</div>
    </div>
  </Card>
</template>
