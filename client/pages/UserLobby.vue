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
      <button @click='wallet.ethBalance++'>Go</button>
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
