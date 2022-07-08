<script>
import { Contract } from 'ethers';
import ChallengeContract from '../contracts/Challenge';

import ethMixin from '../mixins/ethereum';
import walletMixin from '../mixins/wallet';
import contractsMixin from '../mixins/contracts';
import challengeMixin from '../mixins/challenges';

import ChallengeCard from '../components/ChallengeCard';

export default {
  name: 'ChallengeUser',
  mixins: [ ethMixin, walletMixin, contractsMixin, challengeMixin ],
  components: { ChallengeCard },
  computed: {
    startAsWhite: {
      get() {
        if (this.isPlayer1) {
          return this.p1IsWhite;
        } else if (this.address === this.player2) {
          return !this.p1IsWhite;
        } else {
          return;
        }
      },
      set(val) {
        if (this.isPlayer1) this.p1IsWhite = val;
        else if (this.isPlayer2) this.p1IsWhite = !val;
      }
    }
  },
  methods: {
    async send() {
      await this.challenge.modify(this.startAsWhite
                                , this.wagerAmount
                                , this.timePerMove)
                      .then(tx => tx.wait);
      // TODO The page should be diabled until the next
      //      block gets mined

      // Listen for a new challenge and redirect
      const eventFilter = this.challenge.filters.Modified(this.wallet.address, this.opponent);
      this.challenge.once(eventFilter, (p1, p2, state) => {
          console.log('Modified challenge', this.challenge.address, state);
          this.challenges.modify(this.challenge.address, state);
          this.$router.push('/challenge/'+this.challenge.address);
      });
    }
  },
  created() {
    const { contract } = this.$route.params;
    this.initChallenge(contract);
  }
}
</script>

<template>
  <div id='modify-challenge'>
    <div class='text-xl margin-tb'>Modify Challenge</div>

    <div id='player-cards' class='flex'>
      <div id='current-player' class='flex-1 flex-center'>
        <ChallengeCard
          class='flex-1'
          :color='startingColor'
          :address='truncAddress(currentPlayer)'
          :balance='balance'
          token='eth'
        >Play As</ChallengeCard>
      </div>

      <div class='margin-rl' />

      <div id='opponent' class='flex-1 flex-center'>
        <ChallengeCard
          class='flex-1'
          :color='opponentColor'
          :address='truncAddress(opponent)'
          :balance='opponentBalance'
          token='eth'
        >Opponent</ChallengeCard>
      </div>
    </div>

    <div id='universal-options' class='margin-lg-tb'>
      <div id='' class='flex margin-tb'>
        <div class='flex-shrink center-align text-ml text-bold'>Play As</div>
        <div class='flex-1 flex-end'>
          <input id='choose-white' type='radio' :value='true' v-model='startAsWhite' />
          <label for='choose-white'>White</label>
          <input id='choose-black' type='radio' :value='false' v-model='startAsWhite' />
          <label for='choose-black'>Black</label>
        </div>
      </div>

      <div id='time-per-move' class='flex margin-tb'>
        <div class='flex-shrink center-align text-ml text-bold'>Time Per Move</div>
        <div class='flex-1 flex-end'>
          <input
            class='margin-rl flex-1'
            v-model='timePerMove'
            placeholder='Enter a number'
          />

          <select
            id='tpm-units'
            name='tpm-units'
            class='flex-shrink'
          >
            <option value='minutes'>Minutes</option>
            <option value='hours'>Hours</option>
            <option value='days'>Days</option>
            <option value='days'>Weeks</option>
          </select>
        </div>
      </div>

      <div id='wager-info' class='flex margin-tb'>
        <div class='flex-shrink center-align text-ml text-bold'>Wager</div>
        <div class='flex-1 flex-end'>
          <input
            class='margin-rl flex-1'
            v-model='wagerAmount'
            placeholder='0.000'
          />
          <select
            id='wager-token'
            name='wager-token'
            class='flex-shrink'
          >
            <option value='eth'>ETH</option>
            <option value='dai' disabled>DAI</option>
          </select>
        </div>
      </div>
    </div>

    <div v-if='isPlayer' id='game-controls' class='flex flex-center'>
      <button
        class='margin-rl'
        @click='send'
        :disabled='!isPlayer'
      >Send</button>
      <button
        class='margin-rl'
        @click='$router.push("/challenge/"+challenge.address)'
        :disabled='!isPlayer'
      >Cancel</button>
    </div>
  </div>
</template>

<style lang='scss'>
@import '../styles';

#modify-challenge {
  #current-player, #opponent {}

  #universal-options {
    @extend .margin-lg-tb;

    input { max-width: 7em; }
    select { min-width: 6em; }
  }

  #game-controls {
    button { min-width: 6em; }
  }
}
</style>
