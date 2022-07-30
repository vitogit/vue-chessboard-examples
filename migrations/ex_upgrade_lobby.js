/*
const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
var Lobby = artifacts.require('Lobby');

module.exports = async function(deployer, network) {
  const lobby = await Lobby.deployed();
  const instance = await upgradeProxy(lobby.address, Lobby, { deployer });
  console.log('Upgraded', network, instance.address);
};
*/
