<template>
  <div>
    <div class='text-lg'>Contract Data</div>

    <div class='flex'>
      <div class='flex-shrink'>Turn:</div>
      <div class='flex-1 flex-end'>{{ this.turn }}</div>
    </div>

    <div class='flex'>
      <div class='flex-shrink'>History:</div>
      <div class='flex-1 flex-end'>{{ this.history }}</div>
    </div>

    <div class='flex'>
      <div class='flex-shrink'>Fen:</div>
      <div class='flex-1 flex-end'>{{ this.fen }}</div>
    </div>
  </div>
</template>

<script>
export default {
  props: ['turn', 'history', 'fen']
}
</script>
