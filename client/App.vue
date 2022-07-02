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
        <router-link tag='button' to='/about'>About</router-link>
        <router-link tag='button' to='/lobby'>Lobby</router-link>
        <router-link tag='button' to='/ai'>Fun Play</router-link>
        <router-link tag='button' to='/settings'>Settings</router-link>
      </div>
    </div>
    <div id='body'>
      <router-view />
    </div>
  </div>
</template>

<style lang='scss'>
@import '~bourbon';
@import '~bourbon-neat';

#app {
  max-width: 1024px;
  display: flex;

  #sidebar {
    flex: 1;

    #{$all-buttons} {
      flex-grow: 1;
    }
  }

  #body {
    flex: 4;
    display: flex;

    #board {
      flex-shrink: 1;
    }

    #contract {
      flex: 1;
    }
  }
}

#sidebar {
  @include grid-container;
  $sidebar-buttons: (columns: 1, gutter: 2em);
  $crypto-wallet: (columns: 1, gutter: 1em);

  #wallet {
    @include grid-column(1, $crypto-wallet);
  }

  #{$all-buttons} {
    @include grid-column(1, $sidebar-buttons);
  }
}

#sidebar {
  padding: .5em;
  border-style: solid;
  border-radius: 6px;
  border-width: 3px;

  #header {
    @include margin(6px 6px);
    font-size: 28px;
    font-weight: bold;
    text-align: center;
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

    #balances {
      @include padding(.1em);
    }
  }
}

#body {
    @include padding(16px 16px);
}
</style>
