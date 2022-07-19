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
      winner: null,
      halfmoves: 0,
      illegalMoves: []
    }
  },
  computed: {
    opponent() {
      if (this.isPlayer)
        return this.isWhitePlayer ? this.blackPlayer : this.whitePlayer;
      else
        return 'spectating';
    },
    isPlayer() {
      return [ this.whitePlayer, this.blackPlayer ].includes(this.wallet.address);
    },
    isWhitePlayer() { return this.wallet.address === this.whitePlayer },
    isBlackPlayer() { return this.wallet.address === this.blackPlayer },
    playerColorAbv() {
      if (this.isPlayer) return this.isWhitePlayer ? 'w' : 'b';
      else return 'x';
    },
    opponentColorAbv() {
      if (this.isPlayer) return this.isWhitePlayer ? 'b' : 'w';
      else return 'x';
    },
    orientation() {
      // Default white
      return this.playerColorAbv == 'b' ? 'black' : 'white'
    },
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
    isInStalemate() {
      this.halfmoves;         // Make reactive to halfmoves
      if (!this.gameEngine) return false;
      return (this.gameEngine.in_stalemate() || this.gameEngine.in_draw());
    },
    isInCheck() {
      this.halfmoves;         // Make reactive to halfmoves
      if (!this.gameEngine) return false;
      return ((this.gameEngine.turn() === this.playerColorAbv)
             && this.gameEngine.in_check());
    },
    isInCheckmate() {
      this.halfmoves;         // Make reactive to halfmoves
      if (!this.gameEngine) return false;
      return ((this.gameEngine.turn() === this.playerColorAbv)
             && this.gameEngine.in_checkmate());
    },
    opponentInCheck() {
      this.halfmoves;         // Make reactive to halfmoves
      if (!this.gameEngine) return false;
      return ((this.gameEngine.turn() === this.opponentColorAbv)
             && this.gameEngine.in_check());
    },
    opponentInCheckmate() {
      this.halfmoves;         // Make reactive to halfmoves
      if (!this.gameEngine) return false;
      return ((this.gameEngine.turn() === this.opponentColorAbv)
             && this.gameEngine.in_checkmate());
    },
    inProgress() {
      return this.gameStatus === gameStatus.started;
    },
    inReview() {
      return this.gameStatus === gameStatus.review;
    },
    gameOver() {
      //return this.isInCheckmate || this.opponentInCheckmate || this.isInStalemate;
      return this.gameStatus > gameStatus.started;
    },
    isWinner() {
      return this.winner === this.wallet.address;
    },
    isLoser() {
      return this.winner === this.opponent;
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

      if (this.gameStatus === gameStatus.finished) {
        this.winner = await game.winner();
      }

      const moves = await game.queryFilter(game.filters.MoveSAN);
      for (var ev of moves) {
        let [ player, san, flags ] = ev.args;
        await this.tryMove(san);
      }

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
    listenForMoves() {
      const eventFilter = this.game.filters.MoveSAN([ this.wallet.address, this.opponent ]);
      this.game.on(eventFilter, async (player, san, flags, ev) => {
        if (ev.blockNumber > this.latestBlock) {
          this.tryMove(san);
        }
      });
    },
    async tryMove(san) {
      const move = this.gameEngine.move(san, { sloppy: true });
      if (!move) {
        console.warn('Attempted illegal move', san);
        this.illegalMoves.push(san);
        return;
      }

      // move succeeded
      console.log(`Moved ${move.san} (${move.from} -> ${move.to})`);
      this.latestBlock = await this.wallet.provider.getBlockNumber();
      this.isWhiteMove = !this.isWhiteMove;
      this.halfmoves++;
      return move.san;
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
