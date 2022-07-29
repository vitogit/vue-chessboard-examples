import { formatEther, parseEther } from 'ethers/lib/utils';

// TODO Rename to utility mixin
export default ({
  methods: {
    playAudio(clip) {
      const audio = new Audio(`/sound/${clip}.mp3`);
      audio.play();
    },
    truncAddress(addr) {
      // Ethereum Addresses
      if (addr.match(/0x[a-fA-F0-9]{40}/) != null) {
        return `${addr.substring(0, 5)}..${addr.substring(39)}`
      } else {
        // TODO ENS domains and such still need to be trunced
        return addr;
      }
    },
    formatBalance(bal) { return parseEther(bal) },
    async fetchBalance(addr) {
      const balance = await this.provider.getBalance(addr);
      return balance;
    },
    createBalance(amount) {
      return parseEther(amount.toString());
    },
    formatBalance(amount) {
      return parseFloat(formatEther(amount)).toFixed(3);
    }
  }
});
