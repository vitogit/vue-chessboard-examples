<template>
  <div id="app">
    <h1>Simple Chessboard with legal moves</h1>
    <chessboard/>

    <h1>Simple Chessboard with free moves</h1>
    <chessboard :free="true"/>

    <h1>Simple Chessboard that shows threats for current position and player</h1>
    <chessboard :showThreats="true"/>
    
    <h1>Fen binded to the chessboard (load position when click on a new position)</h1>
    <chessboard :fen="currentFen"/>
    <button class="button is-light" @click="loadFen(fen)" v-for="fen in fens">
      {{fen}}
    </button>
    
    <h1>Chessboard with binded onmove method. Shows threats on text area</h1>
    <chessboard @onMove="showInfo"/>
    <div>
      {{this.positionInfo}}
    </div>
        
  </div>
</template>

<script>
import chessboard from './components/chessboard/index'
import {defaultPositions} from './PositionData.js'

export default {
  name: 'app',
  components: {
    chessboard
  },  
  data () {
    return {
      currentFen: '',
      positionInfo: null
    }
  },
  methods: {
    showInfo(data) {
      this.positionInfo = data
    },
    loadFen(fen) {
      this.currentFen = fen
    }
  },
  created() {
    this.fens = defaultPositions().map(function(p) {
       return p.fen
    }).splice(0,3)
    
  }  
}
</script>
