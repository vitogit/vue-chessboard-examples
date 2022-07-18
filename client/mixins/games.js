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
      whitePlayer: null,
      blackPlayer: null,
      isWhiteMove: true,
      wagerAmount: 0,
      timePerMove: 0,
      halfmoves: 0,
      illegalMoves: []
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
      // FIXME Contract is changing.  created removed
      return [ gameStatus.created, gameStatus.started ].includes(this.gameStatus)
    },
    opponent() {
      if (this.isPlayer)
        return this.isWhitePlayer ? this.blackPlayer : this.whitePlayer;
      else
        return 'spectating';
    },
    isInStalemate() {
      this.halfmoves;         // Make reactive to halfmoves
      if (!this.gameEngine) return false;
      return (this.gameEngine.in_stalemate() || this.gameEngine.in_draw());
    },
    isInCheck() {
      this.halfmoves;         // Make reactive to halfmoves
      if (!this.gameEngine) return false;
      return (this.isCurrentMove && this.gameEngine.in_check());
    },
    isInCheckmate() {
      this.halfmoves;         // Make reactive to halfmoves
      if (!this.gameEngine) return false;
      return (this.isCurrentMove && this.gameEngine.in_checkmate());
    },
    opponentInCheck() {
      this.halfmoves;         // Make reactive to halfmoves
      if (!this.gameEngine) return false;
      return (this.isOpponentsMove && this.gameEngine.in_check());
    },
    opponentInCheckmate() {
      this.halfmoves;         // Make reactive to halfmoves
      if (!this.gameEngine) return false;
      return (this.isOpponentsMove && this.gameEngine.in_checkmate());
    },
    gameOver() {
      return this.isInCheckmate || this.opponentInCheckmate || this.isInStalemate;
    },
    playerIllegalMoves() {
      return _.filter(this.illegalMoves, m => (m.player === this.wallet.address));
    },
    opponentIllegalMoves() {
      let out = _.filter(this.illegalMoves, m => (m.player === this.opponent));
      return _.filter(this.illegalMoves, m => (m.player === this.opponent));
    },
    playerHasIllegalMoves() { return (this.playerIllegalMoves.length > 0) },
    opponentHasIllegalMoves() { return (this.opponentIllegalMoves.length > 0) },
    possibleMoves() {
      this.halfmoves;         // Make reactive to halfmoves
      let out = new Map();
      SQUARES.forEach(sq => {
        const ms = this.gameEngine.moves({ square: sq, verbose: true });
        if (ms.length > 0) out.set(sq, ms.map(m => m.to));
      });
      return out;
    },
    fen() {
      this.halfmoves;         // Make reactive to halfmoves
      return this.gameEngine.fen();
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

      const moves = await game.queryFilter(game.filters.MovedPiece);
      for (var ev of moves) {
        let [ player, from, to ] = ev.args;
        [ from, to ] = _.map([ from, to ], this.squareLocation);
        try {
          this.tryMove(from, to);
        } catch(err) {
          if (/Attempted illegal move/.test(err.message)) {
            console.warn(err.message, player);
            this.illegalMoves.push({ player, from, to });
          }
        }
      }
      //this.fen = this.gameEngine.fen();

      // FIXME: This is a hack just to make some other bug go away.  If you
      //        comment this out then it will think it's the opponents move.
      this.isWhiteMove = await game.isWhiteMove();

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
    tryMove(from, to) {
      const move = this.gameEngine.move({ from, to });
      if (!move) {
        throw new Error(`Attempted illegal move ${from} -> ${to}`);
      } else {
        // move succeeded
        console.log(`Moved ${from} -> ${to} (${move.san})`);
        this.isWhiteMove = !this.isWhiteMove;
        this.halfmoves++;
      }
    },
    printGameStatus() {
      if (this.opponentInCheckmate) {
        console.log('  -- Checkmate --');
        /* TODO signal checkmate on the next move */
      } else if (this.opponentInCheck) {
        console.log('  -- Check --');
      } else if (this.isInStalemate) {
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
