<script>
import useWalletStore from '../stores/wallet';
import ChallengeCard from '../components/ChallengeCard';
import { isAddress, getAddress } from 'ethers/lib/utils';

export default {
  name: 'ChallengeUser',
  components: { ChallengeCard },
  data () {
    return {
      opponent: null,
      playAsWhite: true,
      wagerAmount: 0,
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
    <div class='text-xl margin-tb'>New Challenge</div>

    <div id='player-cards' class='flex'>
      <div id='current-player' class='flex-1 flex-center'>
        <ChallengeCard
          class='flex-1'
          color='White'
          :address='truncAddress(whitePlayer)'
          :wager='wagerAmount'
          token='eth'
        >Play As</ChallengeCard>
      </div>

      <div class='margin-rl' />

      <div id='opponent' class='flex-1 flex-center'>
        <ChallengeCard
          class='flex-1'
          color='Black'
          :address='truncAddress(blackPlayer)'
          :wager='wagerAmount'
          token='eth'
        >Opponent</ChallengeCard>
      </div>
    </div>

    <div id='universal-options' class='margin-tb'>
      <div id='time-per-move' class='flex margin-tb'>
        <div class='flex-shrink center-align text-ml text-bold'>Time Per Move</div>
        <div class='flex-1 flex-end'>
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
      </div>

      <div id='wager-info' class='flex margin-tb'>
        <div class='flex-shrink center-align text-ml text-bold'>Wager</div>
        <div class='flex-1 flex-end'>
          <input
            class='margin-rl flex-1'
            v-model='wagerAmount'
            placeholder='0.000'
          />
          <select
            id='wager-token'
            name='wager-token'
            class='flex-shrink'
          >
            <option value='eth'>ETH</option>
            <option value='dai' disabled>DAI</option>
          </select>
        </div>
      </div>
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
@import '../styles';

#new-challenge {
  #current-player, #opponent {}

  #universal-options {
    @extend .margin-lg-tb;

    input { max-width: 7em; }
    select { min-width: 6em; }
  }

  #game-controls {
    button { min-width: 6em; }
  }
}
</style>
