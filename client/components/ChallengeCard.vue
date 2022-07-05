<script>
export default {
  name: 'UserChallengeOptions',
  props: [ 'color', 'address', 'wager', 'token' ]
}
</script>

<template>
  <div id='challenge-card' class='pad flex-col'>
    <div id='header' class='margin-tb flex-center'>
      <slot />
    </div>

    <div id='player-color' class='pad text-center'>
      <div class='bold text-ml'>{{ color }}</div>
      <div class='text-md'>{{ address }}</div>
    </div>

    <div class='margin-sm-tb flex'>
      <div class='pad center-align text-ml'>Wager</div>

      <div class='flex-1 flex-end center-align'>
        <div class='text-ml'>
          {{ parseFloat(wager).toFixed(3) }}
        </div>
        <div class='text-ml margin-rl'>
          {{ token.toUpperCase() }}
        </div>
      </div>
    </div>
  </div>
</template>

<style lang='scss'>
@import '../styles';

#challenge-card {
  max-width: 10.5em;
  @extend .bordered;
  @extend .margin-lg-rl;
  @extend .margin-tb;

  #header {
    @extend .bold;
    @extend .text-lg;
  }

  #player-color {
    @extend .bordered;
    @extend .margin-sm-tb;

    div {
      padding-top: .1em;
      padding-bottom: .1em;
    }
  }
}
</style>
