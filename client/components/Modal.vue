<script>
import CloseIcon from 'bytesize-icons/dist/icons/close.svg';

export default {
  name: 'Modal',
  components: { CloseIcon },
  props: [ 'title' ],
  emits: [ 'close' ]
};
</script>

<template>
  <div class='modal flex-down'>
    <div class='bordered container'>
      <div class='flex'>
        <div class='flex-1'></div>
        <div class='flex-grow text-lg text-center'>{{ title }}</div>
        <div class='flex-1 flex-end align-center'>
          <CloseIcon
            viewBox='0 0 32 32'
            width='16'
            height='16'
            @click='$emit("close")'
          />
        </div>
      </div>

      <div class='margin-lg-tb'>
        <slot />
      </div>

      <div class='flex flex-center'>
        <slot name='controls' />
      </div>
    </div>
  </div>
</template>

<style lang='scss'>
.modal {
  position: fixed;
  display: flex;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  padding: 4em;
  padding-left: 17em;
  //overflow: auto;
  z-index: 3;
  background-color: rgba(0,0,0,0.3);

  .container {
    position: relative;
    width: 100%;
    //max-width: 20em;
    max-width: 22em;
    padding: 1em;
    margin: 1em;
    background-color: white;
  }
}
</style>
