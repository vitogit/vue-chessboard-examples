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
        <div id='brand' class='font-smooth'>Blockchain Chess Lounge</div>
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
          <router-link tag='button' to='/about'>Rules</router-link>
          <router-link tag='button' to='/settings'>Settings</router-link>
        </div>
      </div>
    </div>

    <div id='page' class='flex'>
      <router-view class='flex-1' />
    </div>
  </div>
</template>

<style lang='scss'>
@import 'styles';

// Swallow the page
html, body {
  height: 100%;
  margin: 0;

  #app {
    max-width: 1024px;
    height: 95%;
    @extend .margin-lg;
    @extend .flex;

    #sidebar {
      @extend .flex-col;
      flex-basis: 14em;

      > .container {
        @extend .padded;
      }

      #brand {
        @extend .text-xl;
        @extend .bold;
        @extend .text-center;
      }

      #wallet {
        @extend .margin-lg-tb;
        @extend .margin-sm-rl;
        @extend .pad-rl;
        @extend .pad-sm-tb;
      }

      #navigation {
        @extend .flex-col;

        button {
          @extend .margin-tb;
          margin-right: 2em;
          margin-left: 2em;
        }
      }
    }

    #page {
      width: 28em;
      margin-left: 1em;
    }
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
