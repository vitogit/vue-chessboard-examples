<script>
import useWalletStore from '../stores/wallet';

export default {
  name: 'UserLobby',
  setup() {
    const wallet = useWalletStore();
    return { wallet };
  }
}
</script>

<template>
  <div id='lobby'>
    <div id='player-lookup'>
      <input type='text'
        name='player-address'
        placeholder='ETH Address / ENS Domain'
      >
      <button disabled>Go</button>
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
      margin-left: .5em;
    }
  }
}
</style>
