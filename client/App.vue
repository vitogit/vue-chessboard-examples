<script>
import _ from 'underscore';
import { ethers, Contract } from 'ethers';
import { isAddress } from 'ethers/lib/utils';

import { challengeStatus, gameStatus } from './constants/bcl';

import LobbyContract from './contracts/Lobby';
import ChallengeContract from './contracts/Challenge';

import ethMixin from './mixins/ethereum';
import walletMixin from './mixins/wallet';
import contractsMixin from './mixins/contracts';
import challengeMixin from './mixins/challenges';

import ConnectWallet from './components/ConnectWallet.vue';
import AlertIcon from 'bytesize-icons/dist/icons/alert.svg';
import GithubIcon from 'bytesize-icons/dist/icons/github.svg';
import TwitterIcon from 'bytesize-icons/dist/icons/twitter.svg';

const { Web3Provider } = ethers.providers;

export default {
  name: 'App',
  components: { ConnectWallet, AlertIcon, GithubIcon, TwitterIcon },
  mixins: [ ethMixin, walletMixin, contractsMixin, challengeMixin ],
  data () {
    return {
      loading: false
    }
  },
  computed: {
    lobbyAddress() {
      switch (this.wallet.network) {
        case 'development':
        case 'unknown':
          return process.env.VUE_APP_LOCAL_ADDR
        case 'rinkeby':
          return process.env.VUE_APP_RINKEBY_ADDR
        case 'goerli':
          return process.env.VUE_APP_GOERLI_ADDR
      }
    }
  },
  methods: {
    async init() {
      // Check whether a wallet is installed
      if (typeof window.ethereum === 'undefined') {
        console.error('Metamask is NOT installed!');
        this.wallet.installed = false;
        return;
      }
      console.log('Metamask is installed!');
      this.wallet.installed = true;
      this.wallet.provider = new Web3Provider(window.ethereum);
      const accounts = await this.provider.listAccounts();
      if (accounts.length == 0) {
        console.log('Wallet is NOT connected');
        return;
      }
      this.wallet.signer = this.provider.getSigner();
      [ this.wallet.address
      , this.wallet.network
      , this.wallet.balance ] = await Promise.all([
          this.signer.getAddress()
        , this.provider.getNetwork().then(n => n.name)
        , this.signer.getBalance().then(BigInt)
      ]);
      this.wallet.connected = true;
      console.log('Connected!');
      console.log('Address', this.wallet.address);
      console.log('Balance', this.formatBalance(this.wallet.balance));
      console.log('Network', this.wallet.network);
      console.log('Contract', this.lobbyAddress);

      // Try to initialize with the signer, else use provider
      // NOTE Would be better to only connect wallet if the
      //      signer is one of the players
      const lobby = new Contract(this.lobbyAddress
                               , LobbyContract.abi
                               , this.signer || this.provider);
      this.contracts.lobby = lobby;
      const challenges = await this.fetchPlayerData();

      this.listenForChallenges((addr, from) => {
        console.log('Received incoming challenge from', from);
        this.playAudio('NewChallenge');
      });
    },
    async fetchPlayerData() {
      const { lobby } = this.contracts;

      const games = [];
      const events = await this.queryPlayerEvents(lobby, lobby.filters.CreatedChallenge);
      const challenges = await Promise.all(_.map(events, async ev => {
        const [ addr, from, to ] = ev.args;
        const challenge = await this.lobby.newChallenge(addr);
        const status = await challenge.state();
        if (status === challengeStatus.accepted) {
          const game = await challenge.game();
          games.push(game);
        }
        return addr;
      }));

      await Promise.all(_.map(games, this.lobby.newGame));
      this.lobby.games = this.lobby.games;

      return challenges;
    },
    async connectWallet() {
      await this.provider.send('eth_requestAccounts', [])
                .then(this.init);
    }
  },
  created() {
    this.loading = true;
    this.init().then(() => this.loading = false);
  }
}
</script>

<template>
  <div id='app'>
    <div id='body'>
      <div id='sidebar'>
        <div class='bordered container'>
          <div id='brand'>
            <img id='logo' src='./assets/logo1.png' />
            <div>The Blockchain</div>
            <div>Chess Lounge</div>
          </div>

          <div id='wallet'>
            <div class='flex pad-sm align-bottom border-bottom border-sm'>
              <div class='flex-shrink'>Account</div>
              <div class='flex-1 flex-end text-ms'>
                {{ isConnected ? truncAddress(address) : '---' }}
              </div>
            </div>

            <div class='flex pad-sm align-bottom'>
              <div class='flex-shrink text-md'>Balance</div>
              <div v-if='isConnected' class='flex-1 flex-end text-ms'>
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
            <router-link tag='button' to='/market'>Market</router-link>
            <router-link tag='button' to='/about'>About</router-link>
          </div>
        </div>
      </div>

      <div id='page' class='flex'>
        <router-view v-if='wallet.connected' class='flex-1' />
      </div>
    </div>

    <div id='footer'>
      <div class='flex flex-grow'>
        <div class='text-sm margin-sm'>
          Currently deployed to <a href='https://rinkebyfaucet.com/'>Rinkeby</a> and <a href='https://goerlifaucet.com/'>Goerli</a> testnets.
        </div>
        <div class='text-sm margin-sm'>Please file bugs :)</div>
      </div>
      <a href='https://twitter.com/TheChessLounge'>
        <TwitterIcon
          class='margin-sm'
          viewBox='0 0 64 64'
          width='14'
          height='14'
        />
      </a>
      <a href='https://github.com/jjduhamel/bcl'>
        <GithubIcon
          class='margin-sm'
          viewBox='0 0 64 64'
          width='14'
          height='14'
        />
      </a>
      <a href='https://github.com/jjduhamel/bcl/issues/new?template=bug_report.md'>
        <AlertIcon
          class='margin-sm'
          viewBox='0 0 32 32'
          width='14'
          height='14'
        />
      </a>
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
    max-height: 49em;
    max-width: 49em;
    height: 98%;
    @extend .margin-lg;
    @extend .flex-col;

    #body {
      @extend .flex;
      @extend .flex-grow;
      margin-bottom: 1em;
    }

    #footer {
      @extend .flex-shrink;
      @extend .border-top;
      @extend .border-sm;
      @extend .flex;
      @extend .flex-end;
    }

    #sidebar {
      @extend .flex-col;
      @extend .flex-shrink;
      max-width: 14em;

      > .container {
        @extend .padded;
        @extend .pad-lg-tb;
      }

      #logo {
        max-width: 69%;
      }

      #brand {
        @extend .bold;
        @extend .text-lg;
        @extend .text-center;
        @extend .margin-tb;
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
          @extend .margin-xl-rl;
        }
      }
    }

    #page {
      flex: 1;
      margin-left: 1em;
    }
  }
}
</style>
