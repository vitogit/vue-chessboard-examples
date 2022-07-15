<template>
  <div class='blue merida'>
    <div ref='board' class='cg-wrap'></div> </br>
  </div>
</template>

<script>
import { Chessground } from 'chessground';
import '../assets/chessground.css';
import '../assets/theme.css';

export default {
  name: 'ChessBoard',
  props: [ 'fen', 'orientation', 'currentMove', 'possibleMoves' ],
  data() {
    return {
      board: null
    };
  },
  computed: {
    isCurrentMove() {
      return (this.currentMove === this.orientation) ? this.currentMove : false;
    }
  },
  methods: {
    reload() {
      if (!this.fen || !this.orientation || !this.currentMove) {
        console.warn('Fen was empty');
        return;
      }
      this.board.set({
        fen: this.fen,
        turnColor: this.currentMove,
        orientation: this.orientation,
        movable: {
          free: false,
          color: this.isCurrentMove,
          dests: this.possibleMoves,
          showDests: true,
          events: {
            after: (from, to) => this.$emit('onMove', from, to)
          }
        }
      });
    }
  },
  mounted() {
    this.board = new Chessground(this.$refs.board);
    this.reload();
    // TODO Promotions
  }
}
</script>

