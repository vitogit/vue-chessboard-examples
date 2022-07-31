<script>
import _ from 'underscore';
import { isAddress, getAddress } from 'ethers/lib/utils';
import { challengeStatus, gameStatus } from '../constants/bcl';
import challengeMixin from '../mixins/challenges';
import ChallengeCard from '../components/ChallengeCard';
import GameCard from '../components/GameCard';

export default {
  name: 'UserLobby',
  components: { ChallengeCard, GameCard },
  mixins: [ challengeMixin ],
  data () {
    return {
      query: null
    }
  },
  computed: {
    pendingChallenges() {
      return _.filter([ ...this.lobby.challenges ], addr => {
        const metadata = this.lobby.metadata[addr];
        if (!metadata) {
          console.error('No metadata for', addr);
          return false;
        }
        const { status } = this.lobby.metadata[addr];
        return (status === challengeStatus.pending);
      });
    },
    incomingChallenges() {
      return _.filter(this.pendingChallenges, addr => {
        const metadata = this.lobby.metadata[addr];
        if (!metadata) {
          console.error('No metadata for', addr);
          return false;
        }
        const { receiver } = this.lobby.metadata[addr];
        return (receiver === this.wallet.address);
      });
    },
    outgoingChallenges() {
      return _.filter(this.pendingChallenges, addr => {
        const metadata = this.lobby.metadata[addr];
        if (!metadata) {
          console.error('No metadata for', addr);
          return false;
        }
        const { sender } = this.lobby.metadata[addr];
        return (sender === this.wallet.address);
      });
    },
    currentGames() {
      return _.filter(this.lobby.games, addr => {
        const data = this.lobby.metadata[addr];
        return data.status == gameStatus.started;
      });
    },
    playersTurn() {
      return _.filter(this.currentGames, addr => {
        const { isWhiteMove, whitePlayer, blackPlayer } = this.lobby.metadata[addr];
        if (this.wallet.address === whitePlayer) return isWhiteMove;
        else if (this.wallet.address === blackPlayer) return !isWhiteMove;
      });
    },
    opponentsTurn() {
      return _.filter([ ...this.currentGames ], addr => {
        const { isWhiteMove, whitePlayer, blackPlayer } = this.lobby.metadata[addr];
        if (this.wallet.address === whitePlayer) return !isWhiteMove;
        else if (this.wallet.address === blackPlayer) return isWhiteMove;
      });
    },
    playerHistory() {
      return _.filter([ ...this.lobby.games ], addr => {
        const data = this.lobby.metadata[addr];
        if (!data) {
          console.error('No metadata for', addr);
          return false;
        }
        return this.lobby.metadata[addr].status > 0;
      });
    },
    isValidAddress() {
      return isAddress(this.query);
    }
  },
  methods: {
    async search() {
      let addr;
      if (isAddress(this.query)) {
        addr = this.query;
      } else {
        addr = await this.wallet.provider.resolveName(this.query);
        if (!addr) {
          // TODO Redirect to some error page or show a modal
          throw Error(`Invalid lookup address ${this.query}`);
        }
      }
      this.$router.push('/profile/'+getAddress(addr));
    },
    data(addr) { return this.lobby.metadata[addr] }
  }
}
</script>

<template>
  <div id='lobby'>
    <div class='text-xl margin-tb'>Lounge</div>

      <form id='player-lookup' class='margin-lg-tb'>
        <input
          type='text'
          v-model='query'
          placeholder='ETH Address / ENS Domain'
        />
        <button
          class='margin-rl'
          @click='search'
        >Search</button>
      </form>

    <div class='text-lg margin-tb'>Challenges</div>
    <div id='challenges' class='flex-1 flex-wrap'>
      <router-link
        v-for='c in [ ...incomingChallenges, ...outgoingChallenges ]'
        class='margin'
        :key='`challenge-${c}`'
        :to='"/challenge/"+c'
      >
        <ChallengeCard v-bind='data(c)' />
      </router-link>
    </div>

    <div class='text-lg margin-tb'>Games</div>
    <div id='games' class='flex flex-wrap'>
      <router-link
        v-for='g in [ ...playersTurn, ...opponentsTurn ]'
        class='margin'
        :key='`game-${g}`'
        :to='"/game/"+g'
      >
        <GameCard :player='wallet.address' v-bind='data(g)' :showTTM='true' />
      </router-link>
    </div>

    <div class='text-lg margin-tb'>History</div>
    <div id='history' class='flex flex-wrap'>
      <router-link
        v-for='g in playerHistory'
        class='margin'
        :key='`history-${g}`'
        :to='"/game/"+g'
      >
        <GameCard :player='wallet.address' v-bind='data(g)' />
      </router-link>
    </div>
  </div>
</template>

<style lang='scss'>
#lobby {
  #player-lookup {
    input { width: 18em; }
  }
}
</style>
