import { Contract } from 'ethers';
import ChallengeContract from '../contracts/Challenge';

import { challengeStatus } from '../constants/bcl';

import ethMixin from './ethereum';
import walletMixin from './wallet';

import useChallengeStore from '../stores/challenges';

export default ({
  mixins: [ ethMixin, walletMixin ],
  setup() {
    const challenges = useChallengeStore();
    return { challenges };
  },
  data() {
    return {
      challengeLoaded: false,
      challenge: null,
      challengeStatus: 0,
      sender: null,
      receiver: null,
      player1: null,
      player2: null,
      p1Balance: 0,
      p2Balance: 0,
      p1IsWhite: true,
      wagerAmount: 0,
      timePerMove: 0
    }
  },
  computed: {
    isPending() { return this.challengeStatus === challengeStatus.pending },
    isSender() { return this.address === this.sender },
    isReceiver() { return this.address === this.receiver },
    isPlayer() {
      return (this.address === this.player1)
          || (this.address === this.player2);
    },
    isPlayer1() { return this.address === this.player1 },
    isPlayer2() { return this.address === this.player2 },
    p1Color() { return this.p1IsWhite ? 'white' : 'black' },
    p2Color() { return this.p1IsWhite ? 'black' : 'white' },
    // NOTE The order of these is chosen so that it will default to
    //      the current player defaults to player 1 is no account is
    //      authenticated
    currentPlayer() { return this.isPlayer2 ? this.player2 : this.player1 },
    opponent() { return this.isPlayer2 ? this.player1 : this.player2 },
    startingColor() { return this.isPlayer2 ? this.p2Color : this.p1Color },
    opponentColor() { return this.isPlayer1 ? this.p2Color : this.p1Color },
    whitePlayer() { return this.startingColor == 'white' ? this.address : this.opponent },
    blackPlayer() { return this.startingColor == 'black' ? this.address : this.opponent },
    currentBalance() { return this.isPlayer2 ? this.p2Balance : this.p1Balance },
    opponentBalance() { return this.isPlayer2 ? this.p1Balance : this.p2Balance }
  },
  methods: {
    async initChallenge(address) {
      console.log('Initialize challenge contract', address);
      this.challenge = new Contract(address
                                  , ChallengeContract.abi
                                  , this.signer || this.provider);
      /* FIXME: Only do this if you're one of the players
                                  , this.provider);
      if (this.signer) {
        this.challenge.connect(this.signer);
      }
      */

      let proposal;
      [ this.player1,
        this.player2,
        this.sender,
        this.receiver,
        this.challengeStatus,
        proposal] = await Promise.all([
          this.challenge.player1(),
          this.challenge.player2(),
          this.challenge.sender(),
          this.challenge.receiver(),
          this.challenge.state(),
          this.challenge.proposal()
      ]);

      [ this.p1IsWhite
      , this.wagerAmount
      , this.timePerMove ] = proposal;
      this.refreshPlayerBalances();

      this.challengeLoaded = true;
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
