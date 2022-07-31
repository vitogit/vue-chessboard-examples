<script>
import _ from 'underscore';
import ethMixin from '../mixins/ethereum';
import walletMixin from '../mixins/wallet';
import contractsMixin from '../mixins/contracts';
import challengeMixin from '../mixins/challenges';
import useWalletStore from '../stores/wallet';
import ChallengeModal from '../components/ChallengeModal';
import GameCard from '../components/GameCard';

export default {
  name: 'PlayerProfile',
  components: { ChallengeModal, GameCard },
  mixins: [ ethMixin, contractsMixin, challengeMixin ],
  data() {
    return {
      loading: false,
      waiting: false,
      showModal: false,
      // All the players games
      games: [],
      // Matches with the current user
      matches: []
    };
  },
  methods: {
    async init() {
      const { lobby } = this.contracts;

      this.player1 = this.wallet.address;
      this.player2 = this.$route.params.address;
      try {     // This is expected to fail on localhost
        this.p1Handle = await this.provider.lookupAddress(this.player1);
        this.p2Handle = await this.provider.lookupAddress(this.player2);
      } catch {}
      if (!this.p1Handle) this.p1Handle = 'No ENS Record';
      if (!this.p2Handle) this.p2Handle = 'No ENS Record';

      const filter = lobby.filters.GameStarted;
      const [ white, black ] = await Promise.all([
        lobby.queryFilter(filter(null, this.opponent, null)),
        lobby.queryFilter(filter(null, null, this.opponent))
      ]);
      await Promise.all(_.map([ ...white, ...black ], ev => {
        const [ addr, p1, p2 ] = ev.args;
        this.games = [ addr, ...this.games ];
        if ([ p1, p2 ].includes(this.wallet.address)) {
          this.matches = [ addr, ...this.matches ];
        }
        this.contracts.registerGame(addr);
        return this.lobby.updateGame(addr);
      }));
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
      const eventFilter = lobby.filters.CreatedChallenge(null
                                                       , this.wallet.address
                                                       , this.opponent);
      lobby.once(eventFilter, async (addr, from, to) => {
        console.log('Issued challenge', addr);
        await this.lobby.newChallenge(addr, from, to);
        this.waiting = false;
        this.$router.push('/challenge/'+addr);
      });
    },
    data(addr) { return this.lobby.metadata[addr] }
  },
  created() {
    this.loading = true;
    this.init().then(() => this.loading = false);
  }
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

    <div class='text-lg margin-tb'>Match History</div>
    <div id='match-history' class='flex flex-wrap'>
      <router-link
        v-for='g in matches'
        class='margin'
        :key='"match-"+g'
        :to='"/game/"+g'
      >
        <GameCard v-bind='data(g)' :player='player1' />
      </router-link>
    </div>

    <div class='text-lg margin-tb'>Player History</div>
    <div id='player-history' class='flex flex-wrap'>
      <router-link
        v-for='g in games'
        class='margin'
        :key='"match-"+g'
        :to='"/game/"+g'
      >
        <GameCard v-bind='data(g)' :player='player2' />
      </router-link>
    </div>

    <ChallengeModal
      v-if='showModal'
      title='New Challenge'
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
      :waiting='waiting'
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
