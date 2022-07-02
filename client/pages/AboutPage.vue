<template>
  <div id='about'>
    Thank you for visiting the Blockchain Chess Lounge, a peer-to-peer chess application that settles on the Ethereum blockchain.

    <h2>Rules</h2>

    <div class='summary'>
    The standard rules of chess apply in this game with a small number of exceptions.
    </div>

    <ol id='rules'>
      <li class='rule'>
      The game is considered finished when one king is captured.  Alternatively, one player may resign, or both players may agree to a stalemate.
      </li>
      <li class='rule'>
      The game does not force a player to move out of check nor does it prevent a player from moving into check.  If the king is in check at the end of a players turn, the other player will have an opportunity to capture the king and win the game.
      </li>
      <li class='rule'>
      The loser must voluntarily resign before their king is captured.  If their king is captured, their fair-play deposit will not be refunded.
      </li>
    </ol>

    <div class='container'>
      <button @click='() => this.$router.push("/lobby")'>Play!</button>
    </div>
  </div>
</template>

<style lang='scss'>
#about {
  #rules {
    padding-left: 1em;

    li {
      margin-bottom: .4em;
    }
  }

  .container {
    text-align: center;

    button {
      width: 7em;
      padding: .4em;
    }
  }
}
</style>
