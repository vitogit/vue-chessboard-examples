import _ from 'underscore';
import { defineStore } from 'pinia';
import useWalletStore from './wallet';
import useContractStore from './contracts';
import { challengeStatus } from '../constants/bcl';

/* metadata schema
  * active: bool    ---   Gets set to false when the contract terminates
  * waiting: bool   ---   Are we waiting for the next player to do something
*/

// FIXME: Need to enforce exclusivity of pending and waiting challenges
export default defineStore({
  id: 'player-lobby',
  state: () => ({
    challenges: new Set(),
    games: new Set(),
    history: new Set(),
    // Maintain a lookup table of the incoming and outgoing contracts
    metadata: {}
  }),
  actions: {
    metadata(addr) { return this.metadata[addr] },
    newChallenge(address, from, to) {
      const wallet = useWalletStore();
      const contracts = useContractStore();

      // FIXME: causing some bugs in the logs
      if (this.metadata[address]) {
        console.warn('Already had a record of contract', address);
        return contracts.challenge(address);
      }

      /*
      // TODO Should find a cleaner way to do this
      if (wallet.address == from) {
        this.metadata[address] = { active: true, waiting: true };
      } else if (wallet.address == to) {
        this.metadata[address] = { active: true, waiting: false };
      } else {
        console.error('Received erroneous event', address);
        return;
      }
      */

      //this.challenges.add(address);
      const challenge = contracts.registerChallenge(address);
      console.log('Initialized new challenge', address);
      return challenge;
    },
    modifiedChallenge(address, from, to, state) {
      const wallet = useWalletStore();

      if (!this.metadata[address]) {
        console.error('No record of contract', address);
        return;
      }

      // Update the metadata
      if (state > 0) {
        this.terminate(address);
      } else {
        // Still in pending.  Was a modified event.
        if (wallet.address == from) {
          this.metadata[address].waiting = true;
        } else if (wallet.address == to) {
          this.metadata[address].waiting = false;
        } else {
          console.error('Received erroneous event', address);
        }
      }
    },
    newGame(address, white, black) {
      const wallet = useWalletStore();
      const contracts = useContractStore();

      // FIXME: causing some bugs in the logs
      if (this.metadata[address]) {
        console.error('Already had a record of contract', address);
        return contracts.game(address);
      }

      // TODO Should find a cleaner way to do this
      if (wallet.address == white) {
        this.metadata[address] = { active: true, waiting: false };
      } else if (wallet.address == black) {
        this.metadata[address] = { active: true, waiting: true };
      } else {
        console.error('Received erroneous game');
      }

      this.games.add(address);
      const game = contracts.registerGame(address);
      console.log('Initialized new game', address);
      return game;
    },
    terminate(addr) {
      if (this.challenges.has(addr)) {
        this.challenges.delete(addr);
      } else if (this.games.has(addr)) {
        this.games.delete(addr);
        this.history.add(addr);
      }
      this.metadata[addr].active = false;
    }
  }
});
