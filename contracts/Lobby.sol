// SPDX-License-Identifier: GPL-V3
pragma solidity >=0.4.22 <0.9.0;

import './BaseContract.sol';
import './Challenge.sol';

contract Lobby is BaseContract {
  address public immutable arbiter;

  constructor(address _arbiter) public {
    arbiter = _arbiter;
  }

  // Slightly more advanced, wagers can be different
  function challenge(address player2
                   , bool startAsWhite
                   , uint wagerAmount
                   , uint timePerMove)
  external {
    Challenge challenge = new Challenge(msg.sender
                                     , player2
                                     , startAsWhite
                                     , wagerAmount
                                     , timePerMove);
    emit NewContract(msg.sender, player2, address(challenge));
  }
}
