import { formatEther } from 'ethers/lib/utils';
import useEthStore from '../stores/ethereum';

export default ({
  setup() {
    const eth = useEthStore();
    return { eth };
  },
  computed: {
    provider() { return this.eth.provider },
    signer() { return this.eth.signer }
  },
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
    formatBalance(amount) {
      return parseFloat(formatEther(amount)).toFixed(3);
    }
  }
});
