import _ from 'underscore';
import { Chess, SQUARES } from 'chess.js';
import { Contract, BigNumber as BN } from 'ethers';
import ChallengeContract from '../contracts/Challenge';
import { gameStatus } from '../constants/bcl';
import useContractStore from '../stores/contracts';
import useLobbyStore from '../stores/lobby';
import ethMixin from './ethereum';
import walletMixin from './wallet';

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
      wagerAmount: BN.from(0),
      timePerMove: BN.from(0),
      timeOfLastMove: BN.from(0),
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
    playerColor() { 
      if (this.isWhitePlayer) return 'white';
      else if (this.isBlackPlayer) return 'black';
      else return 'spectator';
    },
    orientation() {
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
    },
    timeOfExpiry() {
      return this.timeOfLastMove.add(this.timePerMove)
    },
    timeUntilExpiry() {
      return Math.floor(this.timeOfExpiry - Date.now()/1000);
    },
    inProgress() { return this.gameStatus === gameStatus.started },
    isFinished() { return this.gameStatus === gameStatus.finished },
    inReview() { return this.gameStatus === gameStatus.review },
    gameOver() {
      //return this.isInCheckmate || this.opponentInCheckmate || this.isInStalemate;
      return this.gameStatus > gameStatus.started
          || this.isWinner
          || this.isLoser
    },
    isWinner() {
      return this.winner === this.wallet.address
          || this.opponentInCheckmate
          || this.opponentTimeExpired;
    },
    isLoser() {
      return this.winner === this.opponent
          || this.isInCheckmate
          || this.playerTimeExpired;
    },
  },
  methods: {
    async initGame(address) {
      console.log('Initialize game contract data', address);
      this.gameEngine = new Chess();
      this.game = this.contracts.game(address);
      if (!this.game) {
        this.contracts.registerGame(address);
        setTimeout(() => this.initGame(address), 1000);
        return;
      }

      [ this.gameStatus,
        this.whitePlayer,
        this.blackPlayer,
        this.isWhiteMove,
        this.timePerMove,
        this.timeOfLastMove
      ] = await Promise.all([
          this.game.state(),
          this.game.whitePlayer(),
          this.game.blackPlayer(),
          this.game.isWhiteMove(),
          this.game.timePerMove(),
          this.game.timeOfLastMove()
      ]);

      if (this.gameStatus === gameStatus.finished) {
        this.winner = await this.game.winner();
      }

      const moves = await this.game.queryFilter(this.game.filters.MoveSAN);
      for (var ev of moves) {
        let [ player, san, flags ] = ev.args;
        await this.tryMove(san);
      }

      // FIXME: This is a hack just to make some other bug go away.  If you
      //        comment this out then it will think it's the opponents move.
      this.isWhiteMove = await this.game.isWhiteMove();
      this.gameLoaded = true;
    },
    async refreshGame() {
      console.log('Refresh game data');
      [ this.gameStatus,
        this.isWhiteMove,
        this.timeOfLastMove
      ] = await Promise.all([
        this.game.state(),
        this.game.isWhiteMove(),
        this.game.timeOfLastMove()
      ]);

      this.lobby.updateGame(this.game.address);
    },
    listenForGames(cb) {
      const { lobby } = this.contracts;
      const eventFilter = lobby.filters.CreatedChallenge(null
                                                       , null
                                                       , this.wallet.address);
      lobby.on(eventFilter, (addr, from, to, ev) => {
        console.log('Received challenge', addr);
        //if (ev.blockNumber > this.latestBlock) {
          this.lobby.newChallenge(addr, from, to);
          if (cb) cb(addr, from, to);
        //}
      });
    },
    listenForMoves(cb) {
      const eventFilter = this.game.filters.MoveSAN([ this.wallet.address, this.opponent ]);
      this.game.on(eventFilter, async (player, san, flags, ev) => {
        if (ev.blockNumber > this.latestBlock) {
          this.refreshGame();
          // If the move is from the current player, then it will register twice.
          // We already called tryMove in the chooseMove function.
          if (player === this.opponent) this.tryMove(san);
          if (cb) cb(player, san, flags);
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
