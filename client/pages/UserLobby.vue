<script>
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
  methods: {
    async search() {
      if (isAddress(this.query)) {
        this.$router.push('/profile/'+getAddress(this.query));
      } else {
        alert('Please enter a valid address');
      }
    }
  },
  computed: {
    isValidAddress() {
      return isAddress(this.query);
    }
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
        v-for='c in challenges.pending'
        :key='`pending-${c}`'
        :to='"/challenge/"+c'
      >
        {{ c }}
      </router-link>
    </div>

    <div id='waiting-challenges'>
      <div class='text-lg margin-lg-tb'>Awaiting Response</div>
      <router-link
        v-for='(c, i) in challenges.waiting'
        :key='`waiting-${c}`'
        :to='"/challenge/"+c'
      >
        {{ c }}
      </router-link>
    </div>

    <div id='open-games'>
      <div class='text-lg margin-lg-tb'>In-progress Games</div>
    </div>

    <div id='history'>
      <div class='text-lg margin-lg-tb'>History</div>
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
