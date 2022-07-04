<script>
import useWalletStore from '../stores/wallet';
import UserOpts from '../components/UserChallengeOpts';
import { isAddress, getAddress } from 'ethers/lib/utils';

export default {
  name: 'ChallengeUser',
  components: { UserOpts },
  data () {
    return {
      opponent: null,
      playAsWhite: true,
      p1Wager: null,
      p2Wager: null,
      timePerMove: null
    }
  },
  methods: {
    truncAddress(addr) {
      if (addr == null) return;
      // Ethereum Addresses
      if (addr.match(/0x[a-fA-F0-9]{40}/) != null) {
        return `${addr.substring(0, 6)}...${addr.substring(38)}`
      } else {
        // ENS domains and such
        return addr;
      }
    }
  },
  computed: {
    whitePlayer() {
      return this.playAsWhite ? this.wallet.address
                              : this.opponent;
    },
    blackPlayer() {
      return this.playAsWhite ? this.opponent
                              : this.wallet.address;
    }
  },
  setup() {
    const wallet = useWalletStore();
    return { wallet };
  },
  created() {
    let { address } = this.$route.params;
    this.opponent = address;
  }
}
</script>

<template>
  <div id='new-challenge'>
    <div id='player-options' class='flex'>
      <div id='current-player' class='flex-1 flex-center padded'>
        <UserOpts
          color='White'
          :address='truncAddress(whitePlayer)'
          :wager='0'
        >Play As</UserOpts>
      </div>

      <div id='opponent' class='flex-1 flex-center padded'>
        <UserOpts
          class='flex-1'
          color='Black'
          :address='truncAddress(blackPlayer)'
          :wager='0'
        >Opponent</UserOpts>
      </div>
    </div>

    <div id='universal-options'>
    </div>
    <div id='time-per-move' class='flex margin-1em'>
      <div class='flex-shrink center-align text-ml text-bold'>Time Per Move</div>
      <input
        class='margin-rl flex-1'
        v-bind='timePerMove'
        placeholder='Enter a number'
      />
      <select
        id='tpm-units'
        name='tpm-units'
        class='flex-shrink'
      >
        <option value='minutes'>Minutes</option>
        <option value='hours'>Hours</option>
        <option value='days'>Days</option>
        <option value='days'>Weeks</option>
      </select>
    </div>

    <div id='game-controls' class='flex flex-center'>
      <button class='margin-rl'>Send</button>
      <button
        class='margin-rl'
        @click='$router.push("/profile/"+opponent)'
      >Cancel</button>
    </div>
  </div>
</template>

<style lang='scss'>
#new-challenge {
  #current-player {}
  #opponent {}
  #game-controls {
    button {
      min-width: 5em;
    }
  }
}
</style>
