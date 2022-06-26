<template>
  <div>
    <div class='header'>Contract Data</div>
    <div class='field'>
      <div class='title'>Turn:</div>
      <div class='value'>{{ this.turn }}</div>
    </div>
    <div class='field'>
      <div class='title'>History:</div>
      <div class='value'>{{ this.history }}</div>
    </div>
    <div class='field'>
      <div class='title'>Fen:</div>
      <div class='value'>{{ this.fen }}</div>
    </div>
  </div>
</template>

<script>
export default {
  props: ['turn', 'history', 'fen']
}
</script>

<style lang='scss'>
.header {
  font-size: 24px;
  font-weight: bold;
}

.field {
  display: flex;
  flex-wrap: 1;

  .title {
    flex: 1;
  }

  .value {
    flex: 9;
  }
}
</style>
