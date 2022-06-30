const BlockList = artifacts.require("BlockList");

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
contract("BlockList", function (/* accounts */) {
  it("should assert true", async function () {
    await BlockList.deployed();
    return assert.isTrue(true);
  });
});
