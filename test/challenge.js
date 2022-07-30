const _ = require('underscore');
const Lobby = artifacts.require('Lobby');
const Challenge = artifacts.require('Challenge');
const { getBalance } = web3.eth;
const { toBN, toWei } = web3.utils;

contract('Challenge', accounts => {
  let [ arbiter, p1, p2, p3 ] = accounts;
  let tx, lobby, challenge, sender, receiver;
  const wager = toBN(toWei('1', 'ether'));

  before(async () => { lobby = await Lobby.deployed() });

  async function testIsBlocked(action, player, reason) {
    try {
      await action({ from: player })
      assert.fail('The contract should have failed');
    } catch (err) {
      if (reason) {
        expect(err.reason).to.equal(reason);
      }
    }
  }

  describe('p1 -> p2 as white, no wager', () => {
    before(async () => {
      tx = await lobby.challenge(p2, true, 0, 60, { from: p1 });
      expect(tx.logs[0]).to.have.property('event', 'CreatedChallenge');
      challenge = await Challenge.at(tx.logs[0].args.challenge);
    });

    it('p1 is the sender', async () => {
      sender = await challenge.sender();
      expect(sender).to.equal(p1);
    });

    it('p2 is the receiver', async () => {
      receiver = await challenge.receiver();
      expect(receiver).to.equal(p2);
    });

    it('sets correct proposal', async () => {
      const p1IsWhite = await challenge.p1IsWhite();
      const wagerAmount = await challenge.wagerAmount();
      const timePerMove = await challenge.timePerMove();
      expect(p1IsWhite).to.equal(true);
      expect(wagerAmount).to.eql(toBN(0));
      expect(timePerMove).to.eql(toBN(60));
    });

    it('sets status to pending', async () => {
      const status = await challenge.state();
      expect(status).to.eql(toBN(0));
    });

    it('blocks receiver from canceling', async () => {
      await testIsBlocked(challenge.cancel, receiver, 'SenderOnly')
    });
    it('blocks sender from accepting', async () => {
      await testIsBlocked(challenge.accept, sender, 'ReceiverOnly')
    });
    it('blocks sender from rejecting', async () => {
      await testIsBlocked(challenge.decline, sender, 'ReceiverOnly')
    });
  });

  describe('p2 -> p1 as black for 1 eth', () => {
    before(async () => {
      tx = await lobby.challenge(p1, false, wager, 60, { from: p2, value: wager });
      expect(tx.logs[0]).to.have.property('event', 'CreatedChallenge');
      challenge = await Challenge.at(tx.logs[0].args.challenge);
    });

    it('p2 is the sender', async () => {
      sender = await challenge.sender();
      expect(sender).to.equal(p2);
    });

    it('p1 is the receiver', async () => {
      receiver = await challenge.receiver();
      expect(receiver).to.equal(p1);
    });

    it('sets correct proposal', async () => {
      const p1IsWhite = await challenge.p1IsWhite();
      const wagerAmount = await challenge.wagerAmount();
      const timePerMove = await challenge.timePerMove();
      expect(p1IsWhite).to.equal(false);
      expect(wagerAmount).to.eql(wager);
      expect(timePerMove).to.eql(toBN(60));
    });
  });

  describe('p1 -> p2, p2 accepts', () => {
    before(async () => {
      tx = await lobby.challenge(p2, true, wager, 60, { from: p1, value: wager });
      expect(tx.logs[0]).to.have.property('event', 'CreatedChallenge');
      challenge = await Challenge.at(tx.logs[0].args.challenge);
    });

    it('p1 is the sender', async () => {
      sender = await challenge.sender();
      expect(sender).to.equal(p1);
    });

    it('p2 is the receiver', async () => {
      receiver = await challenge.receiver();
      expect(receiver).to.equal(p2);
    });

    it('p2 tries to accept without sending funds', async () => {
      try {
        await challenge.accept({ from: p2 });
        assert.fail('Contract should have failed');
      } catch(err) {
        expect(err.reason).to.equal('InsufficientPlayerFunds');
      }
    });

    describe('p2 accepts the contract', async () => {
      before(async () => {
        tx = await challenge.accept({ from: p2, value: wager });
      });

      it('sets the state to accepted', async () => {
        const status = await challenge.state();
        expect(status).to.eql(toBN(1));
      });

      it('lobby sends an AcceptedChallenge event', async function () {
        const logs = await lobby.getPastEvents();
        const [ ev ] = _.filter(logs, l => l.event === 'AcceptedChallenge');
        expect(ev).to.be.ok;
        expect(ev).to.have.nested.property('args.challenge', challenge.address);
        expect(ev).to.have.nested.property('args.player', p2);
      });

      it('lobby sends a GameStarted event', async function () {
        const logs = await lobby.getPastEvents();
        const [ ev ] = _.filter(logs, l => l.event === 'GameStarted');
        expect(ev).to.be.ok;
        expect(ev).to.have.nested.property('args.game');
        expect(ev).to.have.nested.property('args.whitePlayer', p1);
        expect(ev).to.have.nested.property('args.blackPlayer', p2);
      });

      it('blocks p1 from canceling', async () =>
        await testIsBlocked(challenge.cancel, p1, 'InvalidContractState'));
      it('blocks p2 from accepting', async () =>
        await testIsBlocked(challenge.accept, p2, 'InvalidContractState'));
      it('blocks p2 from rejecting', async () =>
        await testIsBlocked(challenge.decline, p2, 'InvalidContractState'));
    });
  });

  describe('p1 -> p2, p2 declines', () => {
    before(async () => {
      tx = await lobby.challenge(p2, true, wager, 60, { from: p1, value: wager });
      expect(tx.logs[0]).to.have.property('event', 'CreatedChallenge');
      challenge = await Challenge.at(tx.logs[0].args.challenge);
    });

    it('p1 is the sender', async () => {
      sender = await challenge.sender();
      expect(sender).to.equal(p1);
    });

    it('p2 is the receiver', async () => {
      receiver = await challenge.receiver();
      expect(receiver).to.equal(p2);
    });

    describe('p2 declines the challenge', async () => {
      let p1StartingBalance;

      before(async () => {
        p1StartingBalance = await getBalance(p1).then(Number);
        tx = await challenge.decline({ from: p2 });
      });

      it('empties the contract funds', async () => {
        const balance = await getBalance(challenge.address).then(Number);
        expect(balance).to.eql(0);
      });

      it('refunds p1 their wager amount', async () => {
        const p1Balance = await getBalance(p1).then(Number);
        expect(p1Balance).to.equal(p1StartingBalance+Number(wager));
      });

      it('lobby sends a CanceledChallenge event', async function () {
        const logs = await lobby.getPastEvents();
        const [ ev ] = _.filter(logs, l => l.event === 'CanceledChallenge');
        expect(ev).to.be.ok;
        expect(ev).to.have.nested.property('args.challenge');
        expect(ev).to.have.nested.property('args.player', p2);
      });

      it('sets the state to rejected', async () => {
        const status = await challenge.state();
        expect(status).to.eql(toBN(2));
      });

      it('blocks p1 from canceling', async () =>
        await testIsBlocked(challenge.cancel, p1, 'InvalidContractState'));
      it('blocks p2 from accepting', async () =>
        await testIsBlocked(challenge.accept, p2, 'InvalidContractState'));
      it('blocks p2 from rejecting', async () =>
        await testIsBlocked(challenge.decline, p2, 'InvalidContractState'));
    });
  });

  describe('p1 -> p2, p1 cancels', () => {
    before(async () => {
      tx = await lobby.challenge(p2, true, wager, 60, { from: p1, value: wager });
      expect(tx.logs[0]).to.have.property('event', 'CreatedChallenge');
      challenge = await Challenge.at(tx.logs[0].args.challenge);
    });

    it('p1 is the sender', async () => {
      sender = await challenge.sender();
      expect(sender).to.equal(p1);
    });

    it('p2 is the receiver', async () => {
      receiver = await challenge.receiver();
      expect(receiver).to.equal(p2);
    });

    describe('p1 cancels the contract', async () => {
      let p1StartingBalance;

      before(async () => {
        p1StartingBalance = await getBalance(p1).then(Number);
        tx = await challenge.cancel({ from: p1 });
      });

      it('empties the contract funds', async () => {
        const balance = await getBalance(challenge.address).then(Number);
        expect(balance).to.eql(0);
      });

      // The player spent some gas fees which is hard to measure
      it('refunds p1 their wager amount', async () => {
        const p1Balance = await getBalance(p1).then(Number);
        expect(p1Balance).to.be.within(p1StartingBalance
                                     , p1StartingBalance+Number(wager));
      });

      it('lobby sends a CanceledChallenge event', async function () {
        const logs = await lobby.getPastEvents();
        const [ ev ] = _.filter(logs, l => l.event === 'CanceledChallenge');
        expect(ev).to.be.ok;
        expect(ev).to.have.nested.property('args.challenge');
        expect(ev).to.have.nested.property('args.player', p1);
      });

      it('sets the state to canceled', async () => {
        const status = await challenge.state();
        expect(status).to.eql(toBN(3));
      });

      it('blocks p1 from canceling again', async () =>
                await testIsBlocked(challenge.cancel, p1, 'InvalidContractState'));
      it('blocks p2 from accepting', async () =>
                await testIsBlocked(challenge.accept, p2, 'InvalidContractState'));
      it('blocks p2 from rejecting', async () =>
                await testIsBlocked(challenge.decline, p2, 'InvalidContractState'));
    });
  });

  describe('p1 -> p2, p1 modifies with higher wager', () => {
    const newWager = toBN(toWei('2', 'ether'));

    before(async () => {
      tx = await lobby.challenge(p2, true, wager, 60, { from: p1, value: wager });
      expect(tx.logs[0]).to.have.property('event', 'CreatedChallenge');
      challenge = await Challenge.at(tx.logs[0].args.challenge);
    });

    it('sets the sender and receiver', async () => {
      const sender = await challenge.sender();
      expect(sender).to.equal(p1);
      const receiver = await challenge.receiver();
      expect(receiver).to.equal(p2);
    });

    describe('p2 tries to modify without sending funds', () => {
      it('throws an InsufficientPlayerFunds error', async () => {
        try {
          await challenge.modify(false, newWager, 30, { from: p2 });
          assert.fail('Contract should have failed');
        } catch(err) {
          expect(err.reason).to.equal('InsufficientPlayerFunds');
        }
      });
    });

    describe('p1 tries to modify without sending funds', () => {
      it('throws an InsufficientPlayerFunds error', async () => {
        try {
          await challenge.modify(false, newWager, 30, { from: p1 });
          assert.fail('Contract should have failed');
        } catch(err) {
          expect(err.reason).to.equal('InsufficientPlayerFunds');
        }
      });
    });

    describe('p1 modifies the challenge', async () => {
      before(async () => {
        tx = await challenge.modify(false, newWager, 30, { from: p1, value: wager });
      });

      it('doesn\'t switch the sender and receiver', async () => {
        const sender = await challenge.sender();
        expect(sender).to.equal(p1);
        const receiver = await challenge.receiver();
        expect(receiver).to.equal(p2);
      });

      it('sets correct proposal', async () => {
        const p1IsWhite = await challenge.p1IsWhite();
        const wagerAmount = await challenge.wagerAmount();
        const timePerMove = await challenge.timePerMove();
        expect(p1IsWhite).to.equal(false);
        expect(wagerAmount).to.eql(newWager);
        expect(timePerMove).to.eql(toBN(30));
      });
    });

    describe('p2 tries to accept without sending more funds', () => {
      it('throws an InsufficientPlayerFunds error', async () => {
        try {
          await challenge.accept({ from: p2 });
          assert.fail('Contract should have failed');
        } catch(err) {
          expect(err.reason).to.equal('InsufficientPlayerFunds');
        }
      });
    });

    describe('p2 accepts', () => {
      before(async () => {
        tx = await challenge.accept({ from: p2, value: newWager });
      });

      it('keeps all the balance in the contract', async () => {
        const balance = await getBalance(challenge.address).then(Number);
        expect(balance).to.equal(2*newWager);
      });
    });
  });

  describe('p1 -> p2, p2 modifies with lower wager', () => {
    const newWager = toBN(toWei('0.5', 'ether'));

    before(async () => {
      tx = await lobby.challenge(p2, true, wager, 60, { from: p1, value: wager });
      expect(tx.logs[0]).to.have.property('event', 'CreatedChallenge');
      challenge = await Challenge.at(tx.logs[0].args.challenge);
    });

    it('sets the sender and receiver', async () => {
      const sender = await challenge.sender();
      expect(sender).to.equal(p1);
      const receiver = await challenge.receiver();
      expect(receiver).to.equal(p2);
    });

    describe('p2 modifies the challenge', async () => {
      before(async () => {
        tx = await challenge.modify(false, newWager, 120, { from: p2, value: newWager });
      });

      it('switches the sender and receiver', async () => {
        const sender = await challenge.sender();
        expect(sender).to.equal(p2);
        const receiver = await challenge.receiver();
        expect(receiver).to.equal(p1);
      });

      it('sets correct proposal', async () => {
        const p1IsWhite = await challenge.p1IsWhite();
        const wagerAmount = await challenge.wagerAmount();
        const timePerMove = await challenge.timePerMove();
        expect(p1IsWhite).to.equal(false);
        expect(wagerAmount).to.eql(newWager);
        expect(timePerMove).to.eql(toBN(120));
      });
    });

    describe('p1 accepts', () => {
      let p1StartingBalance;

      before(async () => {
        p1StartingBalance = await getBalance(p1).then(Number);
        tx = await challenge.accept({ from: p1, value: newWager });
      });

      it('keeps both wagers in the contract', async () => {
        const balance = await getBalance(challenge.address).then(Number);
        expect(balance).to.equal(2*newWager);
      });

      it('refunds p1 excess wager', async () => {
        const p1Balance = await getBalance(p1).then(Number);
        expect(p1Balance).to.be.within(p1StartingBalance
                                     , p1StartingBalance+Number(newWager));
      });
    });
  });

  describe('p1 -> p2, p1 & p2 modify with lower wager', () => { /* TODO */ });
});
