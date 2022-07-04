<script>
export default {
  name: 'UserChallengeOptions',
  props: [ 'color', 'address', 'wager' ]
}
</script>

<template>
  <div id='user-challenge-opts' class='flex-col'>
    <div class='margin-tb flex-center text-lg bold'>
      <slot />
    </div>

    <div class='margin-tb'>
      <div id='player-color' class='padded bordered container text-center'>
        <div class='color text-ml bold'>{{ color }}</div>
        <div class='address'>{{ address }}</div>
      </div>
    </div>

    <div class='margin-tb flex'>
      <div class='padded center-align text-ml'>Wager</div>

      <div class='flex-1 flex-end'>
        <input
          class='margin-rl'
          placeholder='0.000'
          @input='x => x'
        />

        <select
          id='wager-token'
          name='wager-token'
          class='flex-shrink'
        >
          <option value='ETH'>ETH</option>
          <option value='DAI' disabled>DAI</option>
          <option value='USDC' disabled>USDC</option>
          <option value='USDT' disabled>USDT</option>
        </select>
      </div>
    </div>
  </div>
</template>

<style lang='scss'>
#user-challenge-opts {
  max-width: 16em;

  input {
    max-width: 3.2em;
  }
}
</style>
