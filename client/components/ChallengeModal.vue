<script>
import Modal from './Modal';
import WhitePawn from '../assets/icons/whitepawn.svg';
import BlackPawn from '../assets/icons/blackpawn.svg';

export default {
  components: { Modal, WhitePawn, BlackPawn },
  props: {
    title: String,
    startAsWhite: Boolean,
    wagerAmount: [ Number, String ],
    //wagerToken: String,
    timePerMove: [ Number, String ],
    timeUnits: String
  },
  emits: [ 'update:color', 'update:tpm', 'update:time-units', 'update:wager', 'send', 'close' ]
}
</script>

<template>
  <Modal id='challenge-modal' :title='title' @close='$emit("close")'>
    <div class='flex margin-tb'>
      <div class='flex-1 center-align text-ml text-bold'>Play As</div>
      <div class='flex-1 flex align-center margin-lg-rl'>
        <div class='flex-1 flex-center'>
          <WhitePawn class='choose-color'
                     :class='startAsWhite && "bordered"'
                     @click='$emit("update:color", true)' />
        </div>
        <div class='margin-lg-rl' />
        <div class='flex-1 flex-center'>
          <BlackPawn class='choose-color'
                     :class='!startAsWhite && "bordered"'
                     @click='$emit("update:color", false)' />
        </div>
      </div>
    </div>

    <div class='flex margin-tb'>
      <div class='flex-shrink align-center text-ml'>Wager Amount</div>
      <div class='flex-1 flex-end'>
        <input class='margin-rl'
               :value='wagerAmount'
               @input='$emit("update:wager", $event.target.value)'
               placeholder='0.000' />

        <select name='wager-token' class='flex-1'>
          <option value='eth'>ETH</option>
          <option value='dai' disabled>DAI</option>
          <option value='usdc' disabled>USDT</option>
          <option value='usdc' disabled>USDC</option>
        </select>
      </div>
    </div>

    <div class='flex margin-tb'>
      <div class='flex-shrink align-center text-ml'>Time Per Move</div>
      <div class='flex-1 flex-end'>
        <input class='margin-rl flex-1'
               :value='timePerMove'
               @input='$emit("update:tpm", $event.target.value)'
        />
        <select name='tpm-units' class='flex-1'
          :value='timeUnits'
          @input='$emit("update:time-units", $event.target.value)'
        >
          <option value='minutes'>Minutes</option>
          <option value='hours'>Hours</option>
          <option value='days'>Days</option>
          <option value='weeks'>Weeks</option>
        </select>
      </div>
    </div>

    <template #controls>
      <div id='game-controls' class='flex flex-center margin-tb'>
        <button
          class='margin-rl'
          @click='$emit("send")'
        >Send</button>

        <button
          class='margin-rl'
          @click='$emit("close")'
        >Cancel</button>
      </div>
    </template>
  </Modal>
</template>

<style lang='scss'>
#challenge-modal {
  input { max-width: 4.2em; }
  select { max-width: 6em; }
  svg.choose-color {
    height: 3em;
    width: 3em;
  }
}
</style>
