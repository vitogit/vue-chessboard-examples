// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

// I considered making this an interface, but in that case the
// data would be reset when I re-deploy the lobby
contract BlockList {
  // Map containing blocked users and who's blocked a user
  struct UserBlockList {
    address[] blockedUsers;
    address[] blockedBy;
  }
  mapping(address => UserBlockList) private blockList;

  function blockUser(address user) external {
  }

  function unblockUser(address user) external {
  }
}
