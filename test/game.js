const _ = require('underscore');
const sleep = require('sleep-promise');
const Lobby = artifacts.require("Lobby");
const Challenge = artifacts.require("Challenge");
const ChessGame = artifacts.require('ChessGame');
const { getBalance } = web3.eth;
const { toBN, toWei } = web3.utils;

contract('ChessGame', function (accounts) {
  let [ arbiter, p1, p2, p3 ] = accounts;
  let lobby, challenge, game, tx, white, black;
  const wager = toBN(toWei('1', 'ether'));

  before(async () => { lobby = await Lobby.deployed() });

  async function movePiece(player, san, flags='0x00') {
    if (!san)
    if (player === white) san = 'e3';
    else if (player === black) san = 'e6';
    else san='e3';      // Some unauthroized player.
    const tx = await game.move(san, flags, { from: player });
    return tx;
  }

  describe('p1 -> p2 as white', () => {
    before(async () => {
      tx = await lobby.challenge(p2, 1, wager, 60, { from: p1, value: wager });
      expect(tx.logs[0]).to.have.property('event', 'CreatedChallenge');
      challenge = await Challenge.at(tx.logs[0].args.challenge);
      await challenge.accept({ from: p2, value: wager });
      game = await challenge.game().then(ChessGame.at);
    });

    it('white is p1', async function () {
      white = await game.whitePlayer();
      expect(white).to.equal(p1);
    });

    it('black is p2', async function () {
      black = await game.blackPlayer();
      expect(black).to.equal(p2);
    });

    it('sets the challenge', async function () {
      const addr = await game.challenge();
      expect(addr).to.equal(challenge.address);
    });

    it('sets the lobby', async function () {
      const addr = await game.lobby();
      expect(addr).to.equal(lobby.address);
    });

    it('lobby sends a GameStarted event', async function () {
      const logs = await lobby.getPastEvents();
      const [ ev ] = _.filter(logs, l => l.event === 'GameStarted');
      expect(ev).to.be.ok;
      expect(ev).to.have.nested.property('args.game', game.address);
      expect(ev).to.have.nested.property('args.whitePlayer', p1);
      expect(ev).to.have.nested.property('args.blackPlayer', p2);
    });

    it('sets the arbiter', async function () {
      const addr = await game.arbiter();
      expect(addr).to.equal(arbiter);
    });

    it('is white\'s move', async function () {
      const whiteMove = await game.isWhiteMove();
      expect(whiteMove).to.equal(true);
    });

    it('blocks black from moving', async () => {
      try {
        await movePiece(black);
        assert.fail('The contract should have failed');
      } catch (err) {
        expect(err.reason).to.equal('CurrentPlayerOnly');
      }
    });

    describe('white moves', () => {
      before(async () => {
        tx = await movePiece(white, 'e3');
      });

      it('fires a MoveSAN event', async () => {
        const [ ev ] = _.filter(tx.logs, l => l.event === 'MoveSAN');
        expect(ev).to.not.be.null;
        expect(ev).to.have.nested.property('args.player', white);
        expect(ev).to.have.nested.property('args.san', 'e3');
        expect(ev).to.have.nested.property('args.flags', '0x00');
      });

      it('switches to black\'s move', async () => {
        const whiteMove = await game.isWhiteMove();
        expect(whiteMove).to.equal(false);
      });

      it('blocks white from moving', async () => {
        try {
          await movePiece(white, 'e6');
          assert.fail('The contract should have failed');
        } catch (err) {
          expect(err.reason).to.equal('CurrentPlayerOnly');
        }
      });
    });

    describe('black moves', () => {
      before(async () => {
        tx = await movePiece(black);
      });

      it('fires a MoveSAN event', async () => {
        const [ ev ] = _.filter(tx.logs, l => l.event === 'MoveSAN');
        expect(ev).to.not.be.null;
        expect(ev).to.have.nested.property('args.player', black);
        expect(ev).to.have.nested.property('args.san', 'e6');
        expect(ev).to.have.nested.property('args.flags', '0x00');
      });

      it('switches to white\'s move', async () => {
        const whiteMove = await game.isWhiteMove();
        expect(whiteMove).to.equal(true);
      });

      it('blocks black from moving', async () => {
        try {
          await movePiece(black);
          assert.fail('The contract should have failed');
        } catch (err) {
          expect(err.reason).to.equal('CurrentPlayerOnly');
        }
      });
    });

    it('blocks p3 from moving', async () => {
      try {
        await movePiece(p3);
        assert.fail('The contract should have failed');
      } catch (err) {
        expect(err.reason).to.equal('CurrentPlayerOnly');
      }
    });

    describe('white resigns during white move', () => {
      let startingBalance;

      before(async () => {
        startingBalance = await getBalance(black).then(Number);
        const whiteMove = await game.isWhiteMove();
        expect(whiteMove).to.equal(true);
        tx = await game.resign({ from: white });
      });

      it('changes the game state to finished', async () => {
        const state = await game.state();
        expect(state).to.eql(toBN(1));
      });

      it('sets the winner to black', async () => {
        const winner = await game.winner();
        expect(winner).to.equal(black);
      });

      it('lobby sends a GameFinished event', async () => {
        const logs = await lobby.getPastEvents();
        const [ ev ] = _.filter(logs, l => l.event === 'GameFinished');
        expect(ev).to.be.ok;
        expect(ev).to.have.nested.property('args.game', game.address);
        expect(ev).to.have.deep.nested.property('args.outcome', toBN(2));
        expect(ev).to.have.nested.property('args.winner', black);
      });

      it('sends both wagers to black', async () => {
        const balance = await getBalance(black).then(Number);
        expect(balance).to.equal(startingBalance+2*Number(wager));
      });
    });
  });

  describe('p2 -> p1 as black', () => {
    before(async () => {
      tx = await lobby.challenge(p1, 0, wager, 60, { from: p2, value: wager });
      expect(tx.logs[0]).to.have.property('event', 'CreatedChallenge');
      challenge = await Challenge.at(tx.logs[0].args.challenge);
      await challenge.accept({ from: p1, value: wager });
      game = await challenge.game().then(ChessGame.at);
    });

    it('white is p1', async function () {
      white = await game.whitePlayer();
      expect(white).to.equal(p1);
    });

    it('black is p2', async function () {
      black = await game.blackPlayer();
      expect(black).to.equal(p2);
    });

    it('lobby sends a GameStarted event', async function () {
      const logs = await lobby.getPastEvents();
      const [ ev ] = _.filter(logs, l => l.event === 'GameStarted');
      expect(ev).to.be.ok;
      expect(ev).to.have.nested.property('args.game', game.address);
      expect(ev).to.have.nested.property('args.whitePlayer', p1);
      expect(ev).to.have.nested.property('args.blackPlayer', p2);
    });

    describe('black resigns during white move', () => {
      let startingBalance;

      before(async () => {
        startingBalance = await getBalance(white).then(Number);
        const whiteMove = await game.isWhiteMove();
        expect(whiteMove).to.equal(true);
        tx = await game.resign({ from: black });
      });

      it('changes the game state to finished', async () => {
        const state = await game.state();
        expect(state).to.eql(toBN(1));
      });

      it('sets the winner to white', async () => {
        const winner = await game.winner();
        expect(winner).to.equal(white);
      });

      it('lobby sends a GameFinished event', async function () {
        const logs = await lobby.getPastEvents();
        const [ ev ] = _.filter(logs, l => l.event === 'GameFinished');
        expect(ev).to.be.ok;
        expect(ev).to.have.nested.property('args.game', game.address);
        expect(ev).to.have.deep.nested.property('args.outcome', toBN(1));
        expect(ev).to.have.nested.property('args.winner', white);
      });

      it('sends both wagers to white', async () => {
        const balance = await getBalance(white).then(Number);
        expect(balance).to.equal(startingBalance+2*Number(wager));
      });
    });
  });

  describe('players agree to stalemate', () => {
    let startBalWhite, startBalBlack;

    before(async () => {
      tx = await lobby.challenge(p2, 1, wager, 60, { from: p1, value: wager });
      expect(tx.logs[0]).to.have.property('event', 'CreatedChallenge');
      challenge = await Challenge.at(tx.logs[0].args.challenge);
      await challenge.accept({ from: p2, value: wager });
      game = await challenge.game().then(ChessGame.at);
      white = await game.whitePlayer();
      black = await game.blackPlayer();
    });

    describe('white moves and signals stalemate', () => {
      before(async () => {
        startBalWhite = await getBalance(white).then(Number);
        tx = await movePiece(white, null, flags='0x04');
      });

      it('fires a MoveSAN event', async () => {
        const [ ev ] = _.filter(tx.logs, l => l.event === 'MoveSAN');
        expect(ev).to.not.be.null;
        expect(ev).to.have.nested.property('args.player', white);
        expect(ev).to.have.nested.property('args.san');
        expect(ev).to.have.nested.property('args.flags', '0x04');
      });

      it('doesn\'t change the state yet', async function () {
        const state = await game.state();
        expect(state).to.eql(toBN(0));
      });

      it('doesn\'t change the outcome yet', async function () {
        const outcome = await game.outcome();
        expect(outcome).to.eql(toBN(0));
      });
    });

    // Would be good to test that you can revoke stalemate by not
    // signaling on your next move
    describe('black moves without signaling stalemate', () => { /* TODO */ });
    describe('white moves and signals stalemate again', () => { /* TODO */ });

    describe('black moves and signals stalemate', () => {
      before(async () => {
        startBalBlack = await getBalance(black).then(Number);
        tx = await movePiece(black, null, flags='0x04');
      });

      it('Doesn\'t fire a MoveSAN event', async () => {
        const [ ev ] = _.filter(tx.logs, l => l.event === 'MoveSAN');
        expect(ev).to.be.undefined;
      });

      it('changes the state to Finished', async function () {
        const state = await game.state();
        expect(state).to.eql(toBN(1));
      });

      it('changes the outcome to Draw', async function () {
        const outcome = await game.outcome();
        expect(outcome).to.eql(toBN(3));
      });

      it('doesn\'t set any winner', async function () {
        const winner = await game.winner();
        expect(winner).to.equal('0x0000000000000000000000000000000000000000');
      });

      it('lobby sends a GameFinished event', async function () {
        const logs = await lobby.getPastEvents();
        const [ ev ] = _.filter(logs, l => l.event === 'GameFinished');
        expect(ev).to.be.ok;
        expect(ev).to.have.nested.property('args.game', game.address);
        expect(ev).to.have.deep.nested.property('args.outcome', toBN(3));
        expect(ev).to.have.nested.property('args.winner', '0x0000000000000000000000000000000000000000');
      });

      it('returns wager to white player', async () => {
        const balance = await getBalance(white).then(Number);
        expect(balance).to.be.within(startBalWhite
                                     , startBalWhite+Number(wager));
      });

      it('returns wager to black player', async () => {
        const balance = await getBalance(black).then(Number);
        expect(balance).to.be.within(startBalBlack
                                     , startBalBlack+Number(wager));
      });
    });
  });

  // NOTE: This test takes forever.  You can skip it most the time.
  describe.skip('timer expires', () => {
  //describe('timer expires', () => {
    before(async () => {
      tx = await lobby.challenge(p2, 1, wager, 60, { from: p1, value: wager });
      expect(tx.logs[0]).to.have.property('event', 'CreatedChallenge');
      challenge = await Challenge.at(tx.logs[0].args.challenge);
      await challenge.accept({ from: p2, value: wager });
      game = await challenge.game().then(ChessGame.at);
      white = await game.whitePlayer();
      black = await game.blackPlayer();
    });

    it('timer didn\'t expire yet', async () => {
      const didExpire = await game.timeExpired();
      expect(didExpire).to.be.false;
    });

    it('black tries to claim victory before the timer expires', async () => {
      try {
        await game.claim({ from: black });
        assert.fail('Contract should have failed');
      } catch(err) {
        expect(err.reason).to.equal('TimerStillActive');
      }
    });

    it('white waits for timer expiry and tries to move', async () => {
      try {
        await sleep(60001);
        await movePiece(white);
        assert.fail('The contract should have failed');
      } catch (err) {
        expect(err.reason).to.equal('TimerExpired');
      }
    });

    it('white tries to claim victory', async () => {
      try {
        await game.claim({ from: white });
        assert.fail('Contract should have failed');
      } catch(err) {
        expect(err.reason).to.equal('OtherPlayerOnly');
      }
    });

    it('reports the time has expired', async () => {
      const didExpire = await game.timeExpired();
      expect(didExpire).to.be.true;
    });

    describe('black claims victory', () => {
      let startingBalance;

      before(async () => {
        startingBalance = await getBalance(black).then(Number);
        await game.claim({ from: black });
      });

      it('sets the game outcome to BlackWon', async () => {
        const outcome = await game.outcome();
        expect(outcome).to.eql(toBN(2));
      });

      it('sets the winner to black', async () => {
        const winner = await game.winner();
        expect(winner).to.equal(black);
      });

      it('sends both wagers to black', async () => {
        const balance = await getBalance(black).then(Number);
        expect(balance).to.be.within(startingBalance
                                   , startingBalance+2*Number(wager));
      });
    });
  });

  describe('disputing an illegal move', () => {
    before(async () => {
      tx = await lobby.challenge(p2, 1, wager, 60, { from: p1, value: wager });
      expect(tx.logs[0]).to.have.property('event', 'CreatedChallenge');
      challenge = await Challenge.at(tx.logs[0].args.challenge);
      await challenge.accept({ from: p2, value: wager });
      game = await challenge.game().then(ChessGame.at);
      white = await game.whitePlayer();
      black = await game.blackPlayer();
    });

    describe('white tries an illegal move', () => {
      before(async () => {
        tx = await movePiece(white, 'illegal');
      });

      it('fires a MoveSAN event', async () => {
        const [ ev ] = _.filter(tx.logs, l => l.event === 'MoveSAN');
        expect(ev).to.not.be.null;
        expect(ev).to.have.nested.property('args.player', white);
        expect(ev).to.have.nested.property('args.san', 'illegal');
        expect(ev).to.have.nested.property('args.flags', '0x00');
      });

      it('arbiter can\'t rule on the outcome yet', async () => {
        try {
          await game.resolve(2, black, { from: arbiter });
          assert.fail('The contract should have failed');
        } catch (err) {
          expect(err.reason).to.equal('InvalidContractState');
        }
      });
    });

    describe('black disputes the transaction', () => {
      before(async () => {
        tx = await game.dispute({ from: black });
      });

      it('changes the game state to Review', async () => {
        const state = await game.state();
        expect(state).to.eql(toBN(3));
      });

      it('doesn\'t set any winner', async () => {
        const outcome = await game.outcome();
        expect(outcome).to.eql(toBN(0));
      });

      it('lobby sends a GameDisputed event', async function () {
        const logs = await lobby.getPastEvents();
        const [ ev ] = _.filter(logs, l => l.event === 'GameDisputed');
        expect(ev).to.be.ok;
        expect(ev).to.have.nested.property('args.game', game.address);
        expect(ev).to.have.nested.property('args.player', black);
      });

      it('blocks the players from moving anymore', async () => {
        for (var p of [ p1, p2 ]) {
          try {
            await movePiece(p);
            assert.fail('The contract should have failed');
          } catch (err) {
            expect(err.reason).to.equal('InvalidContractState');
          }
        }
      });

      it('players can\'t resolve the dispute', async () => {
        for (var p of [ p1, p2, p3 ]) {
          try {
            await game.resolve(2, black, 'test', { from: p });
            assert.fail('The contract should have failed');
          } catch (err) {
            expect(err.reason).to.equal('ArbiterOnly');
          }
        }
      });

      it('contract keeps the wagers for now', async () => {
        const balance = await getBalance(challenge.address).then(Number);
        expect(balance).to.be.equal(2*Number(wager));
      });
    });

    describe('arbiter resolves the game for black', () => {
      let startingBalance;

      before(async () => {
        startingBalance = await getBalance(black).then(Number);
        tx = await game.resolve(2, black, 'test', { from: arbiter });
      });

      it('changes the game state to Finished', async () => {
        const state = await game.state();
        expect(state).to.eql(toBN(1));
      });

      it('Sets the outcome to BlackWon', async () => {
        const outcome = await game.outcome();
        expect(outcome).to.eql(toBN(2));
      });

      it('Sets the winner to black', async () => {
        const winner = await game.winner();
        expect(winner).to.equal(black);
      });

      it('fires a ArbiterAction event', async () => {
        const [ ev ] = _.filter(tx.logs, l => l.event === 'ArbiterAction');
        expect(ev).to.have.nested.property('args.arbiter', arbiter);
        expect(ev).to.have.nested.property('args.comment', 'test');
      });

      it('lobby sends a GameFinished event', async function () {
        const logs = await lobby.getPastEvents();
        const [ ev ] = _.filter(logs, l => l.event === 'GameFinished');
        expect(ev).to.be.ok;
        expect(ev).to.have.nested.property('args.game', game.address);
        expect(ev).to.have.deep.nested.property('args.outcome', toBN(2));
        expect(ev).to.have.nested.property('args.winner', black);
      });

      it('arbiter can\'t change the outcome now', async () => {
        try {
          await game.resolve(1, white, { from: arbiter });
          assert.fail('The contract should have failed');
        } catch (err) {
          expect(err.reason).to.equal('InvalidContractState');
        }
      });

      it('award both wagers to black', async () => {
        const balance = await getBalance(black).then(Number);
        expect(balance).to.equal(startingBalance+2*Number(wager));
      });
    });
  });

  describe('handling a phony dispute', () => {
    before(async () => {
      tx = await lobby.challenge(p2, 1, wager, 60, { from: p1, value: wager });
      expect(tx.logs[0]).to.have.property('event', 'CreatedChallenge');
      challenge = await Challenge.at(tx.logs[0].args.challenge);
      await challenge.accept({ from: p2, value: wager });
      game = await challenge.game().then(ChessGame.at);
      white = await game.whitePlayer();
      black = await game.blackPlayer();
    });

    describe('white makes a legal move', () => {
      before(async () => {
        tx = await movePiece(white);
      });

      it('fires a MoveSAN event', async () => {
        const [ ev ] = _.filter(tx.logs, l => l.event === 'MoveSAN');
        expect(ev).to.not.be.null;
        expect(ev).to.have.nested.property('args.player', white);
        expect(ev).to.have.nested.property('args.san');
        expect(ev).to.have.nested.property('args.flags', '0x00');
      });
    });

    describe('black disputes the transaction', () => {
      before(async () => {
        tx = await game.dispute({ from: black });
      });

      it('changes the game state to Review', async () => {
        const state = await game.state();
        expect(state).to.eql(toBN(3));
      });

      it('doesn\'t set any winner', async () => {
        const outcome = await game.outcome();
        expect(outcome).to.eql(toBN(0));
      });

      it('contract keeps the wagers for now', async () => {
        const balance = await getBalance(challenge.address).then(Number);
        expect(balance).to.be.equal(2*Number(wager));
      });
    });

    describe('arbiter resolves the game for white', () => {
      let startingBalance;

      before(async () => {
        startingBalance = await getBalance(white).then(Number);
        tx = await game.resolve(1, white, 'test', { from: arbiter });
      });

      it('changes the game state to Finished', async () => {
        const state = await game.state();
        expect(state).to.eql(toBN(1));
      });

      it('Sets the outcome to WhiteWon', async () => {
        const outcome = await game.outcome();
        expect(outcome).to.eql(toBN(1));
      });

      it('Sets the winner to white', async () => {
        const winner = await game.winner();
        expect(winner).to.equal(white);
      });

      it('fires a ArbiterAction event', async () => {
        const [ ev ] = _.filter(tx.logs, l => l.event === 'ArbiterAction');
        expect(ev).to.have.nested.property('args.arbiter', arbiter);
        expect(ev).to.have.nested.property('args.comment', 'test');
      });

      it('lobby sends a GameFinished event', async function () {
        const logs = await lobby.getPastEvents();
        const [ ev ] = _.filter(logs, l => l.event === 'GameFinished');
        expect(ev).to.be.ok;
        expect(ev).to.have.nested.property('args.game', game.address);
        expect(ev).to.have.deep.nested.property('args.outcome', toBN(1));
        expect(ev).to.have.nested.property('args.winner', white);
      });

      it('award both wagers to white', async () => {
        const balance = await getBalance(white).then(Number);
        expect(balance).to.equal(startingBalance+2*Number(wager));
      });
    });
  });

  describe('arbiter settles game as draw', () => {
    before(async () => {
      tx = await lobby.challenge(p2, 1, wager, 60, { from: p1, value: wager });
      expect(tx.logs[0]).to.have.property('event', 'CreatedChallenge');
      challenge = await Challenge.at(tx.logs[0].args.challenge);
      await challenge.accept({ from: p2, value: wager });
      game = await challenge.game().then(ChessGame.at);
      white = await game.whitePlayer();
      black = await game.blackPlayer();
    });

    describe('white disputes the game', () => {
      before(async () => {
        tx = await game.dispute({ from: white });
      });

      it('changes the game state to Review', async () => {
        const state = await game.state();
        expect(state).to.eql(toBN(3));
      });

      it('doesn\'t set any winner', async () => {
        const outcome = await game.outcome();
        expect(outcome).to.eql(toBN(0));
      });

      it('contract keeps the wagers for now', async () => {
        const balance = await getBalance(challenge.address).then(Number);
        expect(balance).to.be.equal(2*Number(wager));
      });
    });

    describe('arbiter resolves the game as a draw', () => {
      let startBalWhite, startBalBlack;

      before(async () => {
        startBalWhite = await getBalance(white).then(Number);
        startBalBlack = await getBalance(black).then(Number);
        tx = await game.resolve(3, '0x0000000000000000000000000000000000000000', 'test draw', { from: arbiter });
      });

      it('changes the game state to Finished', async () => {
        const state = await game.state();
        expect(state).to.eql(toBN(1));
      });

      it('Sets the outcome to Draw', async () => {
        const outcome = await game.outcome();
        expect(outcome).to.eql(toBN(3));
      });

      it('Set\'s no winner', async () => {
        const winner = await game.winner();
        expect(winner).to.equal('0x0000000000000000000000000000000000000000');
      });

      it('fires a ArbiterAction event', async () => {
        const [ ev ] = _.filter(tx.logs, l => l.event === 'ArbiterAction');
        expect(ev).to.have.nested.property('args.arbiter', arbiter);
        expect(ev).to.have.nested.property('args.comment', 'test draw');
      });

      it('lobby sends a GameFinished event', async function () {
        const logs = await lobby.getPastEvents();
        const [ ev ] = _.filter(logs, l => l.event === 'GameFinished');
        expect(ev).to.be.ok;
        expect(ev).to.have.nested.property('args.game', game.address);
        expect(ev).to.have.deep.nested.property('args.outcome', toBN(3));
        expect(ev).to.have.nested.property('args.winner');
      });

      it('returns wager to white player', async () => {
        const balance = await getBalance(white).then(Number);
        expect(balance).to.be.within(startBalWhite
                                     , startBalWhite+Number(wager));
      });

      it('returns wager to black player', async () => {
        const balance = await getBalance(black).then(Number);
        expect(balance).to.be.within(startBalBlack
                                     , startBalBlack+Number(wager));
      });
    });
  });
});
