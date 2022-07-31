<script>
import _ from 'underscore';
import humanizeDuration from 'humanize-duration';
import { Contract } from 'ethers';
import { gameStatus, gameOutcome } from '../constants/bcl';
import GameContract from '../contracts/ChessGame';
import ethMixin from '../mixins/ethereum';
import walletMixin from '../mixins/wallet';
import gameMixin from '../mixins/games';
import Card from './Card';
import LoadingCard from './LoadingCard';
import WhiteRook from '../assets/icons/whiterook.svg';
import BlackRook from '../assets/icons/blackrook.svg';

export default {
  name: 'GameCard',
  props: {
    player: {
      type: String,
      default: '0x0000000000000000000000000000000000000000'
    },
    loading: Boolean,
    status: Number,
    loading: Boolean,
    outcome: Number,
    whitePlayer: String,
    blackPlayer: String,
    isWhiteMove: Boolean,
    timePerMove: [ String, Object ],
    timeOfLastMove: [ String, Object ],
    showTTM: Boolean
  },
  components: { Card, LoadingCard, WhiteRook, BlackRook },
  mixins: [ ethMixin, walletMixin ],
  computed: {
    opponent() {
      if (this.isWhitePlayer) return this.blackPlayer;
      else if (this.isBlackPlayer) return this.whitePlayer;
      else return this.whitePlayer;
    },
    isWhitePlayer() { return this.player === this.whitePlayer },
    isBlackPlayer() { return this.player === this.blackPlayer },
    isWinner() {
      if (this.isWhitePlayer) return this.outcome == gameOutcome.whiteWon;
      else if (this.isBlackPlayer) return this.outcome == gameOutcome.blackWon;
      else return false;
    },
    isLoser() {
      if (this.isWhitePlayer) return this.outcome == gameOutcome.blackWon;
      else if (this.isBlackPlayer) return this.outcome == gameOutcome.whiteWon;
      else return false;
    },
    isCurrentMove() {
      if (this.isWhitePlayer) return this.isWhiteMove;
      else if (this.isBlackPlayer) return !this.isWhiteMove;
    },
    timeOfExpiry() {
      return this.timeOfLastMove.add(this.timePerMove)
    },
    timeUntilExpiry() {
      return Math.floor(this.timeOfExpiry - Date.now()/1000);
    },
    displayTTM() {
      return humanizeDuration(this.timeUntilExpiry*1000
                          , { largest: 1 });
    },
    displayResult() {
      if (this.isWinner) return 'victory';
      else if (this.isLoser) return 'defeat';
      else if (this.outcome == gameOutcome.draw) return 'stalemate';
      else return 'unknown';
    },
    displayStatus() {
      switch (this.status) {
        case gameStatus.started:
          return 'In Progress';
        case gameStatus.finished:
          return 'Finished';
        case gameStatus.paused:
          return 'Paused';
        case gameStatus.review:
          return 'In Review';
      }
    },
    displayText() {
      switch (this.status) {
        case gameStatus.started:
          return this.showTTM ? this.displayTTM : this.displayStatus;
        case gameStatus.finished:
          return this.displayResult;
        default:
          return this.displayStatus;
      }
    },
    indicator() {
      switch(this.status) {
        case gameStatus.started:
          return this.isCurrentMove ? 'green' : 'orange';
        case gameStatus.finished:
          if (this.outcome == gameOutcome.draw) {
            return 'orange';
          } else if (this.outcome == gameOutcome.whiteWon) {
            if (this.isWhitePlayer) return 'green';
            else if (this.isBlackPlayer) return 'red';
            else return 'transparent';
          } else if (this.outcome == gameOutcome.blackWon) {
            if (this.isBlackPlayer) return 'green';
            else if (this.isWhitePlayer) return 'red';
            else return 'transparent';
          }
        case gameStatus.paused:
          return 'transparent';
        case gameStatus.review:
          return 'black';
      }
    }
  }
}
</script>

<template>
  <LoadingCard v-if='loading' v-bind='{ player }' />
  <Card v-else v-bind='{ indicator }'>
    <BlackRook v-if='isBlackPlayer' />
    <WhiteRook v-else />

    <div class='text-sm text-caps text-center'>
      <slot>
        <div>{{ truncAddress(opponent) }}</div>
        <div>{{ displayText }}</div>
      </slot>
    </div>
  </Card>
</template>
