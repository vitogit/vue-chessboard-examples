<script>
import _ from 'underscore';
import gameMixin from '../mixins/games';
import ChessBoard from '../components/ChessBoard';

export default {
  name: 'ChessGame',
  components: { ChessBoard },
  mixins: [ gameMixin ],
  data() {
    return {
      waiting: false,
      didChooseMove: false,
      proposedMove: null,
    };
  },
  computed: {
    disableControls() { return (this.waiting || !this.gameLoaded || !this.inProgress) },
  },
  methods: {
    async chooseMove(from, to) {
      console.log('Choose move', from, to);
      this.tryMove(from, to);
      this.proposedMove = _.map([ from, to ], this.squareIndex);
      this.didChooseMove = true;
    },
    async submitMove() {
      const [ from, to ] = this.proposedMove;
      console.log('Submit move', from, to);
      await this.game.move(from, to);
      this.waiting = true;
      const eventFilter = this.game.filters.MovedPiece(this.wallet.address);
      this.game.once(eventFilter, (player, from, to) => {
        console.log('Move received', from, to);
        this.waiting = false;
        this.didChooseMove = false;
        this.refreshGame();
      });
    },
    async resign() {
      console.log('Resigning game', this.game.address);
      await this.game.resign();
      this.waiting = true;
      const eventFilter = this.game.filters.StateChanged(this.wallet.address, this.opponent);
      // FIXME
      this.game.once(eventFilter, (from, to, state) => {
        console.log('Game state changed to', state);
        this.waiting = false;
        this.refreshGame();
      });
    },
    async offerStalemate() {
      console.log('Signal stalemate', this.game.address);
      await this.game.signalStalemate();
      /*
      this.waiting = true;
      const eventFilter = this.game.filters.StateChanged(this.wallet.address, this.opponent);
      this.game.once(eventFilter, (from, to, state) => {
        console.log('Game state changed to', state);
        this.waiting = false;
        this.initGame(this.game.address);
      });
      */
    }
  },
  created() {
    const { contract } = this.$route.params;
    this.initGame(contract);
  }
}
</script>

<template>
  <div id='chess-game'>
    <div v-if='gameStatus === 0' class='text-xl margin-tb'>Current Game</div>
    <div v-else class='text-xl margin-tb'>Archived Game</div>

    <div class='flex-row'>
      <ChessBoard
        id='chessboard'
        class='margin-lg-rl'
        v-if='gameLoaded'
        v-bind='{ fen, orientation, currentMove, possibleMoves }'
        @onMove='chooseMove'
      />

      <div class='flex-1 flex-down'>
        <div class='flex-shrink bordered padded container'>
          <div id='contract-state' class='flex margin-tb'>
            <div class='flex-1 flex-center center-align'>
              <div class='text-sentance'>{{ formatGameStatus(gameStatus) }}</div>
            </div>
          </div>

          <div id='current-move' class='flex margin-tb'>
            <div class='flex-1 flex-center center-align'>
              <div v-if='isCurrentMove' class='text-sentance'>Your Move</div>
              <div v-else-if='isOpponentsMove' class='text-sentance'>Opponent's Move</div>
              <div v-else class='text-sentance'>Spectating</div>
            </div>
          </div>

          <div id='time-per-move' class='flex margin-tb'>
            <div class='flex-1 flex-center center-align'>
              <div class='margin-sm-rl'>{{ timePerMove }}</div>
              <div>Minutes</div>
            </div>
          </div>
        </div>

        <div v-if='isPlayer' class='flex-1 flex-down flex-center justify-end'>
          <button
            class='margin margin-lg-rl'
            @click='submitMove'
            :disabled='disableControls || !isCurrentMove || !didChooseMove'
          >Move</button>
          <button
            class='margin margin-lg-rl'
            @click='resign'
            :disabled='disableControls'
          >Resign</button>
          <button
            class='margin margin-lg-rl'
            @click='offerStalemate'
            :disabled='disableControls'
          >Stalemate</button>
        </div>
      </div>
    </div>

    <div class='flex'>
      <div id='game-info' class='flex-2 padded margin-lg-tb'>
        <div id='contract-state' class='flex margin-tb'>
          <div class='flex-shrink center-align text-ml text-bold'>Status</div>
          <div class='flex-1 flex-end center-align'>
            <div class='text-sentance'>{{ formatGameStatus(gameStatus) }}</div>
          </div>
        </div>

        <div id='current-move' class='flex margin-tb'>
          <div class='flex-shrink center-align text-ml text-bold'>Current Move</div>
          <div class='flex-1 flex-end center-align'>
            <div class='margin-rl text-sentance'>{{ currentMove }}</div>
          </div>
        </div>

        <div id='wager-info' class='flex margin-tb'>
          <div class='flex-shrink center-align text-ml text-bold'>Playing As</div>
          <div class='flex-1 flex-end center-align'>
            <div class='margin-rl text-sentance'>{{ playerColor }}</div>
          </div>
        </div>

        <div id='opponent' class='flex margin-tb'>
          <div class='flex-shrink center-align text-ml text-bold'>Opponent</div>
          <div class='flex-1 flex-end center-align'>
            <div class='margin-rl text-sentance'>{{ truncAddress(opponent) }}</div>
          </div>
        </div>

        <div id='time-per-move' class='flex margin-tb'>
          <div class='flex-shrink center-align text-ml text-bold'>Time Per Move</div>
          <div class='flex-1 flex-end center-align'>
            <div class='margin-rl'>{{ timePerMove }}</div>
            <div>Minutes</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang='scss'>
#chess-game {
  #game-controls {
    button {
      width: 6em;
    }
  }
}
</style>
