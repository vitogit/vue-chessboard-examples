const _ = require('underscore');
const Lobby = artifacts.require('Lobby');
const Challenge = artifacts.require('Challenge');
const { toBN } = web3.utils;

contract('Lobby', function (accounts) {
  let lobby;
  let [ arbiter, p1, p2, p3 ] = accounts;

  before(async () => { lobby = await Lobby.deployed() });

  it('Fetches the correct arbiter', async () => {
    const addr = await lobby.arbiter();
    expect(addr).to.equal(arbiter);
  });

  function testChallenge(from, to, playAsWhite, wager, timeout) {
    return async () => {
      let tx, challenge;

      before(async () => {
        tx = await lobby.challenge(to
                                 , playAsWhite
                                 , wager
                                 , timeout
                                 , { from });
        expect(tx.logs[0]).to.have.nested.property('args.challenge');
        challenge = tx.logs[0].args.challenge;
      });

      it('Fires a CreatedChallenge event', async () => {
        const [ ev ] = _.filter(tx.logs, l => l.event === 'CreatedChallenge');
        expect(ev).to.be.ok;
        expect(ev).to.have.nested.property('args.challenge');
        expect(ev).to.have.nested.property('args.player1', from);
        expect(ev).to.have.nested.property('args.player2', to);
      });

      // FIXME Create a game manually if you can and pass that instead of
      //       challenge.  It's hard to test because game calls back to
      //       lobby.
      it('players can\'t start the game', async () => {
        for (var player of [ from, to ]) {
          try {
            await lobby.startGame(challenge, from, to);
            assert.fail('Contract should have failed');
          } catch(err) {
            expect(err.reason).to.equal('ChallengeContractOnly');
          }
        }
      });

      it('players can\'t finish the game', async () => {
        for (var player of [ from, to ]) {
          try {
            await lobby.finishGame(1, player);
            assert.fail('Contract should have failed');
          } catch(err) {
            expect(err.reason).to.equal('GameContractOnly');
          }
        }
      });
    };
  };

  describe ('p1 -> p2', testChallenge(p1, p2, true, 0, 1));
  describe ('p2 -> p3', testChallenge(p2, p3, true, 1, 2));
  describe ('p3 -> arbiter', testChallenge(p3, arbiter, true, 2, 3));
  describe ('arbiter -> p1', testChallenge(arbiter, p1, true, 3, 4));

  describe ('Can wager up to 18 decimal places', async () => { /* TODO */ });
  describe ('Can\'t wager 19 decimal places', async () => { /* TODO */ });
  describe ('Can\'t make a negative wager', async () => { /* TODO */ });
  describe ('Can\'t set a zero timeout', async () => { /* TODO */ });
  describe ('Can\'t set a negative timeout', async () => { /* TODO */ });
});
