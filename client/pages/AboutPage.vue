<template>
  <div id='about'>
    <div class='text-xl margin-tb'>Rules</div>

    <div class='summary'>
    The standard rules of chess apply in this game with a small number of exceptions.
    </div>

    <ol id='rules'>
      <li>
      The game is considered finished when one king is captured.  Alternatively, one player may resign, or both players may agree to a stalemate.
      </li>
      <li>
      The game does not force a player to move out of check nor does it prevent a player from moving into check.  If the king is in check at the end of a players turn, the other player will have an opportunity to capture the king and win the game.
      </li>
      <li>
      The loser must voluntarily resign before their king is captured.  If the king is captured, the loser's fair-play deposit will not be refunded.
      </li>
    </ol>

    <div class='flex-center margin-lg'>
      <button @click='() => this.$router.push("/lobby")'>Play!</button>
    </div>
  </div>
</template>

<style lang='scss'>
#about {
  width: 32em;

  #rules {
    padding-left: 1em;
    li { margin-bottom: .4em; }
  }


  button {
    width: 7em;
    text-align: center;
  }
}
</style>
