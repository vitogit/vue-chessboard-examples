import { Contract } from 'ethers';
import { formatEther, parseEther } from 'ethers/lib/utils';
import ChallengeContract from '../contracts/Challenge';
import { challengeStatus } from '../constants/bcl';
import ethMixin from './ethereum';
import walletMixin from './wallet';
import useContractStore from '../stores/contracts';
import useLobbyStore from '../stores/lobby';

export default ({
  mixins: [ ethMixin, walletMixin ],
  setup() {
    const lobby = useLobbyStore();
    const contracts = useContractStore();
    return { lobby, contracts };
  },
  data() {
    return {
      challengeLoaded: false,
      challenge: null,
      challengeStatus: 0,
      sender: null,
      receiver: null,
      // player 1
      player1: null,
      p1Handle: null,
      p1Balance: 0,
      // player 2
      player2: null,
      p2Handle: null,
      p2Balance: 0,
      // challenge options
      p1IsWhite: true,
      wagerAmount: 0,
      //wagerToken: null,
      timePerMove: 15*60,
      timeUnits: 'minutes'
    }
  },
  computed: {
    isSender() { return this.address === this.sender },
    isReceiver() { return this.address === this.receiver },
    isPlayer() { return (this.address === this.player1)
                     || (this.address === this.player2);
    },
    isPlayer1() { return this.address === this.player1 },
    isPlayer2() { return this.address === this.player2 },
    p1Color() { return this.p1IsWhite ? 'white' : 'black' },
    p2Color() { return this.p1IsWhite ? 'black' : 'white' },
    statusPending() { return this.challengeStatus === challengeStatus.pending },
    // NOTE The order of these is chosen so that it will default to
    //      the current player defaults to player 1 is no account is
    //      authenticated
    currentPlayer() { return this.isPlayer2 ? this.player2 : this.player1 },
    playerHandle() { return this.isPlayer2 ? this.p2Handle : this.p1Handle },
    playerBalance() { return this.isPlayer2 ? this.p2Balance : this.p1Balance },
    currentBalance() { return this.playerBalance },
    startingColor() { return this.isPlayer2 ? this.p2Color : this.p1Color },
    balanceDiff() {
      if (this.playerBalance < this.wagerAmount) return this.wagerAmount.sub(this.playerBalance);
      else return 0;
    },
    extraBalance() {
      if (this.playerBalance > this.wagerAmount) return this.playerBalance.sub(this.wagerAmount);
      else return 0;
    },
    //extraBalance() { return 0 },
    opponent() { return this.isPlayer2 ? this.player1 : this.player2 },
    opponentHandle() { return this.isPlayer2 ? this.p1Handle : this.p2Handle },
    opponentBalance() { return this.isPlayer2 ? this.p1Balance : this.p2Balance },
    opponentColor() { return this.isPlayer1 ? this.p2Color : this.p1Color },
    startAsWhite: {
      get() {
        if (this.isPlayer1) return this.p1IsWhite;
        else if (this.isPlayer2) return !this.p1IsWhite;
        else throw new Error('Is not a player');
      },
      set(val) {
        if (this.isPlayer1) this.p1IsWhite = val;
        else if (this.isPlayer2) this.p1IsWhite = !val;
      }
    },
    startAsBlack() { return !this.startAsWhite },
    displayWager: {
      get() { return formatEther(this.wagerAmount) },
      set(val) { this.wagerAmount = parseEther(val) }
    },
    displayTPM: {
      get() {
        if (this.timeUnits == 'minutes') { return Math.round(this.timePerMove/60) }
        else if (this.timeUnits == 'hours') { return Math.round(this.timePerMove/(60*60)) }
        else if (this.timeUnits == 'days') { return Math.round(this.timePerMove/(60*60*24)) }
        else if (this.timeUnits == 'weeks') { return Math.round(this.timePerMove/(60*60*24*7)) }
      },
      set(val) {
        if (this.timeUnits == 'minutes') { this.timePerMove = val*60 }
        else if (this.timeUnits == 'hours') { this.timePerMove = val*60*60 }
        else if (this.timeUnits == 'days') { this.timePerMove = val*60*60*24 }
        else if (this.timeUnits == 'weeks') { this.timePerMove = val*60*60*24*7 }
      }
    }
  },
  methods: {
    async initChallenge(addr) {
      console.log('Initialize challenge contract data', addr);
      if (!this.provider) {
        console.warn('Wallet is NOT connected');
        setTimeout(() => this.initChallenge(addr), 200);
        return;
      }
      this.challenge = this.contracts.challenge(addr);
      await this.refreshChallenge();
      this.challengeLoaded = true;
    },
    async refreshChallenge() {
      console.log('Refresh challenge data', this.challenge.address);
      [ this.player1,
        this.p1Balance,
        this.player2,
        this.p2Balance,
        this.sender,
        this.receiver,
        this.challengeStatus,
        this.p1IsWhite,
        this.wagerAmount,
        this.timePerMove] = await Promise.all([
          this.challenge.player1(),
          this.challenge.p1Balance(),
          this.challenge.player2(),
          this.challenge.p2Balance(),
          this.challenge.sender(),
          this.challenge.receiver(),
          this.challenge.state(),
          this.challenge.p1IsWhite(),
          this.challenge.wagerAmount(),
          this.challenge.timePerMove()
      ]);

      try {
        this.p1Handle = await this.provider.lookupAddress(this.player1);
        this.p2Handle = await this.provider.lookupAddress(this.player2);
      } catch {}
      if (!this.p1Handle) this.truncAddress(this.player1);
      if (!this.p2Handle) this.truncAddress(this.player2);

      // Calculate which time units to use
      if (this.timePerMove > 60*60*24*7) this.timeUnits = 'weeks';
      else if (this.timePerMove > 60*60*24) this.timeUnits = 'days';
      else if (this.timePerMove > 60*60) this.timeUnits = 'hours';
      else this.timeUnits = 'minutes';

      return this.lobby.updateChallenge(this.challenge.address);
    },
    async listenForChallenges(cb) {
      const { lobby } = this.contracts;
      const eventFilter = lobby.filters.CreatedChallenge(null
                                                       , null
                                                       , this.wallet.address);
      let latestBlock = await this.provider.getBlockNumber();
      lobby.on(eventFilter, (addr, from, to, ev) => {
        if (ev.blockNumber > latestBlock) {
          console.log('Received challenge', addr);
          latestBlock = ev.blockNumber;
          this.lobby.newChallenge(addr, from, to);
          if (cb) cb(addr, from, to);
        }
      });
    },
    async handleAcceptedChallenge(cb) {
      const { lobby } = this.contracts;
      const eventFilter = lobby.filters.AcceptedChallenge(null
                                                        , null
                                                        , this.wallet.address);
      let latestBlock = await this.provider.getBlockNumber();
      lobby.on(eventFilter, (addr, from, to, ev) => {
        if (ev.blockNumber > latestBlock) {
          console.log('Challenge accepted', addr);
          latestBlock = ev.blockNumber;
          if (cb) cb(addr, from, to);
          const challenge = this.contracts.challenge(addr);
          challenge.game().then(game => {
            this.lobby.newGame(game);
            this.lobby.terminate(addr);
          });
        }
      });
    },
    async handleCanceledChallenge(cb) {
      const { lobby } = this.contracts;
      const eventFilter = lobby.filters.CanceledChallenge(null
                                                        , null
                                                        , this.wallet.address);
      let latestBlock = await this.provider.getBlockNumber();
      lobby.on(eventFilter, (addr, from, to, ev) => {
        if (ev.blockNumber > latestBlock) {
          console.log('Challenge cancelled', addr);
          if (cb) cb(addr, from, to);
          this.lobby.terminate(addr);
        }
      });
    },
    async refreshPlayerBalances() {
      if (!this.player1 || !this.player2) {
        console.error('Players are not initialized');
        return;
      }

      [ this.p1Balance, this.p2Balance ] = await Promise.all([
        this.fetchBalance(this.player1),
        this.fetchBalance(this.player2)
      ]);
    },
    formatChallengeStatus(status) {
      for (var s of Object.keys(challengeStatus)) {
        if (status == challengeStatus[s]) {
          return s;
        }
      }
      return 'unknown';
    }
  }
});
