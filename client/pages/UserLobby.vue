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
    <div id='player-lookup'>
      <input
        v-model='query'
        placeholder='ETH Address / ENS Domain'
      />
      <button
        :disabled='!isValidAddress'
        @click='searchPlayer'
      >Go</button>
    </div>

    <div id='open-challenges'>
      <h2>Pending Challenges</h2>
    </div>

    <div id='open-games'>
      <h2>In-progress Games</h2>
    </div>

    <div id='history'>
      <h2>History</h2>
    </div>
  </div>
</template>

<style lang='scss'>
#lobby {
  #player-lookup {
    input {
      width: 18em;
    }

    button {
      margin-left: .4em;
    }
  }
}
</style>
