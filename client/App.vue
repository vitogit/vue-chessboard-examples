<script>
import _ from 'underscore';
import { ethers, Contract } from 'ethers';
import { formatEther } from 'ethers/lib/utils';

import LobbyContract from './contracts/Lobby';
import ChallengeContract from './contracts/Challenge';

import ethMixin from './mixins/ethereum';
import walletMixin from './mixins/wallet';
import contractsMixin from './mixins/contracts';
import challengeMixin from './mixins/challenges';

import ConnectWallet from './components/ConnectWallet.vue';

const { Web3Provider } = ethers.providers;

export default {
  name: 'App',
  components: { ConnectWallet },
  mixins: [ ethMixin, walletMixin, contractsMixin, challengeMixin ],
  data () {
    return {
      loading: true
    }
  },
  methods: {
    async init() {
      // Check whether a wallet is installed
      if (typeof window.ethereum === 'undefined') {
        console.error('Metamask is NOT installed!');
        this.wallet.installed = false;
        return;
      } else {
        console.log('Metamask is installed!');
        this.wallet.installed = true;
      }

      // Setup wallet connection
      this.eth.provider = new Web3Provider(window.ethereum);
      const accounts = await this.provider.listAccounts();
      if (accounts.length > 0) {
        this.eth.signer = this.provider.getSigner();
        // TODO Is BigInt the correct way to store this?
        [ this.wallet.address
        , this.wallet.balance ] = await Promise.all([
          this.signer.getAddress(),
          this.signer.getBalance().then(BigInt)
        ]);
        this.wallet.connected = true;
        console.log('Address', this.address);
        console.log('Balance', this.balance);
        console.log('Connected!');
      }

      // Try to initialize with the signer, else use provider
      // NOTE Would be better to only connect wallet if the
      //      signer is one of the players
      this.contracts.lobby = new Contract(
          process.env.VUE_APP_LOBBY_ADDR
        , LobbyContract.abi
        , this.signer || this.provider);
      const logs = await this.queryEventLogs(this.lobby
                                , this.lobby.filters.NewContract);
      await Promise.all(_.map(logs, async ev => {
        const [ from, to, contract ] = ev.args;
        this.challenges.register(from, to, contract);

        const challenge = new Contract(contract
                                     , ChallengeContract.abi
                                     , this.signer || this.provider);
        //this.contracts.challenges[contract] = challenge;
        // We can fire this off asyncronously since nothing is waiting on it
        this.queryEventLogs(challenge, challenge.filters.Modified)
            .then(events => {
              for (var ev of events) {
                this.challenges.modify(challenge.address
                                     , ev.args.state)
              }
            });
      }));

      // Finished loading
      this.loading = false;
    },
    async connectWallet() {
      await this.provider.send('eth_requestAccounts', [])
                .then(this.init);
    }
  },
  created() { this.init() }
}
</script>

<template>
  <div id='app'>
    <div id='sidebar'>
      <div class='bordered container'>
        <div id='brand'>Blockchain Chess Lounge</div>
        <div id='wallet'>
          <div class='flex pad-sm align-bottom border-bottom border-sm'>
            <div class='flex-shrink text-ml'>Account</div>
            <div v-if='isConnected' class='flex-1 flex-end'>
              {{ truncAddress(address) }}
            </div>
            <div v-else class='flex-1 flex-end'>---</div>
          </div>

          <div class='flex pad-sm align-bottom'>
            <div class='flex-shrink text-ml'>Balance</div>
            <div v-if='isConnected' class='flex-1 flex-end'>
              <div class='margin-sm-rl'>
                {{ formatBalance(balance) }}
              </div>
              <div class='flex-shrink'>ETH</div>
            </div>
            <div v-else class='flex-1 flex-end'>---</div>
          </div>
        </div>
        <div id='navigation'>
          <ConnectWallet
            :isInstalled='wallet.installed'
            :isConnected='wallet.connected'
            :onConnect='this.connectWallet'
            :onClick='() => this.$router.push("/lobby")'
          >Lounge</ConnectWallet>
          <router-link tag='button' to='/ai'>Fun Play</router-link>
          <router-link tag='button' to='/about'>Rules</router-link>
          <router-link tag='button' to='/settings'>Settings</router-link>
        </div>
      </div>
    </div>

    <div id='page' class='flex'>
      <router-view v-if='!loading' class='flex-1' />
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
        @extend .pad-lg-tb;
      }

      #brand {
        @extend .bold;
        @extend .text-xl;
        @extend .text-center;
      }

      #wallet {
        @extend .bordered;
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
