import useWalletStore from '../stores/wallet';

export default ({
  setup() {
    const wallet = useWalletStore();
    return { wallet };
  },
  computed: {
    isInstalled() { return this.wallet.installed },
    isConnected() { return this.wallet.connected },
    address() { return this.wallet.address },
    balance() { return this.wallet.balance }
  }
});
