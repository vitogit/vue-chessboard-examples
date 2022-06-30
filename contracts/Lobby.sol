// SPDX-License-Identifier: GPL-V3
pragma solidity >=0.4.22 <0.9.0;

import './BaseContract.sol';
import './Challenge.sol';

contract Lobby is BaseContract {
  address public immutable arbiter;

  // Map of users current and historical games, contracts
  /*
  struct UserLobby {
    UserContractLUT challenges;
    UserContractLUT games;
  }
  */
  struct UserLobby {
    Challenge[] challenges;
    address[] games;
  }
  mapping(address => UserLobby) private lobby;

  modifier denyArbiter() {
    require(msg.sender != arbiter, 'ArbiterProhibited');
    _;
  }

  constructor(address _arbiter) public {
    arbiter = _arbiter;
  }

  // External version.  Fetch for sender.
  function challenges() external view returns (Challenge[] memory) {
    UserLobby storage lobby = lobby[msg.sender];
    return lobby.challenges;
  }

  // Internal version.  Fetch for any player.
  function challenges(address player)
  internal view
  returns (Challenge[] storage) {
    UserLobby storage playerLobby = lobby[player];
    return playerLobby.challenges;
  }

  // Slightly more advanced, wagers can be different
  function challenge(address player2
                   , bool startAsWhite
                   , uint wagerAmount
                   , uint blocksPerMove)
  external denyArbiter {
    Challenge challenge = new Challenge(player2
                                      , startAsWhite
                                      , wagerAmount
                                      , blocksPerMove);
    // Put contract in player 1 lobby
    challenges(msg.sender).push(challenge);
    challenges(player2).push(challenge);
    // Emit a new event if everything succeeded
    emit NewContract(msg.sender, player2, address(challenge));
  }

  /*
  function getGames() public view returns (Challenge[]) {
  }
  */
}
