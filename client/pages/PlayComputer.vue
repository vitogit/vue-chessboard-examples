<script>
import AiBoard from '../components/AiBoard.vue';

export default {
  name: 'PlayComputer',
  components: {
    AiBoard
  },
  data () {
    return {
      currentFen: '',
      positionInfo: null
    }
  },
  methods: {
    showInfo(data) {
      this.positionInfo = data;
    },
    loadFen(fen) {
      this.currentFen = fen;
    }
  }
}
</script>

<template>
  <div id='play-ai'>
    <AiBoard id='board' @onMove='showInfo' />
  </div>
</template>
