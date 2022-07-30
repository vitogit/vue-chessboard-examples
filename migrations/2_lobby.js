const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
var Lobby = artifacts.require('Lobby');

module.exports = async function(deployer, network, accounts) {
  console.log('Deploying to', network);
  if ([ 'development', 'test' ].includes(network)) {
    arbiter = accounts[0];
  } else {
    arbiter = '0x6D33531f7fe1059e64E1FC573C0Bc66C6d246E6c';
  }
  // TODO Hardcode the arbiter address
  const lobby = await deployProxy(Lobby, [ arbiter ], { deployer });
  console.log('Deployed', lobby.address);
};
