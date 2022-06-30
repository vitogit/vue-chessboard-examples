const Challenge = artifacts.require('Challenge');
const { toBN } = web3.utils;

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
contract('Challenge', function (accounts) {
  // Transaction variable
  let tx;
  // Useful Addresses
  let contract, arbiter, p1, p2, p3;
  // Contract variables
  let p1IsWhite, wagerAmount, timePerMove;

  before(async () => {
    [ arbiter, p1, p2, p3 ] = accounts;
    p1IsWhite = true;
    wagerAmount = 100;
    timePerMove = 1000;
  });

  const testContractState = (_state) => async function() {
    const s = await contract.currentState();
    expect(s).to.equal(_state);
  }

  const testProposal = async () => {
    const proposal = await contract.proposal();
    expect(proposal.p1IsWhite).to.eql(p1IsWhite);
    expect(proposal.wagerAmount).to.eql(toBN(wagerAmount));
    expect(proposal.timePerMove).to.eql(toBN(timePerMove));
  };

  const testContractIsLocked = async () => {
    try {
      await contract.cancel({ from: p1 })
      assert.fail('The contract should have failed');
    } catch (err) {
      expect(err.reason).to.equal('InvalidContractState');
    }

    try {
      await contract.accept({ from: p2 })
      assert.fail('The contract should have failed');
    } catch (err) {
      expect(err.reason).to.equal('InvalidContractState');
    }

    try {
      await contract.reject({ from: p2 })
      assert.fail('The contract should have failed');
    } catch (err) {
      expect(err.reason).to.equal('InvalidContractState');
    }
  }

  describe('p1 challenges p2', async () => {
    before(async () => {
      contract = await Challenge.new(p2
                                   , p1IsWhite
                                   , wagerAmount
                                   , timePerMove
                                   , { from: p1 });
    });

    it('player1 is accounts[1]', async () => {
      const addr = await contract.p1Addr();
      expect(addr).to.equal(p1);
    });

    it('player2 is accounts[2]', async () => {
      const addr = await contract.p2Addr();
      expect(addr).to.equal(p2);
    });

    it('updates the proposal', testProposal);
    it('contract state is pending', testContractState('pending'));

    describe('p2 modifies the proposal', async () => {
      before(async () => {
        p1IsWhite = !p1IsWhite;
        wagerAmount -= 1;
        timePerMove -= 2;
        tx = await contract.modify(p1IsWhite
                            , wagerAmount
                            , timePerMove
                            , { from: p2 });
      });
      it('updates the proposal', testProposal);
      it('contract state is pending', testContractState('pending'));

      it('Fires a Modified event', async () => {
        expect(tx.logs[0]).to.have.property('event', 'Modified');
        expect(tx.logs[0]).to.have.nested.property('args.sender', p2);
        expect(tx.logs[0]).to.have.nested.property('args.receiver', p1);
      });

      it('switches the sender and receiver', async () => {
        const sender = await contract.sender();
        const receiver = await contract.receiver();
        expect(sender).to.equal(p2);
        expect(receiver).to.equal(p1);
      });

      for (var j=0; j<3; j++) {
        it('p2 cannot modify the proposal now', async () => {
          try {
            await contract.modify(!p1IsWhite
                                , wagerAmount-1
                                , timePerMove-1
                                , { from: p2 });
            assert.fail('The contract should have failed');
          } catch (err) {
            expect(err.reason).to.equal('ReceiverOnly');
          }
        });
      }

      describe('p1 modifies the proposal', async () => {
        before(async () => {
          p1IsWhite = !p1IsWhite;
          wagerAmount -= 7;
          timePerMove -= 11;
          tx = await contract.modify(p1IsWhite
                              , wagerAmount
                              , timePerMove
                              , { from: p1 });
        });
        it('updates the proposal', testProposal);
        it('contract state is pending', testContractState('pending'));

        it('Fires a Modified event', async () => {
          expect(tx.logs[0]).to.have.property('event', 'Modified');
          expect(tx.logs[0]).to.have.nested.property('args.sender', p1);
          expect(tx.logs[0]).to.have.nested.property('args.receiver', p2);
        });

        it('switches the sender and receiver', async () => {
          const sender = await contract.sender();
          const receiver = await contract.receiver();
          expect(sender).to.equal(p1);
          expect(receiver).to.equal(p2);
        });

        it('p1 cannot modify the proposal now', async () => {
          try {
            await contract.modify(!p1IsWhite
                                , wagerAmount-1
                                , timePerMove-1
                                , { from: p1 });
            assert.fail('The contract should have failed');
          } catch (err) {
            expect(err.reason).to.equal('ReceiverOnly');
          }
        });
      });
    });

    // NOTE These ones should be tested in solidity as well.  It seems like
    //      javascript is doing some pre-detection of the illegal value
    //      since it's giving a javascript error instead of a solidity one
    describe('p2 attempts some illegal modifications', async () => {
      it('does not allow you to set a negative wager', async () => {
        try {
            await contract.modify(p1IsWhite
                                , -1
                                , timePerMove
                                , { from: p2 });
            assert.fail('The contract should have failed');
          } catch (err) {
            expect(err.message).to.match(/out-of-bounds/);
        }
      });

      it('does not allow you to set a negative time limit', async () => {
        try {
            await contract.modify(p1IsWhite
                                , wagerAmount
                                , -1
                                , { from: p2 });
            assert.fail('The contract should have failed');
          } catch (err) {
            expect(err.message).to.match(/out-of-bounds/);
        }
      });
    });

    // TODO
    describe('p3 tries to interact with contract', async () => {
      it('passes', async () => {
        expect(1).to.not.equal(2);
      });
    });
  });

  describe('p1 challenges p2 and then cancels', async () => {
    before(async () => {
      contract = await Challenge.new(p2, true, 10, 100, { from: p1 });
      tx = await contract.cancel({ from: p1 });
    });

    it('Fires a Canceled event', async () => {
      expect(tx.logs[0]).to.have.property('event', 'Canceled');
      expect(tx.logs[0]).to.have.nested.property('args.sender', p1);
    });

    it('contract state is canceled', testContractState('canceled'));
    it('locks the contract', testContractIsLocked);
  });

  describe('p1 challenges p2 and p2 accepts', async () => {
    before(async () => {
      contract = await Challenge.new(p2, true, 10, 100, { from: p1 });
      tx = await contract.accept({ from: p2 })
    });

    it('Fires a Accepted event', async () => {
      expect(tx.logs[0]).to.have.property('event', 'Accepted');
      expect(tx.logs[0]).to.have.nested.property('args.sender', p2);
    });

    it('contract state is accepted', testContractState('accepted'));
    it('locks the contract', testContractIsLocked);
  });

  describe('p1 challenges p2 and p2 rejects', async () => {
    before(async () => {
      contract = await Challenge.new(p2, true, 10, 100, { from: p1 });
      tx = await contract.reject({ from: p2 })
    });

    it('Fires a Declined event', async () => {
      expect(tx.logs[0]).to.have.property('event', 'Declined');
      expect(tx.logs[0]).to.have.nested.property('args.sender', p2);
    });

    it('contract state is declined', testContractState('declined'));
    it('locks the contract', testContractIsLocked);
  });
});
