// SPDX-License-Identifier: GPL-V3
pragma solidity >=0.4.22 <0.9.0;

import './BaseContract.sol';

contract Challenge is BaseContract {
  // Addresses of the players
  address public immutable p1Addr;
  address public immutable p2Addr;
  // The receiver address get's passed back and forth
  // between the two players until one player accepts
  // the challenge
  address public sender;
  address public receiver;
  // The wager amount.  At this stage, nothing is final
  // and both players can modify the proposal
  GameParams public proposal;     // NOTE research if it's ok
                                  //      to use a getter on a
                                  //      struct like this

  event Accepted(address sender);
  event Declined(address sender);
  event Canceled(address sender);
  event Modified(address sender, address receiver);

  // FIXME Need an Expired state as well once you get to
  //       the time stuff
  enum State { Pending, Accepted, Declined, Canceled }
  State public state;
  function currentState() public view returns (string memory) {
    if (state == State.Pending) return 'pending';
    if (state == State.Accepted) return 'accepted';
    if (state == State.Declined) return 'declined';
    if (state == State.Canceled) return 'canceled';
  }

  modifier playerOnly() {
    require(msg.sender == p1Addr || msg.sender == p2Addr, 'PlayerOnly');
    _;
  }

  modifier senderOnly() {
    require(msg.sender == sender, 'SenderOnly');
    _;
  }

  modifier receiverOnly() {
    require(msg.sender == receiver, 'ReceiverOnly');
    _;
  }

  modifier isPending() {
    require(state == State.Pending, 'InvalidContractState');
    _;
  }

  // FIXME: Support different wager amounts
  constructor(
    address player2,
    bool startAsWhite,
    uint wagerAmount,
    uint timePerMove
  ) public {
    p1Addr = msg.sender;
    p2Addr = player2;
    // Set the sender and receiver
    sender = p1Addr;
    receiver = p2Addr;
    // Create the proposal
    proposal.p1IsWhite = startAsWhite;
    proposal.wagerAmount = wagerAmount;
    proposal.timePerMove = timePerMove;
    // Set contract state to pending
    state = State.Pending;
  }

  function cancel() external isPending senderOnly {
    state = State.Canceled;
    emit Canceled(msg.sender);
  }

  function accept() external isPending receiverOnly {
    state = State.Accepted;
    emit Accepted(msg.sender);
  }

  function reject() external isPending receiverOnly {
    state = State.Declined;
    emit Declined(msg.sender);
  }

  function modify(bool p1IsWhite,
                  uint wagerAmount,
                  uint timePerMove)
  external isPending receiverOnly {
    // Modify the proposal
    proposal.p1IsWhite = p1IsWhite;
    proposal.wagerAmount = wagerAmount;
    proposal.timePerMove = timePerMove;

    // Switch sender and receiver
    address a = sender;
    sender = receiver;
    receiver = a;

    // Emit modified data
    emit Modified(sender, receiver);
  }
}
