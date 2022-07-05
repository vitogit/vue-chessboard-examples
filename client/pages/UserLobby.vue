<script>
import { isAddress, getAddress } from 'ethers/lib/utils';

export default {
  name: 'UserLobby',
  data () {
    return {
      query: null
    }
  },
  methods: {
    async searchPlayer() {
      console.log('query', this.query);
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
        @click='searchPlayer'
      >Go</button>
    </div>

    <div id='open-challenges'>
      <div class='text-lg margin-lg-tb'>Pending Challenges</div>
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
