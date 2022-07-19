const _ = require('underscore');
const Lobby = artifacts.require('Lobby');
const Challenge = artifacts.require('Challenge');
const { toBN } = web3.utils;

contract('Challenge', accounts => {
  let [ arbiter, p1, p2, p3 ] = accounts;
  let tx, lobby, challenge, sender, receiver;

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

  describe('p1 -> p2 as white', () => {
    before(async () => {
      tx = await lobby.challenge(p2, true, 1, 2, { from: p1 });
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
      const proposal = await challenge.proposal();
      expect(proposal.p1IsWhite).to.equal(true);
      expect(proposal.wagerAmount).to.eql(toBN(1));
      expect(proposal.timePerMove).to.eql(toBN(2));
    });

    // TODO: Do we really need to return a BigNumber??
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

  describe('p2 -> p1 as black', () => {
    before(async () => {
      tx = await lobby.challenge(p1, false, 2, 3, { from: p2 });
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
      const proposal = await challenge.proposal();
      expect(proposal.p1IsWhite).to.equal(false);
      expect(proposal.wagerAmount).to.eql(toBN(2));
      expect(proposal.timePerMove).to.eql(toBN(3));
    });
  });

  describe('p1 -> p2, p1 cancels', () => {
    before(async () => {
      tx = await lobby.challenge(p2, true, 0, 10, { from: p1 });
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
      before(async () => {
        tx = await challenge.cancel({ from: p1 });
      });

      it('lobby sends a CanceledChallenge event', async function () {
        const logs = await lobby.getPastEvents();
        const [ ev ] = _.filter(logs, l => l.event === 'CanceledChallenge');
        expect(ev).to.be.ok;
        expect(ev).to.have.nested.property('args.challenge');
        expect(ev).to.have.nested.property('args.player', p1);
        expect(ev).to.have.deep.nested.property('args.state', toBN(3));
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

  describe('p1 -> p2, p2 accepts', () => {
    before(async () => {
      tx = await lobby.challenge(p2, true, 0, 10, { from: p1 });
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

    describe('p2 accepts the contract', async () => {
      before(async () => {
        tx = await challenge.accept({ from: p2 });
      });

      it('sets the state to accepted', async () => {
        const status = await challenge.state();
        expect(status).to.eql(toBN(1));
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
      tx = await lobby.challenge(p2, true, 0, 10, { from: p1 });
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
      before(async () => {
        tx = await challenge.decline({ from: p2 });
      });

      it('lobby sends a CanceledChallenge event', async function () {
        const logs = await lobby.getPastEvents();
        const [ ev ] = _.filter(logs, l => l.event === 'CanceledChallenge');
        expect(ev).to.be.ok;
        expect(ev).to.have.nested.property('args.challenge');
        expect(ev).to.have.nested.property('args.player', p2);
        expect(ev).to.have.deep.nested.property('args.state', toBN(2));
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

  describe('p1 -> p2, p1 modifies', () => { /* TODO */ });
  describe('p1 -> p2, p2 modifies', () => { /* TODO */ });
});
