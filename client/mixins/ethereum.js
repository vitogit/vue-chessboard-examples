import { formatEther, parseEther } from 'ethers/lib/utils';

export default ({
  methods: {
    truncAddress(addr) {
      // Ethereum Addresses
      if (addr.match(/0x[a-fA-F0-9]{40}/) != null) {
        return `${addr.substring(0, 6)}...${addr.substring(38)}`
      } else {
        // TODO ENS domains and such still need to be trunced
        return addr;
      }
    },
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
