
<script>
import { chessboard }  from 'vue-chessboard'
import bus from './bus.js'

export default {
  name: 'newboard',
  extends: chessboard,
  methods: {
    undo() {
      this.game.undo()
      this.board.set({fen: this.game.fen()})
    },
    userPlay() {
      return (orig, dest) => {
        if (this.isPromotion(orig, dest)) {
          this.promoteTo = this.onPromotion()
        }
        this.game.move({from: orig, to: dest, promotion: this.promoteTo}) // promote to queen for simplicity
        this.board.set({
          fen: this.game.fen()
        })
        this.calculatePromotions()
        this.aiNextMove()
      };
    },
    aiNextMove() {
      let moves = this.game.moves({verbose: true})
      let randomMove = moves[Math.floor(Math.random() * moves.length)]
      this.game.move(randomMove)

      this.board.set({
        fen: this.game.fen(),
        turnColor: this.toColor(),
        movable: {
          color: this.toColor(),
          dests: this.possibleMoves(),
          events: { after: this.userPlay()},
        }
      });
    },
  },
  mounted() {
    this.board.set({
      movable: { events: { after: this.userPlay()} },
    })
  },
  created() {
    bus.$on('undo', () => {
      this.undo()
    })
  }
}
</script>
