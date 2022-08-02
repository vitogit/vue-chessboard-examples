const _ = require('underscore');
const Lobby = artifacts.require('Lobby');
const Challenge = artifacts.require('Challenge');
const { getBalance } = web3.eth;
const { toBN, toWei } = web3.utils;

contract('Lobby', function (accounts) {
  let tx, lobby;
  let [ arbiter, p1, p2, p3 ] = accounts;

  before(async () => { lobby = await Lobby.deployed() });

  it('Fetches the correct arbiter', async () => {
    const addr = await lobby.arbiter();
    expect(addr).to.equal(arbiter);
  });

  describe('p1 -> p2 with no wager', () => {
    before(async () => {
      tx = await lobby.challenge(p2, true, 0, 60, { from: p1 });
    });

    it('fires a CreatedChallenge event', () => {
      const [ ev ] = _.filter(tx.logs, l => l.event === 'CreatedChallenge');
      expect(ev).to.be.ok;
      expect(ev).to.have.nested.property('args.player1', p1);
      expect(ev).to.have.nested.property('args.player2', p2);
      expect(ev).to.have.nested.property('args.challenge');
    });

    it('players can\'t start the game', async () => {
      for (var player of [ p1, p2, p3, arbiter ]) {
        try {
          // Just pass a bogus contract address
          await lobby.startGame('0x0000000000000000000000000000000000000000', p1, p2, { from: player });
          assert.fail('Should have failed'); 
        } catch(err) {
          expect(err.reason).to.equal('ChallengeContractOnly');
        }
      }
    });

    it('players can\'t finish the game', async () => {
      for (var player of [ p1, p2, p3, arbiter ]) {
        try {
          await lobby.finishGame(player, '0x0000000000000000000000000000000000000000', { from: player });
          assert.fail('Should have failed'); 
        } catch(err) {
          expect(err.reason).to.equal('GameContractOnly');
        }
      }
    });
  });

  describe('p2 -> p1 for 1 eth', () => {
    const wager = toWei('1', 'ether');

    before(async () => {
      tx = await lobby.challenge(p1, true, wager, 60
                              , { from: p2, value: wager });
    });

    it('fires a CreatedChallenge event', () => {
      const [ ev ] = _.filter(tx.logs, l => l.event === 'CreatedChallenge');
      expect(ev).to.be.ok;
      expect(ev).to.have.nested.property('args.player1', p2);
      expect(ev).to.have.nested.property('args.player2', p1);
      expect(ev).to.have.nested.property('args.challenge');
    });

    it('sends the funds through to the challenge', async () => {
      const challenge = tx.logs[0].args.challenge;
      const balance = await getBalance(challenge);
      expect(balance).to.equal(wager);
    });
  });

  describe('p1 doesn\'t deposit enough for the wager', () => {
    it('throws and InvalidDepositAmount error', async () => {
      try {
        const wager = toWei('1', 'ether');
        await lobby.challenge(p2, true, wager, 60
                            , { from: p1, value: wager-100 });
        assert.fail('Should have failed'); 
      } catch(err) {
        expect(err.reason).to.equal('InvalidDepositAmount');
      }
    });
  });

  describe ('wagering limits', () => { /* TODO */ });

  describe ('timePerMove limits', () => {
    it('doesn\'t allow 0 secs per move', async () => {
      try {
        await lobby.challenge(p1, true, 0, 0
                            , { from: p2, });
        assert.fail('Contract should have failed');
      } catch(err) {
        expect(err.reason).to.equal('InvalidTimePerMove');
      }
    });

    it('doesn\'t allow negative secs per move', async () => {
      try {
        await lobby.challenge(p1, true, 0, -60
                            , { from: p2, });
        assert.fail('Contract should have failed');
      } catch(err) {
        expect(err.reason).to.equal('value out-of-bounds');
      }
    });

    it('doesn\'t allow 59 secs per move', async () => {
      try {
        await lobby.challenge(p1, true, 0, 59
                            , { from: p2, });
        assert.fail('Contract should have failed');
      } catch(err) {
        expect(err.reason).to.equal('InvalidTimePerMove');
      }
    });

    it('does allow 60 secs per move', async () => {
      try {
        await lobby.challenge(p1, true, 0, 60
                            , { from: p2, });
      } catch(err) {
        assert.fail('Contract should have failed');
      }
    });
  });
});
