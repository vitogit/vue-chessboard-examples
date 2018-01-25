<template>
  <div id="app">
    <chessboard @onMove="countThreats" :free="true" :showThreats="true"/>
  </div>
</template>

<script>
import chessboard from './components/chessboard/index'

export default {
  name: 'app',
  components: {
    chessboard
  },  
  data () {
    return {
      msg: 'Welcome to Your Vue.js App'
    }
  },
  methods: {
    countThreats(threats) {
      console.log("threats________",threats)
    }
  },
}
</script>
