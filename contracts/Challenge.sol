// SPDX-License-Identifier: GPL-V3
pragma solidity >=0.4.22 <0.9.0;
import './Lobby.sol';
import './ChessGame.sol';

contract Challenge {
  address public immutable lobby;
  address public immutable player1;
  address public immutable player2;
  address public game;
  struct GameParams {
    bool p1IsWhite;
    uint wagerAmount;
    uint timePerMove;
  }
  GameParams public proposal;
  // The receiver address get's passed back and forth
  // between the two players until one player accepts
  // the challenge
  address public sender;
  address public receiver;

  // FIXME Need an Expired state as well once you get to
  //       the time stuff
  enum State { Pending, Accepted, Declined, Canceled }
  State public state;
  event ChallengeModified(address indexed player);

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
    address p1,
    address p2,
    bool p1IsWhite,
    uint wagerAmount,
    uint timePerMove
  ) public {
    // TODO Should verify this is actually the lobby somehow
    lobby = msg.sender;
    player1 = p1;
    player2 = p2;
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

  function whitePlayer() public view returns (address) {
    return proposal.p1IsWhite ? player1 : player2;
  }

  function blackPlayer() public view returns (address) {
    return proposal.p1IsWhite ? player2 : player1;
  }

  // TODO Make this a modifier
  function setSenderReceiver() private {
    if (msg.sender == player1) {
      sender = player1;
      receiver = player2;
    } else if (msg.sender == player2) {
      sender = player2;
      receiver = player1;
    } else {
      // FIXME Throw an error
    }
  }

  function modify(bool p1IsWhite,
                  uint wagerAmount,
                  uint timePerMove)
  external isPending playerOnly {
    setSenderReceiver();
    proposal.p1IsWhite = p1IsWhite;
    proposal.wagerAmount = wagerAmount;
    proposal.timePerMove = timePerMove;
    emit ChallengeModified(msg.sender);
  }

  function cancel() external isPending senderOnly {
    setSenderReceiver();
    state = State.Canceled;
    Lobby(lobby).cancel(msg.sender, state);
  }

  function decline() external isPending receiverOnly {
    setSenderReceiver();
    state = State.Declined;
    Lobby(lobby).cancel(msg.sender, state);
  }

  function accept() external isPending receiverOnly {
    setSenderReceiver();
    state = State.Accepted;
    // Create the game
    address white = whitePlayer();
    address black = blackPlayer();
    ChessGame _game = new ChessGame(white, black, proposal.timePerMove);
    game = address(_game);
    Lobby(lobby).startGame(address(game), white, black);
  }
}
