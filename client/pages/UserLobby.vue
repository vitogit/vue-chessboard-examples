<script>
import _ from 'underscore';
import { isAddress, getAddress } from 'ethers/lib/utils';
import challengeMixin from '../mixins/challenges';

export default {
  name: 'UserLobby',
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
        const { receiver } = this.lobby.metadata[addr];
        return (receiver === this.wallet.address);
      });
    },
    waitingChallenges() {
      return _.filter([ ...this.lobby.challenges ], addr => {
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
      return _.filter([ ...this.lobby.games ], addr => {
        const metadata = this.lobby.metadata[addr];
        if (!metadata) {
          console.error('No metadata for', addr);
          return false;
        }
        return this.lobby.metadata[addr].status === 0;
      });
    },
    playerHistory() {
      return _.filter([ ...this.lobby.history ], addr => {
        const metadata = this.lobby.metadata[addr];
        if (!metadata) {
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
      if (isAddress(this.query)) {
        this.$router.push('/profile/'+getAddress(this.query));
      } else {
        alert('Please enter a valid address');
      }
    }
  },
  created() {
  }
}
</script>

<template>
  <div id='lobby'>
    <div class='text-xl margin-tb'>Lobby</div>

    <div id='player-lookup'>
      <input
        v-model='query'
        placeholder='ETH Address / ENS Domain'
      />
      <button
        class='margin-rl'
        :disabled='!isValidAddress'
        @click='search'
      >Go</button>
    </div>

    <div id='pending-challenges'>
      <div class='text-lg margin-lg-tb'>Pending Challenges</div>
      <router-link
        v-for='c in pendingChallenges'
        :key='`waiting-${c}`'
        :to='"/challenge/"+c'
      >
        {{ 'OPPONENT' }}
      </router-link>
    </div>

    <div id='waiting-challenges'>
      <div class='text-lg margin-lg-tb'>Awaiting Response</div>
      <router-link
        v-for='c in waitingChallenges'
        :key='`waiting-${c}`'
        :to='"/challenge/"+c'
      >
        {{ c }}
      </router-link>
    </div>

    <div id='open-games'>
      <div class='text-lg margin-lg-tb'>In-progress Games</div>
      <router-link
        v-for='g in currentGames'
        :key='`in-progress-${g}`'
        :to='"/game/"+g'
      >
        {{ g }}
      </router-link>
    </div>

    <div id='history'>
      <div class='text-lg margin-lg-tb'>History</div>
      <router-link
        v-for='g in playerHistory'
        :key='`history-${g}`'
        :to='"/game/"+g'
      >
        {{ g }}
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
