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
    <h2>Profile</h2>

    <div id='player-info' class='flex'>
      <div class='label flex-1'>Address</div>
      <div class='info flex-1 flex-end'>{{ truncdAddr }}</div>
    </div>

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

    <div id='actions' class='flex'>
      <div class='container flex-1 flex-center'>
        <button
          @click='$router.push("/challenge/"+address)'
        >Challenge</button>
      </div>
      <div id='block-user' class='container flex-1 flex-end margin-1em'>
        <button class='margin-rl' disabled>Block</button>
        <button disabled>Report</button>
      </div>
    </div>

    <div id='match-history'>
      <h2>Match History</h2>
    </div>

    <div id='player-history'>
      <h2>Player History</h2>
    </div>
  </div>
</template>

<style lang='scss'>
@import '~bourbon';

#profile {
  max-width: 26em;

  #player-record {
    > .container {
      @include margin(1em);
      @include padding(.4em);
      text-align: center;
      min-width: 3em;
    }
  }

  #block-user {
    margin-right: 1em;
  }
}
</style>
