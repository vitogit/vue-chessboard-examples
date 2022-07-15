import _ from 'underscore';
import { Chess, SQUARES } from 'chess.js';
import { Contract } from 'ethers';
import ChallengeContract from '../contracts/Challenge';

import { gameStatus } from '../constants/bcl';

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
      game: null,
      gameEngine: null,
      gameLoaded: false,
      gameStatus: gameStatus.created,
      fen: null,
      whitePlayer: null,
      blackPlayer: null,
      isWhiteMove: true,
      wagerAmount: 0,
      timePerMove: 0
    }
  },
  computed: {
    isPlayer() {
      return [ this.whitePlayer, this.blackPlayer ].includes(this.wallet.address);
    },
    isWhitePlayer() { return this.wallet.address === this.whitePlayer },
    isBlackPlayer() { return this.wallet.address === this.blackPlayer },
    playerColor() {
      if (this.isPlayer) return this.isWhitePlayer ? 'white' : 'black';
      else return 'spectating';
    },
    orientation() { return this.playerColor == 'black' ? 'black' : 'white' },
    currentMove() { return this.isWhiteMove ? 'white' : 'black' },
    isCurrentMove() {
      if (this.isPlayer)
        return this.isWhitePlayer ? this.isWhiteMove : !this.isWhiteMove
      else return this.isWhiteMove;
    },
    isOpponentsMove() {
      if (this.isPlayer)
        return this.isWhitePlayer ? !this.isWhiteMove : this.isWhiteMove
      else return !this.isWhiteMove;
    },
    inProgress() {
      return [ gameStatus.created, gameStatus.started ].includes(this.gameStatus)
    },
    opponent() {
      if (this.isPlayer)
        return this.isWhitePlayer ? this.blackPlayer : this.whitePlayer;
      else
        return 'spectating';
    },
    //fen() { return this.gameEngine ? this.gameEngine.fen() : null }
    possibleMoves() {
      let out = new Map();
      SQUARES.forEach(sq => {
        const ms = this.gameEngine.moves({ square: sq, verbose: true });
        if (ms.length > 0) out.set(sq, ms.map(m => m.to));
      });
      return out;
    }
  },
  methods: {
    async initGame(address) {
      this.gameEngine = new Chess();
      this.game = await this.initGameContract(address);
      this.gameLoaded = true;
    },
    async initGameContract(address) {
      console.log('Initialize game contract data', address);
      const game = this.contracts.game(address);

      [ this.gameStatus,
        this.whitePlayer,
        this.blackPlayer,
        this.isWhiteMove,
        this.timePerMove
      ] = await Promise.all([
          game.state(),
          game.whitePlayer(),
          game.blackPlayer(),
          game.isWhiteMove(),
          game.timePerMove()
      ]);

      //this.gameEngine.clear();
      const moves = await game.queryFilter(game.filters.MovedPiece);
      await _.each(moves, async ev => {
        let [ player, from, to ] = ev.args;
        [ from, to ] = _.map([ from, to ], this.squareLocation);
        try {
          this.tryMove(from, to);
        } catch(err) {
          if (/Attempted illegal move/.test(err.message)) {
            /* TODO prompt user to issue a challenge */
          }
        }
      });
      this.fen = this.gameEngine.fen();

      if (this.isCurrentMove && this.gameEngine.in_checkmate()) {
        console.log('You\'re in checkmate!');
        /* TODO prompt user to resign */
      }

      return game;
    },
    async refreshGame() {
      console.log('Refresh game data');
      [ this.gameStatus,
        this.isWhiteMove
      ] = await Promise.all([
          this.game.state(),
          this.game.isWhiteMove()
      ]);
    },
    async tryMove(from, to) {
      const move = this.gameEngine.move({ from, to });
      if (!move) {
        throw new Error(`Attempted illegal move ${from} -> ${to}`);
      } else {
        console.log(`Moved ${from} -> ${to} (${move.san})`);
      }

      if (this.gameEngine.in_checkmate()) {
        console.log('  -- Checkmate --');
      } else if (this.gameEngine.in_check()) {
        console.log('  -- Check --');
        /* TODO signal checkmate on the next move */
      } else if (this.gameEngine.in_stalemate()
              || this.gameEngine.in_draw()) {
        console.log('  -- Stalemate --');
        /* TODO signal stalemate */
      }
    },
    squareLocation(loc) {
      if (/^0x[0-9a-f]{2}$/.test(loc)) {
        const [ rank, file ] = _.last(loc, 2);
        const _l_Rank = 'abcdefgh'[Number(rank)-1];
        const _l_File = Number(file);
        return _l_Rank + _l_File;
      } else {
        console.error('Invalid square index', loc);
        throw new Error(`Invalid square location ${loc}`);
      }

    },
    squareIndex(loc) {
      if (/^[a-hA-H][1-8]$/.test(loc)) {
        const [ rank, file ] = loc;
        const _n_Rank = _.indexOf('abcdefgh', rank.toLowerCase(), true)+1;
        const _n_File = Number(file);
        return (_n_Rank << 4) + _n_File;
      } else {
        //console.error('Invalid move', move);
        throw Error('Invalid location', move);
      }
    },
    formatGameStatus(status) {
      for (var s of Object.keys(gameStatus)) {
        if (status == gameStatus[s]) {
          return s;
        }
      }
      return 'unknown';
    }
  }
});
