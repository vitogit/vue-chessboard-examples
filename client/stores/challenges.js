import _ from 'underscore';
import { defineStore } from 'pinia';
import useWalletStore from './wallet';
import useContractsStore from './contracts';
import { challengeStatus } from '../constants/bcl';

// FIXME: Need to enforce exclusivity of pending and waiting challenges
export default defineStore({
  id: 'challenges',
  state: () => ({
    // Active challenges
    pending: [],
    waiting: [],
    // All challenges
    challenges: {}
  }),
  actions: {
    register(from, to, contract) {
      const wallet = useWalletStore();
      const contracts = useContractsStore();

      const isIncoming = (wallet.address == to);
      // fixme shouldn't need this.  don't register if you're
      //       not connected
      if (!isIncoming && wallet.address != from) {
        console.error('Processed an erroneous challenge');
        return;
      }

      if (isIncoming) {
        console.log('Received an pending challenge from', from);
        this.pending = [ contract, ...this.pending ];
        //this.pending.add(contract);
      } else {
        console.log('Sent an outgoing challenge to', to);
        this.waiting = [ contract, ...this.waiting ];
      }

      this.challenges[contract] = {
        isIncoming,
        status: challengeStatus.pending,
        p1: from,
        p2: to
        // TODO Wager and other contract data
      };
    },
    modify(contract, status) {
      if (status != challengeStatus.pending) {
        console.warn('Called modify instead of terminate');
        return this.terminate(contract, status);
      }

      const challenge = this.challenges[contract];
      if (!challenge) {
        console.error('Challenge missing');
      }

      if (challenge.status != challengeStatus.pending) {
        console.error('Challenge is not in a pending state');
        return;
      }

      // Switch from incoming to outgoing
      if (challenge.isIncoming) {
        this.pending = _.without(this.pending, contract);
        this.waiting = [ contract, ...this.waiting ];
        console.log('Modified incoming challenge', contract);
      } else {
        this.waiting = _.without(this.waiting, contract);
        this.pending = [ contract, ...this.pending ];
        console.log('Modified outgoing challenge', contract);
      }
      challenge.isIncoming = !challenge.isIncoming;
    },
    terminate(contract, status) {
      if (status == challengeStatus.pending) {
        console.error('Challenge is still pending');
        return;
      }

      const challenge = this.challenges[contract];
      if (!challenge) {
        console.error('Challenge missing');
      }

      challenge.status = status;
      console.log('Updated challenge status to', status, contract);

      if (challenge.isIncoming) {
        this.pending = _.without(this.pending, contract);
        console.log('Removed pending challenge', contract);
      } else {
        this.waiting = _.without(this.waiting, contract);
        console.log('Removed outgoing challenge', contract);
      }
    }
  }
});
