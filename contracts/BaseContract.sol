// SPDX-License-Identifier: GPL-V3
pragma solidity >=0.4.22 <0.9.0;

abstract contract BaseContract {
  /*
  // This is intended to make it easy to look up both currently
  // active contracts as well as historical contracts.  Useful in
  // a variety of scenarios.
  struct UserContractLUT {
    address[] current;
    address[] all;
  }
  */

  struct GameParams {
    bool p1IsWhite;
    uint wagerAmount;
    uint timePerMove;
  }

  event NewContract(
    address indexed player1,
    address indexed player2,
    address target
  );

  // FIXME: Fallback function
}
