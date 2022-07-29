<script>
import ChallengeContract from '../contracts/Challenge';
import { challengeStatus } from '../constants/bcl';
import ethMixin from '../mixins/ethereum';
import walletMixin from '../mixins/wallet';
import contractsMixin from '../mixins/contracts';
import challengeMixin from '../mixins/challenges';
import ChallengeModal from '../components/ChallengeModal';
import WhiteKing from '../assets/icons/whiteking.svg';
import BlackKing from '../assets/icons/blackking.svg';

export default {
  name: 'PendingChallenge',
  mixins: [ ethMixin, walletMixin, contractsMixin, challengeMixin ],
  components: { ChallengeModal, WhiteKing, BlackKing },
  data() {
    return {
      waiting: false,
      showModal: false
    };
  },
  computed: {
    disableControls() { return this.waiting || !this.challengeLoaded || !this.statusPending }
  },
  methods: {
    async modify() {
      console.log('Modify challenge', this.balanceDiff);
      await this.challenge.modify(this.p1IsWhite
                                , this.wagerAmount
                                , this.timePerMove
                                , { value: `${this.balanceDiff}` });
      this.waiting = true;
      // Listen for a new challenge and redirect
      const eventFilter = this.challenge.filters.ChallengeModified(this.wallet.address);
      this.challenge.once(eventFilter, async player => {
        console.log('Modified challenge', this.challenge.address);
        await this.refreshChallenge();
        this.waiting = false;
      });
    },
    async accept() {
      console.log('Accepted challenge');
      await this.challenge.accept({ value: `${this.balanceDiff}` });
      this.waiting = true;
      const { lobby } = this.contracts;
      const eventFilter = lobby.filters.GameStarted(null, this.address, this.opponent);
      lobby.once(eventFilter, (addr, p1, p2) => {
        console.log('New game created', addr);
        this.lobby.terminate(this.challenge.address);
        this.lobby.newGame(addr, p1, p2);
        this.waiting = false;
        this.$router.push('/game/'+addr);
      });
    },
    async decline() {
      console.log('Declined challenge');
      await this.challenge.decline();
      this.waiting = true;
      const { lobby } = this.contracts;
      const eventFilter = lobby.filters.CanceledChallenge(this.challenge.address);
      lobby.once(eventFilter, (addr, p1, state) => {
        console.log('Challenge declined', addr);
        this.lobby.terminate(addr);
        this.waiting = false;
        this.initChallenge(addr);
      });
    },
    async cancel() {
      console.log('Canceled challenge');
      await this.challenge.cancel();
      this.waiting = true;
      const { lobby } = this.contracts;
      const eventFilter = lobby.filters.CanceledChallenge(this.challenge.address);
      lobby.once(eventFilter, (addr, p1, state) => {
        console.log('Challenge cancelled', addr);
        this.lobby.terminate(addr);
        this.waiting = false;
        this.initChallenge(addr);
      });
    }
  },
  created() {
    const { contract } = this.$route.params;
    this.initChallenge(contract)
  }
}
</script>

<template>
  <div v-if='challengeLoaded' id='pending-challenge'>
    <div v-if='challengeStatus === 0' class='text-xl margin-tb'>Pending Challenge</div>
    <div v-else class='text-xl margin-tb'>Challenge</div>

    <div id='player-cards' class='flex flex-around'>
      <div id='current-player' class='bordered padded container text-center'>
        <div class='text-lg bold'>Play As</div>
        <div class='margin-tb'>
          <WhiteKing v-if='startAsWhite' />
          <BlackKing v-else />
        </div>
        <div v-if='playerHandle'>{{ playerHandle }}</div>
        <div v-else>{{ truncAddress(wallet.address) }}</div>
        <div>{{ formatBalance(playerBalance) }} ETH</div>
      </div>

      <div id='opponent' class='bordered padded container text-center'>
        <div class='text-lg bold'>Opponent</div>
        <div class='margin-tb'>
          <BlackKing v-if='startAsWhite' />
          <WhiteKing v-else />
        </div>
        <div v-if='opponentHandle'>{{ opponentHandle }}</div>
        <div v-else>{{ truncAddress(opponent) }}</div>
        <div>{{ formatBalance(opponentBalance) }} ETH</div>
      </div>
    </div>

    <div id='universal-options' class='margin-lg'>
      <div id='contract-state' class='flex margin-tb'>
        <div class='flex-shrink center-align text-ml text-bold'>Status</div>
        <div class='flex-1 flex-end center-align'>
          <div class='text-sentance'>{{ formatChallengeStatus(challengeStatus) }}</div>
        </div>
      </div>

      <div id='time-per-move' class='flex margin-tb'>
        <div class='flex-shrink center-align text-ml'>Time Per Move</div>
        <div class='flex-1 flex-end center-align'>
          <div class='text-caps'>{{ displayTPM }} {{ timeUnits }}</div>
        </div>
      </div>

      <div class='flex margin-tb'>
        <div class='flex-shrink center-align text-ml text-bold'>Wager Amount</div>
        <div class='flex-1 flex-end center-align'>
          {{ formatBalance(wagerAmount) }} ETH
        </div>
      </div>

      <div class='flex margin-tb'>
        <div class='flex-shrink center-align'>Current Balance</div>
        <div class='flex-1 flex-end center-align text-ms'>
          {{ formatBalance(playerBalance) }} ETH
        </div>
      </div>

      <div v-if='extraBalance>0' class='flex margin-tb'>
        <div class='flex-shrink center-align'>Extra Balance</div>
        <div class='flex-1 flex-end center-align text-ms'>
          +{{ formatBalance(extraBalance) }} ETH
        </div>
      </div>

      <div v-if='currentBalance>0 && balanceDiff>0' class='flex margin-tb'>
        <div class='flex-shrink center-align'>Needed Balance</div>
        <div class='flex-1 flex-end center-align text-ms'>
          +{{ formatBalance(balanceDiff) }} ETH
        </div>
      </div>
    </div>

    <div v-if='isConnected' id='game-controls' class='flex flex-center margin-lg-tb'>
      <div v-if='isSender' class='flex-1 flex-center'>
        <button
          class='margin-rl'
          @click='cancel'
          :disabled='disableControls'
        >Cancel</button>
        <button
          class='margin-rl'
          @click='showModal = true'
          :disabled='disableControls'
        >Modify</button>
      </div>

      <div v-else-if='isReceiver' class='flex-1 flex-center'>
        <button
          class='margin-rl'
          @click='accept'
          :disabled='disableControls'
        >Accept</button>
        <button
          class='margin-rl'
          @click='decline'
          :disabled='disableControls'
        >Decline</button>
        <button
          class='margin-rl'
          @click='showModal = true'
          :disabled='disableControls'
        >Modify</button>
      </div>
    </div>

    <ChallengeModal
      v-if='showModal'
      title='Modify Challenge'
      :waiting='waiting'
      @close='() => initChallenge(challenge.address).then(showModal = false)'
      @send='() => modify().then(() => showModal = false)'
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

#pending-challenge {
  max-width: 25em;

  #current-player, #opponent {
    width: 8em;

    svg {
      height: 4em;
      width: 4em;
    }
  }

  #universal-options {
    @extend .margin-lg-tb;
  }

  #game-controls {
    button { min-width: 6em; }
  }
}
</style>
