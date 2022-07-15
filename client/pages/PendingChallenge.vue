<script>
import { Contract } from 'ethers';
import ChallengeContract from '../contracts/Challenge';

import { challengeStatus } from '../constants/bcl';

import ethMixin from '../mixins/ethereum';
import walletMixin from '../mixins/wallet';
import contractsMixin from '../mixins/contracts';
import challengeMixin from '../mixins/challenges';

import ChallengeCard from '../components/ChallengeCard';

export default {
  name: 'PendingChallenge',
  mixins: [ ethMixin, walletMixin, contractsMixin, challengeMixin ],
  components: { ChallengeCard },
  data() {
    return {
      waiting: false
    };
  },
  computed: {
    disableControls() { return this.waiting || !this.challengeLoaded || !this.statusPending }
  },
  methods: {
    async accept() {
      console.log('Accepted challenge');
      await this.challenge.accept();
      this.waiting = true;
      const eventFilter = this.challenge.filters.StateChanged(this.address, this.opponent);
      this.challenge.once(eventFilter, (p1, p2, state) => {
        console.log('Challenge accepted', this.challenge.address);
        this.lobby.terminate(this.challenge.address);
        this.waiting = false;
      });

      const gameFilter = this.challenge.filters.NewContract(this.whitePlayer, this.blackPlayer);
      this.challenge.once(gameFilter, async (p1, p2, address) => {
        console.log('New game created', address);
        this.lobby.newGame(address, p1, p2);
        this.$router.push('/game/'+address);
      });
    },
    async decline() {
      console.log('Declined challenge');
      await this.challenge.decline();
      this.waiting = true;
      const eventFilter = this.challenge.filters.StateChanged(this.address, this.opponent);
      this.challenge.once(eventFilter, (p1, p2, state) => {
        console.log('Challenge declined', this.challenge.address);
        this.lobby.terminate(this.challenge.address);
        this.waiting = false;
        this.initChallenge(this.challenge.address);
        //this.$router.go();
      });
    },
    async cancel() {
      console.log('Canceled challenge');
      await this.challenge.cancel();
      this.waiting = true;
      const eventFilter = this.challenge.filters.StateChanged(this.address, this.opponent);
      this.challenge.once(eventFilter, (p1, p2, state) => {
        console.log('Challenge canceled', this.challenge.address);
        this.lobby.terminate(this.challenge.address);
        this.waiting = false;
        this.initChallenge(this.challenge.address);
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

    <div v-if='challengeLoaded' id='player-cards' class='flex'>
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
      <div id='contract-state' class='flex margin-tb'>
        <div class='flex-shrink center-align text-ml text-bold'>Status</div>
        <div class='flex-1 flex-end center-align'>
          <div class='text-sentance'>{{ formatChallengeStatus(challengeStatus) }}</div>
        </div>
      </div>

      <div id='wager-info' class='flex margin-tb'>
        <div class='flex-shrink center-align text-ml text-bold'>Wager</div>
        <div class='flex-1 flex-end center-align'>
          <div class='margin-rl'>{{ wagerAmount }}</div>
          <div>ETH</div>
        </div>
      </div>

      <div id='time-per-move' class='flex margin-tb'>
        <div class='flex-shrink center-align text-ml text-bold'>Time Per Move</div>
        <div class='flex-1 flex-end center-align'>
          <div class='margin-rl'>{{ timePerMove }}</div>
          <div>Minutes</div>
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
          @click='$router.push("/modify/"+challenge.address)'
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
          @click='$router.push("/modify/"+challenge.address)'
          :disabled='disableControls'
        >Modify</button>
      </div>
    </div>
  </div>
</template>

<style lang='scss'>
@import '../styles';

#pending-challenge {
  #current-player, #opponent {}

  #universal-options {
    @extend .margin-lg-tb;
  }

  #game-controls {
    button { min-width: 6em; }
  }
}
</style>
