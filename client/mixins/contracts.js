import walletMixin from './wallet';
import useContractStore from '../stores/contracts';

export default ({
  mixins: [ walletMixin ],
  setup() {
    const contracts = useContractStore();
    return { contracts };
  },
  computed: {
    lobby() { return this.contracts.lobby }
  },
  methods: {
    // Events are always of the form event(from, to, value)
    // Register a persistent event listener.  Be careful you
    // shouldn't just be querying the logs before sending this
    registerEventListener(contract, filter, callback) {
      console.log('Create event listener for', contract.address);
      const listener = this.contracts.listeners[contract.address];
      if (!listener) {
        const incoming = filter(null, this.address);
        const outgoing = filter(this.address, null);
        contract.on(incoming, callback);
        contract.on(outgoing, callback);
        this.contracts.listeners[contract.address] = (incoming, outgoing);
      } else {
        console.error('There\'s already a listener for this');
      }
    },
    async queryEventLogs(contract, filter) {
      const [ incoming, outgoing ] = await Promise.all([
        contract.queryFilter(filter(null, this.address)),
        contract.queryFilter(filter(this.address, null))
      ]);
      return [ ...incoming, ...outgoing ];
    }
  }
});
