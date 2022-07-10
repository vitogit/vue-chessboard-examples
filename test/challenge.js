//const Lobby = artifacts.require('Lobby');
const Challenge = artifacts.require('Challenge');
const { toBN } = web3.utils;

contract('Challenge', function (accounts) {
  //let lobby;
  let [ arbiter, p1, p2, p3 ] = accounts;

  //before(async () => { lobby = await Lobby.deployed() });

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
    let contract, sender, receiver;

    before(async () => {
      contract = await Challenge.new(p1, p2, true, 0, 1, { from: arbiter });
      sender = await contract.sender();
      receiver = await contract.receiver();
    });

    it('p1 is the sender', async () => {
      const player1 = await contract.player1();
      expect(player1).to.equal(p1);
      expect(player1).to.equal(sender);
    });

    it('p2 is the receiver', async () => {
      const player2 = await contract.player2();
      expect(player2).to.equal(p2);
      expect(player2).to.equal(receiver);
    });

    it('sets correct proposal', async () => {
      const proposal = await contract.proposal();
      expect(proposal.p1IsWhite).to.equal(true);
      expect(proposal.wagerAmount).to.eql(toBN(0));
      expect(proposal.timePerMove).to.eql(toBN(1));
    });

    // TODO: Do we really need to return a BigNumber??
    it('sets status to pending', async () => {
      const status = await contract.state();
      expect(status).to.eql(toBN(0));
    });

    it('blocks receiver from canceling', async () => {
                  await testIsBlocked(contract.cancel, receiver, 'SenderOnly')
    });
    it('blocks sender from accepting', async () => {
                  await testIsBlocked(contract.accept, sender, 'ReceiverOnly')
    });
    it('blocks sender from rejecting', async () => {
                  await testIsBlocked(contract.reject, sender, 'ReceiverOnly')
    });
  });

  describe('p2 -> p1 as black', () => {
    let contract, sender, receiver;

    before(async () => {
      contract = await Challenge.new(p2, p1, false, 2, 3, { from: arbiter });
      sender = await contract.sender();
      receiver = await contract.receiver();
    });

    it('p2 is the sender', async () => {
      const player1 = await contract.player1();
      expect(player1).to.equal(p2);
      expect(player1).to.equal(sender);
    });

    it('p1 is the receiver', async () => {
      const player2 = await contract.player2();
      expect(player2).to.equal(p1);
      expect(player2).to.equal(receiver);
    });

    it('sets correct proposal', async () => {
      const proposal = await contract.proposal();
      expect(proposal.p1IsWhite).to.equal(false);
      expect(proposal.wagerAmount).to.eql(toBN(2));
      expect(proposal.timePerMove).to.eql(toBN(3));
    });
  });

  describe('p1 -> p2, p1 cancels', () => {
    let contract;

    before(async () => {
      contract = await Challenge.new(p1, p2, true, 0, 1, { from: arbiter });
    });

    describe('p1 cancels the contract', async () => {
      let tx;

      before(async () => {
        tx = await contract.cancel({ from: p1 });
      });

      it('fires a Modified event', async () => {
        expect(tx.logs[0]).to.have.property('event', 'Modified');
        expect(tx.logs[0]).to.have.nested.property('args.from', p1);
        expect(tx.logs[0]).to.have.nested.property('args.to', p2);
        expect(tx.logs[0]).to.have.nested.property('args.state');
        expect(tx.logs[0].args.state).to.eql(toBN(3));
      });

      it('sets the state to canceled', async () => {
        const status = await contract.state();
        expect(status).to.eql(toBN(3));
      });

      it('blocks p1 from canceling again', async () =>
                await testIsBlocked(contract.cancel, p1, 'InvalidContractState'));
      it('blocks p2 from accepting', async () =>
                await testIsBlocked(contract.accept, p2, 'InvalidContractState'));
      it('blocks p2 from rejecting', async () =>
                await testIsBlocked(contract.reject, p2, 'InvalidContractState'));
    });
  });

  describe('p1 -> p2, p2 accepts', () => {
    let contract;

    before(async () => {
      contract = await Challenge.new(p1, p2, true, 0, 1, { from: arbiter });
    });

    describe('p1 cancels the contract', async () => {
      let tx;

      before(async () => {
        tx = await contract.accept({ from: p2 });
      });

      it('sets the state to accepted', async () => {
        const status = await contract.state();
        expect(status).to.eql(toBN(1));
      });

      it('fires a Modified event', async () => {
        const event = tx.logs.find(l => l.event === 'Modified');
        expect(event).to.not.be.null;
        expect(event).to.have.nested.property('args.from', p2);
        expect(event).to.have.nested.property('args.to', p1);
        expect(event).to.have.nested.property('args.state');
        expect(event.args.state).to.eql(toBN(1));
      });

      it('fires a NewContract', async () => {
        const event = tx.logs.find(l => l.event === 'NewContract');
        expect(event).to.not.be.null;
        expect(event).to.have.nested.property('args.player1', p1);
        expect(event).to.have.nested.property('args.player2', p2);
        expect(event).to.have.nested.property('args.target');
      });

      it('blocks p1 from canceling', async () =>
                await testIsBlocked(contract.cancel, p1, 'InvalidContractState'));
      it('blocks p2 from accepting', async () =>
                await testIsBlocked(contract.accept, p2, 'InvalidContractState'));
      it('blocks p2 from rejecting', async () =>
                await testIsBlocked(contract.reject, p2, 'InvalidContractState'));
    });
  });

  describe('p1 -> p2, p2 rejects', () => {
    let contract;

    before(async () => {
      contract = await Challenge.new(p1, p2, true, 0, 1, { from: arbiter });
    });

    describe('p1 cancels the contract', async () => {
      let tx;

      before(async () => {
        tx = await contract.reject({ from: p2 });
      });

      it('fires a Modified event', async () => {
        expect(tx.logs[0]).to.have.property('event', 'Modified');
        expect(tx.logs[0]).to.have.nested.property('args.from', p2);
        expect(tx.logs[0]).to.have.nested.property('args.to', p1);
        expect(tx.logs[0]).to.have.nested.property('args.state');
        expect(tx.logs[0].args.state).to.eql(toBN(2));
      });

      it('sets the state to rejected', async () => {
        const status = await contract.state();
        expect(status).to.eql(toBN(2));
      });

      it('blocks p1 from canceling', async () =>
                await testIsBlocked(contract.cancel, p1, 'InvalidContractState'));
      it('blocks p2 from accepting', async () =>
                await testIsBlocked(contract.accept, p2, 'InvalidContractState'));
      it('blocks p2 from rejecting', async () =>
                await testIsBlocked(contract.reject, p2, 'InvalidContractState'));
    });
  });

  describe('p1 -> p2, p1 modifies', () => { /* TODO */ });
  describe('p1 -> p2, p2 modifies', () => { /* TODO */ });
});
