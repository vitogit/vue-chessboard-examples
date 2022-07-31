<script>
export default {
  name: 'ChallengeCard',
  props: {
    player: String,
    indicator: String
  }
}
</script>

<template>
  <div class='card'>
    <slot />

    <div v-if='indicator' id='status' class='flex-end'>
      <div id='circle' :style='{ "background-color": indicator }' />
    </div>
  </div>
</template>

<style lang='scss'>
@import '../styles';

.card {
  @extend .padded;
  @extend .bordered;
  @extend .flex-col;
  @extend .align-center;
  max-width: 5em;
  max-height: 5em;

  #status {
    position: absolute;
    width: 4.5em;

    #circle {
      margin-top: .1em;
      height: .5em;
      width: .5em;
      background-color: green;
      border-radius: 50%;
    }
  }
}
</style>
