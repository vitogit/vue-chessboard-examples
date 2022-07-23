<script>
import ChallengeCard from '../components/ChallengeCard';

import ethMixin from '../mixins/ethereum';
import walletMixin from '../mixins/wallet';
import contractsMixin from '../mixins/contracts';
import challengeMixin from '../mixins/challenges';

export default {
  name: 'ChallengeUser',
  mixins: [ ethMixin, walletMixin, contractsMixin, challengeMixin],
  components: { ChallengeCard },
  data () {
    return {
      waiting: false,
      timePerMove: 15
    }
  },
  computed: {
    // After the challenge is sent, this will always be in seconds, so you parse
    // it differently.  Use displayTPM on other pages for the conversion.
    secondsPerMove() {
      if (this.timeUnits == 'minutes') { return this.timePerMove*60 }
      else if (this.timeUnits == 'hours') { return this.timePerMove*60*60 }
      else if (this.timeUnits == 'days') { return this.timePerMove*60*60*24 }
      else if (this.timeUnits == 'weeks') { return this.timePerMove*60*60*24*7 }
    }
  },
  methods: {
    async initChallenge(opponent) {
      this.player1 = this.address;
      this.player2 = opponent;
      await this.refreshPlayerBalances();
    },
    async send() {
      console.log('Sending challenge to', this.opponent);
      const { lobby } = this.contracts;
      await lobby.challenge(this.opponent
                          , this.p1IsWhite
                          , this.wagerAmount
                          , this.secondsPerMove);
      this.waiting = true;

      // Listen for a new challenge and redirect
      const eventFilter = lobby.filters.CreatedChallenge(null
                                                       , this.wallet.address
                                                       , this.opponent);
      lobby.once(eventFilter, (addr, from, to) => {
        console.log('Issued challenge', addr);
        let out = this.lobby.newChallenge(addr, from, to);
        this.waiting = false;
        this.$router.push('/challenge/'+addr);
      });
    }
  },
  created() {
    const { player } = this.$route.params;
    this.initChallenge(player);
  }
}
</script>

<template>
  <div id='new-challenge'>
    <div class='text-xl margin-tb'>New Challenge</div>

    <div id='player-cards' class='flex'>
      <div id='current-player' class='flex-1 flex-center'>
        <ChallengeCard
          class='flex-1'
          :color='startingColor'
          :address='truncAddress(address)'
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
          <input id='choose-white' type='radio' :value='true' v-model='p1IsWhite' />
          <label for='choose-white'>White</label>
          <input id='choose-black' type='radio' :value='false' v-model='p1IsWhite' />
          <label for='choose-black'>Black</label>
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
            <option value='usdc' disabled>USDC</option>
            <option value='usdt' disabled>USDT</option>
          </select>
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
            v-model='timeUnits'
            class='flex-shrink'
          >
            <option value='minutes'>Minutes</option>
            <option value='hours'>Hours</option>
            <option value='days'>Days</option>
            <option value='weeks'>Weeks</option>
          </select>
        </div>
      </div>
    </div>

    <div id='game-controls' class='flex flex-center'>
      <button
        class='margin-rl'
        @click='send'
        :disabled='waiting'
      >Send</button>
      <button
        class='margin-rl'
        @click='$router.push("/profile/"+opponent)'
        :disabled='waiting'
      >Cancel</button>
    </div>
  </div>
</template>

<style lang='scss'>
@import '../styles';

#new-challenge {
  #current-player, #opponent {}

  #universal-options {
    @extend .margin-lg-tb;

    input { max-width: 7em; }
    select { min-width: 6em; }

    #choose-white, #choose-black {
      margin-right: .4em;
      margin-left: 1em;
      color: black;
    }
  }

  #game-controls {
    button { min-width: 6em; }
  }
}
</style>
