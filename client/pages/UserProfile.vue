<script>
export default {
  name: 'UserProfile',
  data() {
    return {
      address: null
    };
  },
  computed: {
    truncdAddr() {
      if (this.address.match(/0x[a-fA-F0-9]{40}/) != null) {
        return `${this.address.substring(0, 6)}...${this.address.substring(38)}`
      } else {
        return this.address;
      }
    }
  },
  created() {
    let { address } = this.$route.params;
    this.address = address;
  }
}
</script>

<template>
  <div id='profile'>
    <div class='text-xl margin-tb'>Profile</div>

    <div id='player-record' class='flex flex-around'>
      <div class='bordered container flex-1'>
        <div class='label'>Games</div>
        <div class='info'>0</div>
      </div>
      <div class='bordered container flex-1'>
        <div class='label'>Wins</div>
        <div class='info'>0</div>
      </div>
      <div class='bordered container flex-1'>
        <div class='label'>Losses</div>
        <div class='info'>0</div>
      </div>
      <div class='bordered container flex-1'>
        <div class='label'>Draws</div>
        <div class='info'>0</div>
      </div>
    </div>

    <div id='player-info' class='flex center-align margin-lg'>
      <div class='flex-1 text-ml'>Address</div>
      <div class='flex-1 flex-end text-md'>{{ truncdAddr }}</div>
    </div>

    <div id='actions' class='flex margin-lg'>
      <div class='flex-1 flex-start'>
        <button
          @click='$router.push("/challenge/"+address)'
        >Challenge</button>
      </div>
      <div id='block-controls' class='flex-1 flex-end'>
        <button class='margin-rl' disabled>Block</button>
        <button disabled>Report</button>
      </div>
    </div>

    <div id='match-history'>
      <div class='text-lg margin-lg-tb'>Match History</div>
    </div>

    <div id='player-history'>
      <div class='text-lg margin-lg-tb'>Player History</div>
    </div>
  </div>
</template>

<style lang='scss'>
@import '../styles';

#profile {
  #player-record {
    > .container {
      @extend .margin-lg-rl;
      @extend .padded;
      @extend .text-center;
      min-width: 3em;
    }
  }
}
</style>
