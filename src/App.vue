<script>
import AiBoard from './components/AiBoard.vue';
import ConnectWallet from './components/ConnectWallet.vue';
import ContractData from './components/ContractData.vue';

export default {
  name: 'app',
  components: {
    AiBoard,
    ConnectWallet,
    ContractData
  },
  data () {
    return {
      currentFen: '',
      positionInfo: null
    }
  },
  methods: {
    showInfo(data) {
      this.positionInfo = data;
    },
    loadFen(fen) {
      this.currentFen = fen;
    }
  },
  created() {
  }
}
</script>

<template>
  <div id="app">
    <div id='sidebar'>
      <div id='logo' class='font-smooth'>Blockchain Chess Lounge</div>
      <ConnectWallet class='outline font-blocky' />
    </div>
    <div id='body'>
      <AiBoard id='board' @onMove="showInfo" />
      <ContractData id='contract' v-bind='positionInfo' />
    </div>
  </div>
</template>

<style>
#app {
  display: flex;
  flex-direction: row;
}

#sidebar {
  flex-basis: 240px;

  display: flex;
  flex-direction: column;
  align-items: center;
}

#logo {
  font-size: 36px;
  text-align: center;
  margin: 16px;
}

#body {
  flex: 1;

  display: flex;
  flex-direction: row;
}

#board {
  margin: 12px;
  padding: 12px;
}

#contract {
  margin: 12px;
  padding: 12px;
}
</style>
