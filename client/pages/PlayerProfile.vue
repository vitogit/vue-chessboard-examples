<script>
import ethMixin from '../mixins/ethereum';
import walletMixin from '../mixins/wallet';
import contractsMixin from '../mixins/contracts';
import challengeMixin from '../mixins/challenges';
import useWalletStore from '../stores/wallet';
import ChallengeModal from '../components/ChallengeModal';

export default {
  name: 'PlayerProfile',
  components: { ChallengeModal },
  mixins: [ ethMixin, contractsMixin, challengeMixin ],
  data() {
    return {
      loading: false,
      waiting: false,
      showModal: false
    };
  },
  methods: {
    async init() {
      this.player1 = this.wallet.address;
      this.player2 = this.$route.params.address;
      try {     // This is expected to fail on localhost
        this.p1Handle = await this.wallet.provider.lookupAddress(this.player1);
        this.p2Handle = await this.wallet.provider.lookupAddress(this.player2);
      } catch {}
      if (!this.p1Handle) this.p1Handle = 'No ENS Record';
      if (!this.p2Handle) this.p2Handle = 'No ENS Record';
    },
    async sendChallenge() {
      console.log('Sending challenge to', this.opponent);
      const { lobby } = this.contracts;
      await lobby.challenge(this.opponent
                          , this.p1IsWhite
                          , this.wagerAmount
                          , this.timePerMove
                          , { value: this.wagerAmount });
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
  created() { this.loading = true; this.init().then(() => this.loading = false) }
}
</script>

<template>
  <div id='profile'>
    <div class='text-xl margin-tb'>Profile</div>

    <div class='flex'>
      <div id='player-record' class='flex-1 flex-between'>
        <div class='bordered container'>
          <div class='label'>Games</div>
          <div class='info'>0</div>
        </div>
        <div class='bordered container'>
          <div class='label'>Wins</div>
          <div class='info'>0</div>
        </div>
        <div class='bordered container'>
          <div class='label'>Losses</div>
          <div class='info'>0</div>
        </div>
      </div>

      <div class='flex-1 flex-center'>
        <button
          id='challenge-button'
          @click='showModal = true'
        >Challenge!</button>
      </div>
    </div>

    <div class='flex margin-lg-tb'>
      <div class='flex-1 text-ml'>Handle</div>
      <div class='flex-2 align-bottom text-ms'>
        <div v-if='loading'>Loading...</div>
        <div v-else>{{ p2Handle }}</div>
      </div>
    </div>

    <div class='flex margin-lg-tb align-bottom'>
        <div class='flex-1 text-ml'>Address</div>
        <div class='flex-2 text-ms'>{{ truncAddress(opponent) }}</div>
    </div>

    <div id='match-history'>
      <div class='text-lg margin-lg-tb'>Match History</div>
    </div>

    <div id='player-history'>
      <div class='text-lg margin-lg-tb'>Player History</div>
    </div>

    <ChallengeModal
      v-if='showModal'
      title='New Challenge'
      :waiting='waiting'
      @close='() => showModal = false'
      @send='() => sendChallenge().then(() => showModal = false)'
      v-bind:startAsWhite='startAsWhite'
      @update:color='val => startAsWhite = val'
      v-bind:wagerAmount='displayWager'
      @update:wager='val => displayWager = val'
      v-bind:timePerMove='displayTPM'
      @update:tpm='val => displayTPM = val'
      v-bind:timeUnits='timeUnits'
      @update:time-units='val => timeUnits = val'
    />
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

  #challenge-button {
    @extend .padded;
    @extend .text-ml;
  }
}
</style>
