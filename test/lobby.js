const Lobby = artifacts.require("Lobby");

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
contract("Lobby", function (accounts) {
  // Useful Addresses
  let lobby, arbiter, p1, p2, p3;
  // Contract variables
  let p1IsWhite, wagerAmount, timePerMove;

  before(async () => {
    lobby = await Lobby.deployed();
    [ arbiter, p1, p2, p3 ] = accounts;
    p1IsWhite = true;
    wagerAmount = 100;
    timePerMove = 1000;
  });

  it("Fetches the correct arbiter", async () => {
    const addr = await lobby.arbiter();
    expect(addr).to.equal(arbiter);
  });

  describe('p1 challenges p2', async () => {
    let tx, challenge;

    before(async () => {
      tx = await lobby.challenge(p2
                               , p1IsWhite
                               , wagerAmount
                               , timePerMove
                               , { from: p1 });
    });

    it('Fires a NewContract event', async () => {
      expect(tx.logs[0]).to.have.property('event', 'NewContract');
      expect(tx.logs[0]).to.have.nested.property('args.player1', p1);
      expect(tx.logs[0]).to.have.nested.property('args.player2', p2);
      expect(tx.logs[0]).to.have.nested.property('args.target');
      challenge = tx.logs[0].args.target;
    });

    it('Puts the Challenge in player 1 lobby', async () => {
      const challenges = await lobby.challenges({ from: p1 });
      expect(challenges).to.include(challenge);
    });

    it('Puts the Challenge in player 2 lobby', async () => {
      const challenges = await lobby.challenges({ from: p2 });
      expect(challenges).to.include(challenge);
    });
  });

  /*
  describe('p2 challenges p3', async () => {
    let challenge;

    before(async () => {
      wagerAmount -= 1;
      timePerMove -= 2;
      let c = await lobby.challenge(p3
                                      , p1IsWhite
                                      , wagerAmount
                                      , timePerMove
                                      , { from: p2 });
    });

    it('passes', async () => {
      expect(1).to.not.equal(2);
    });
  });
  */
});
