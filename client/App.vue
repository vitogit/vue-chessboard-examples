<script>
import CryptoWallet from './components/CryptoWallet.vue';
import ConnectWallet from './components/ConnectWallet.vue';
import useWalletStore from './stores/wallet';

import { ethers } from 'ethers';
const { Web3Provider } = ethers.providers;
const { formatEther } = ethers.utils;

export default {
  name: 'App',
  components: {
    CryptoWallet,
    ConnectWallet,
  },
  data () {
    return {
      //provider: null,
      //signer: null,
      //address: null,
      network: null
    }
  },
  methods: {
    async connectWallet() {
      const provider = new Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      // FIXME: How to handle if this fails?
      console.log('Connected!');
      this.wallet.connected = true;
      [ this.wallet.address, this.network ] = await Promise.all([
        signer.getAddress(),
        provider.getNetwork()
      ]);
      console.log('Address', this.wallet.address);
      console.log('Network', this.network.name);
      console.log('Chain', this.network.chainId);
      this.wallet.signer = signer;
      this.wallet.provider = provider;
      this.updateBalances();
    },
    async updateBalances() {
      const { signer } = this.wallet;
      var balance = await signer.getBalance();
      console.log('Balance', formatEther(balance));
      this.wallet.ethBalance = BigInt(balance);
    }
  },
  setup() {
    const wallet = useWalletStore();

    if (typeof window.ethereum === 'undefined') {
      console.log('Metamask is NOT installed!');
    } else {
      console.log('Metamask is installed!');
      wallet.installed = true;
    }

    return { wallet };
  },
  created() {
    if (this.wallet.installed) {
      this.connectWallet();
    }
  }
}
</script>

<template>
  <div id='app'>
    <div id='sidebar'>
      <div class='container bordered'>
        <div id='header' class='font-smooth'>Blockchain Chess Lounge</div>
        <CryptoWallet
          id='wallet'
          class='bordered'
          :ethBalance='wallet.ethBalance'
          :daiBalance='wallet.daiBalance'
        />
        <div id='navigation'>
          <ConnectWallet
            :isInstalled='wallet.installed'
            :isConnected='wallet.connected'
            :onClick='() => this.$router.push("/lobby")'
          >Lobby</ConnectWallet>
          <router-link tag='button' to='/ai'>Fun Play</router-link>
          <router-link tag='button' to='/about'>About</router-link>
          <router-link tag='button' to='/settings'>Settings</router-link>
        </div>
      </div>
    </div>

    <div id='page'>
      <router-view />
    </div>
  </div>
</template>

<style lang='scss'>
@import '~bourbon';

// Swallow the page
html, body {
  height: 100%;
  margin: 0;

  #app {
    max-width: 1024px;
    height: 95%;
    @include margin(1em 1em);

    #page {
      max-width: 36em;
    }
  }
}

// Flexboxes
#app {
  display: flex;

  #sidebar {
    flex-basis: 14em;
    display: flex;
    flex-direction: column;

    #navigation {
      display: flex;
      flex-direction: column;
    }
  }

  #page {
    flex: 1;
  }

  .flex {
    display: flex;
  }

  .flex-col {
    display: flex;
    flex-direction: column;
  }

  .flex-center {
    display: flex;
    justify-content: center;
  }

  .flex-end {
    display: flex;
    justify-content: flex-end;
  }

  .flex-between {
    display: flex;
    justify-content: space-between;
  }

  .flex-around {
    display: flex;
    justify-content: space-around;
  }

  .center-align {
    display: flex;
    align-items: center;
  }

  .flex-1 { flex: 1; }
  .flex-shrink { flex-shrink: 1; }
  .flex-grow { flex-shrink: 1; }
}

// Margins and padding
#app {
  #sidebar {
    > .container {
      @include padding(.5em);
    }

    #wallet {
      @include margin(1em .2em);
      @include padding(.2em .4em);
    }

    button {
      @include margin(.4em 2em);
    }
  }

  #page {
    @include margin(.4em 1em);
  }

  .padded {
    @include padding(.4em);
  }

  .margin {
    margin: .4em;
  }

  .margin-1em {
    margin: 1em;
  }

  .margin-rl {
    @include margin(0 .4em);
  }

  .margin-tb {
    @include margin(.4em 0);
  }
}

// Borders
#app {
  .bordered {
    border-style: solid;
    border-radius: 6px;
    border-width: 3px;
  }
}

// Fonts and text
#app {
  #header {
    @extend .text-xl;
    @extend .bold;
    @extend .text-center;
  }

  .text-xl {
    font-size: 28px;
  }

  .text-lg {
    font-size: 24px;
  }

  // medium-large
  .text-ml {
    font-size: 20px;
  }

  .text-md {
    font-size: 16px;
  }

  .bold {
    font-weight: bold;
  }

  .text-center {
    text-align: center;
  }

  .text-right {
    text-align: right;
  }
}

// Muted theme
#app {
  * {
    background-color: transparent;
    color: black;
    border-color: black;
  }

  button {
    @extend .bordered;
    @extend .padded;
    @extend .text-md;
  }

  button:disabled {
    color: lightgrey;
    border-color: lightgrey;
  }

  input {
    @extend .bordered;
    @extend .padded;
    @extend .text-md;
  }

  select {
    @extend .bordered;
    @extend .padded;
    @extend .text-md;
    text-align: center;
  }
}
</style>
