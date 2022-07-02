<script>
import AiBoard from './components/AiBoard.vue';
import CryptoWallet from './components/CryptoWallet.vue';
import ConnectWallet from './components/ConnectWallet.vue';
import ContractData from './components/ContractData.vue';

export default {
  name: 'app',
  components: {
    AiBoard,
    ConnectWallet,
    CryptoWallet,
    ContractData,
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
  <div id='app'>
    <div id='sidebar'>
      <div id='header' class='font-smooth'>Blockchain Chess Lounge</div>
      <CryptoWallet />
      <ConnectWallet />
      <div id='navigation'>
        <button disabled>About</button>
        <button>Lobby</button>
        <button>Fun Play</button>
        <button disabled>Settings</button>
      </div>
    </div>
    <div id='body'>
      <AiBoard id='board' @onMove='showInfo' />
      <ContractData id='contract' v-bind='positionInfo' />
    </div>
  </div>
</template>

<style lang='scss'>
@import '~bourbon';
@import '~bourbon-neat';

#app {
  @include grid-container;
  $app-container: (columns: 5);
  $sidebar-buttons: (columns: 1, gutter: 3em);
  $app-body: (columns: 2);

  #sidebar {
    @include grid-column(1, $app-container);
    @include padding(6px);

    #{$all-buttons} {
      @include grid-column(1, $sidebar-buttons);
    }
  }

  #body {
    @include grid-column(3, $app-container);

    display: flex;

    #board {
      flex-shrink: 1;
      @include margin(12px);
      @include padding(12px);
    }

    #contract {
      flex: 1;
      @include margin(12px);
      @include padding(12px);
    }
  }
}

#sidebar {
  border-style: solid;
  border-radius: 6px;
  border-width: 3px;

  #header {
    font-size: 36px;
    text-align: center;
    margin: 16px;
  }

  #{$all-buttons} {
    @include margin(4px null);
    @include padding(4px null);
    border-style: solid;
    border-radius: 6px;
    border-width: 3px;
  }

  #wallet {
    @include margin(.5em);
    @include padding(.2em);
    border-style: solid;
    border-radius: 6px;
    border-width: 3px;
    border-color: lightgrey;
  }

  #balances {
    @include padding(.1em);
  }
}
</style>
