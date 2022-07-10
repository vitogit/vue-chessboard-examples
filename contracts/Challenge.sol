// SPDX-License-Identifier: GPL-V3
pragma solidity >=0.4.22 <0.9.0;

import './BaseContract.sol';
import './ChessGame.sol';

contract Challenge is BaseContract {
  address public immutable lobby;
  // Addresses of the players
  address public immutable player1;
  address public immutable player2;
  // The receiver address get's passed back and forth
  // between the two players until one player accepts
  // the challenge
  address public sender;
  address public receiver;
  address public game;
  // The wager amount.  At this stage, nothing is final
  // and both players can modify the proposal
  GameParams public proposal;

  // FIXME Need an Expired state as well once you get to
  //       the time stuff
  enum State { Pending, Accepted, Declined, Canceled }
  State public state;
  event Modified(address indexed from, address indexed to, State state);

  modifier playerOnly() {
    require(msg.sender == player1 || msg.sender == player2, 'PlayerOnly');
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

  // FIXME Should check this is being created by the Lobby contract
  constructor(
    address _player1,
    address _player2,
    bool p1IsWhite,
    uint wagerAmount,
    uint timePerMove
  ) public {
    // FIXME Should verify this is actually the lobby somehow
    lobby = msg.sender;
    player1 = _player1;
    player2 = _player2;
    // Set the sender and receiver
    sender = player1;
    receiver = player2;
    // Create the proposal
    proposal.p1IsWhite = p1IsWhite;
    proposal.wagerAmount = wagerAmount;
    proposal.timePerMove = timePerMove;
    // Set contract state to pending
    state = State.Pending;
  }

  function swapSenderReceiver() private {
    address a = sender;
    sender = receiver;
    receiver = a;
  }

  function whitePlayer() public view returns (address) {
    return proposal.p1IsWhite ? player1 : player2;
  }

  function blackPlayer() public view returns (address) {
    return proposal.p1IsWhite ? player2 : player1;
  }

  function cancel() external isPending senderOnly {
    state = State.Canceled;
    emit Modified(sender, receiver, state);
  }

  function accept() external isPending receiverOnly {
    state = State.Accepted;
    emit Modified(receiver, sender, state);

    address white = whitePlayer();
    address black = blackPlayer();
    ChessGame addr = new ChessGame(white
                                 , black
                                 , proposal.timePerMove);
    game = address(addr);
    emit NewContract(white, black, game);
  }

  function reject() external isPending receiverOnly {
    state = State.Declined;
    emit Modified(receiver, sender, state);
  }

  function modify(bool p1IsWhite,
                  uint wagerAmount,
                  uint timePerMove)
  external isPending playerOnly {
    // Modify the proposal
    proposal.p1IsWhite = p1IsWhite;
    proposal.wagerAmount = wagerAmount;
    proposal.timePerMove = timePerMove;

    // Do nothing if the sender modifies
    if (msg.sender == receiver) {
      swapSenderReceiver();
    }

    // Emit modified data
    emit Modified(sender, receiver, state);
  }
}
