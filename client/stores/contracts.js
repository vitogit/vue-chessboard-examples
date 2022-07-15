import { defineStore } from 'pinia';
import { Contract } from 'ethers';

import LobbyContract from '../contracts/Lobby';
import ChallengeContract from '../contracts/Challenge';
import GameContract from '../contracts/ChessGame';

import useWalletStore from './wallet';

// TODO At some point you'll need to keep the challenges and games in here
export default defineStore({
  id: 'contracts',
  state: () => ({
    lobby: null,
    challenges: {},
    games: {},
    listeners: {}
  }),
  getters: {
    challenge: state => addr => state.challenges[addr],
    game: state => addr => state.games[addr],
  },
  actions: {
    _registerObj(obj, abi, addr) {
      const wallet = useWalletStore();
      const contract = new Contract(addr, abi, wallet.signer || wallet.provider);
      // TODO Handle if it already exists
      obj[addr] = contract;
      return contract;
    },
    registerChallenge(addr) {
      return this._registerObj(this.challenges, ChallengeContract.abi, addr);
    },
    registerGame(addr) {
      console.log('new game', addr);
      return this._registerObj(this.games, GameContract.abi, addr);
    }
  }
});
