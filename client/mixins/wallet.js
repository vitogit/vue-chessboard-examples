import useWalletStore from '../stores/wallet';

export default ({
  setup() {
    const wallet = useWalletStore();
    return { wallet };
  },
  computed: {
    provider() { return this.wallet.provider },
    signer() { return this.wallet.signer },
    isInstalled() { return this.wallet.installed },
    isConnected() { return this.wallet.connected },
    // Rename to walletAddress.  Address is to generic.
    address() { return this.wallet.address },
    // Rename to nativeBalance
    balance() { return this.wallet.balance }
  }
});
