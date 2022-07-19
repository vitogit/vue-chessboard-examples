<script>
import _ from 'underscore';
import CloseIcon from 'bytesize-icons/dist/icons/close.svg';
import gameMixin from '../mixins/games';
import ChessBoard from '../components/ChessBoard';
import Modal from '../components/Modal';

export default {
  name: 'ChessGame',
  components: { ChessBoard, CloseIcon, Modal },
  mixins: [ gameMixin ],
  data() {
    return {
      waiting: false,
      didChooseMove: false,
      proposedMove: null,
      showModal: false
    };
  },
  computed: {
    disableControls() { return (this.waiting || !this.gameLoaded || !this.inProgress) },
  },
  watch: {
    isInCheckmate(isOver) { if (isOver && !this.didChooseMove) this.showModal = true },
    playerHasIllegalMoves(isOver) { this.showModal = true },
    opponentHasIllegalMoves(isOver) { this.showModal = true },
  },
  methods: {
    async chooseMove(from, to) {
      console.log('Choose move', from, to);
      const san = this.tryMove(from+to);
      this.proposedMove = san;
      this.didChooseMove = true;
    },
    async submitMove() {
      console.log('Submit move', this.proposedMove);
      await this.game.move(this.proposedMove, '0x00');
      this.waiting = true;
      const eventFilter = this.game.filters.MoveSAN(this.wallet.address);
      this.game.once(eventFilter, (player, san, flags) => {
        console.log('Move received', san, flags);
        this.waiting = false;
        this.didChooseMove = false;
        this.refreshGame();
      });
    },
    async resign() {
      console.log('Resigning game', this.game.address);
      this.closeModal();
      await this.game.resign();
      this.waiting = true;
      const { lobby } = this.contracts;
      const eventFilter = lobby.filters.GameFinished(this.game.address);
      lobby.once(eventFilter, game => {
        console.log('Resigned');
        this.waiting = false;
        this.refreshGame();
      });
    },
    closeModal() { this.showModal = false }
  },
  created() {
    const { contract } = this.$route.params;
    this.initGame(contract)
        .then(this.listenForMoves);
  }
}
</script>

<template>
  <div v-if='gameLoaded' id='chess-game'>
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
              <div v-if='isWinner || opponentInCheckmate' class='text-sentance'>You Won!</div>
              <div v-else-if='isLoser || isInCheckmate' class='text-sentance'>You Lost</div>
              <div v-else-if='inProgress' class='text-sentance'>In Progress</div>
              <div v-else class='text-sentance'>{{ formatGameStatus(gameStatus) }}</div>
            </div>
          </div>

          <div id='current-move' class='flex margin-tb'>
            <div class='flex-1 flex-center center-align'>
              <div v-if='gameOver' class='text-sentance'>Game Over</div>
              <div v-else-if='didChooseMove' class='text-sentance'>Submit Move</div>
              <div v-else-if='isCurrentMove' class='text-sentance'>Your Move</div>
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
            :disabled='disableControls || !didChooseMove'
          >Move</button>
          <button
            class='margin margin-lg-rl'
            @click='resign'
            :disabled='disableControls'
          >Resign</button>
          <button
            class='margin margin-lg-rl'
            :disabled='true'
          >Stalemate</button>
        </div>
      </div>
    </div>

    <div v-if='showModal'>
      <Modal v-if='inProgress && isInCheckmate' title='Checkmate!' @onClose='closeModal'>
        <div class='margin-lg-tb'>
        Oh no, you're in checkmate!  That's ok, you can try again.  Please resign now and save your opponent some time and gas fees.
        </div>

        <template #controls>
          <button
            class='margin margin-lg-rl'
            @click='resign'
            :disabled='disableControls'
          >Resign</button>
        </template>
      </Modal>
      <Modal v-else-if='playerHasIllegalMoves' title='Whoops...' @onClose='closeModal'>
        <div class='margin-lg-tb'>
        You submitted an illegal move.  If you encountered this in error, please contact the arbiters and we'll look into the issue.  Please resign now.
        </div>

        <template #controls>
          <button class='margin-rl'>Resign</button>
        </template>
      </Modal>
      <Modal v-else-if='opponentHasIllegalMoves' title='Oh My God!' @onClose='closeModal'>
        <div class='margin-lg-tb'>
        Your opponent submitted an illegal move.  Please dispute the move and an arbiter will review the game and declare you the winner.  We're sorry for the inconvenience.  Please play again.
        </div>

        <template #controls>
          <button class='margin-rl'>Dispute</button>
        </template>
      </Modal>
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
