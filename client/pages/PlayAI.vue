<script>
import AiBoard from '../components/AiBoard.vue';
import ContractData from '../components/ContractData.vue';

export default {
  name: 'app',
  components: {
    AiBoard,
    ContractData,
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
  },
  created() {
  }
}
</script>

<template>
  <div id='play-ai'>
    <AiBoard id='board' @onMove='showInfo' />
    <ContractData id='contract' v-bind='positionInfo' />
  </div>
</template>

<style lang='scss'>
#play-ai {
  display: flex;

  #board {
    flex: 2;
  }

  #contract {
    flex: 1;
  }
}
</style>
