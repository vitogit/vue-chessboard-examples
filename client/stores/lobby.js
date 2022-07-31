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
  id: 'lobby',
  state: () => ({
    challenges: [],
    games: [],
    history: [],
    // Maintain a lookup table of the incoming and outgoing contracts
    metadata: {}
  }),
  actions: {
    metadata(addr) { return this.metadata[addr] },
    async newChallenge(addr, from, to) {
      console.log('Initialize new challenge', addr);
      const contracts = useContractStore();

      // Without this hot reload gives us bugs
      if (this.metadata[addr]) {
        console.warn('Already had a record of challenge', addr);
        this.updateChallenge(addr);
        return contracts.challenge(addr);
      }

      //this.challenges.push(addr);
      const challenge = contracts.registerChallenge(addr);
      this.metadata[addr] = { loading: true };
      this.challenges = [ addr, ...this.challenges ];
      await this.updateChallenge(addr);
      this.challenges = [ ...this.challenges ];
      return challenge;
    },
    async updateChallenge(addr) {
      console.log('Update challenge', addr);
      this.metadata[addr] ||= {};
      this.metadata[addr].loading = true;
      const contracts = useContractStore();
      const challenge = contracts.challenge(addr);
      const [ status,
              player1,
              player2,
              sender,
              receiver,
              p1IsWhite,
              wagerAmount,
              timePerMove ] = await Promise.all([
        challenge.state(),
        challenge.player1(),
        challenge.player2(),
        challenge.sender(),
        challenge.receiver(),
        challenge.p1IsWhite(),
        challenge.wagerAmount(),
        challenge.timePerMove()
      ]);
      this.metadata[addr] = { status,
                              player1,
                              player2,
                              sender,
                              receiver,
                              p1IsWhite,
                              wagerAmount,
                              timePerMove };
      this.metadata[addr].loading = false;
      return this.metadata[addr];
    },
    async newGame(addr, white, black) {
      console.log('Initialize new game', addr);
      const contracts = useContractStore();

      // Without this hot reload gives us bugs
      if (this.metadata[addr]) {
        console.warn('Already had a record of game', addr);
        return contracts.game(addr);
      }

      const game = contracts.registerGame(addr);
      this.metadata[addr] = { loading: true };
      this.games = [ addr, ...this.games ];
      await this.updateGame(addr);
      // FIXME Need to have a better way to make this reactive
      //this.games;
      this.games = [ ...this.games ];
      return game;
    },
    async updateGame(addr) {
      console.log('Update game', addr);
      this.metadata[addr] ||= {};
      this.metadata[addr].loading = true;
      const contracts = useContractStore();
      const game = contracts.game(addr);
      const [ status,
              outcome,
              whitePlayer,
              blackPlayer,
              isWhiteMove,
              timePerMove,
              timeOfLastMove ] = await Promise.all([
          game.state(),
          game.outcome(),
          game.whitePlayer(),
          game.blackPlayer(),
          game.isWhiteMove(),
          game.timePerMove(),
          game.timeOfLastMove()
      ]);
      this.metadata[addr] = { status,
                              outcome,
                              whitePlayer,
                              blackPlayer,
                              isWhiteMove,
                              timePerMove,
                              timeOfLastMove };
      this.metadata[addr].loading = false;
      return this.metadata[addr];
    },
    terminate(addr) {
      if (this.challenges.has(addr)) {
        this.challenges = this.challenges.filter(addr);
      } else if (this.games.has(addr)) {
        this.games = this.games.filter(addr);
        this.history = [ addr, ...this.history ];
      }
      this.metadata[addr].active = false;
    }
  }
});
