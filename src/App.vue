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
    <button class="button is-light" @click="loadFen(fen)" v-for="fen in fens"  :key="fen + '-binded'">
      {{fen}}
    </button>

    <h1>Chessboard with binded onmove method. Shows threats on text area</h1>
    <chessboard @onMove="showInfo"/>
    <div>
      {{this.positionInfo}}
    </div>

    <h1>Chessboard with onpromote callback. </h1>
    It will show you a simple confirmation box asking if you want to promote to queen or rook.
    You can use a fancy piece selector instead of this simple confirmation box.
    <chessboard :onPromotion="promote"/>

    <h1>Multiple Chessboards with different fens. </h1>
    <div v-for="fen in fens" :key="fen">
       <chessboard :fen="fen" />
    </div>

    <h1>Extended Component (Play vs random AI). </h1>
    <p> You can extend the chessboard component to add new methods</p>
    <newboard/>

    <h1>Fully free piece movement. </h1>
    <p> You can extend the chessboard component to use all  <a href='https://github.com/ornicar/chessground/blob/master/src/config.ts'>chessgrounds configurations</a></p>
    <editor/>

  </div>
</template>

<script>
import {chessboard} from 'vue-chessboard'
import 'vue-chessboard/dist/vue-chessboard.css'
import newboard from './newboard.vue'
import editor from './editor.vue'

export default {
  name: 'app',
  components: {
    chessboard,
    newboard,
    editor
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
    },
    promote() {
      if (confirm("Want to promote to rook? Queen by default") ) {
        return 'r'
      } else {
        return 'q'
      }
    }
  },
  created() {
    this.fens = ['5rr1/3nqpk1/p3p2p/Pp1pP1pP/2pP1PN1/2P1Q3/2P3P1/R4RK1 b - f3 0 28',
                'r4rk1/pp1b3p/6p1/8/3NpP2/1P4P1/P2K3P/R6R w - - 0 22'
                ]
  }
}
</script>
