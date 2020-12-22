
<script>
import { chessboard }  from 'vue-chessboard'

export default {
  name: 'editor',
  extends: chessboard,
  mounted() {
    this.board.set({
      movable: {
        color: 'both',
        free: true,
        events: { after: undefined }
      }
    })
  }
}
</script>
