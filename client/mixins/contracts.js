import walletMixin from './wallet';
import useContractStore from '../stores/contracts';

export default ({
  mixins: [ walletMixin ],
  setup() {
    const contracts = useContractStore();
    return { contracts };
  },
  methods: {
    async queryEvents(contract, filter) {
      return contract.queryFilter(filter);
    },
    async queryPlayerEvents(contract, filter) {
      const [ incoming, outgoing ] = await Promise.all([
        contract.queryFilter(filter(null, null, this.wallet.address)),
        contract.queryFilter(filter(null, this.wallet.address, null))
      ]);
      return [ ...incoming, ...outgoing ];
    }
  }
});
