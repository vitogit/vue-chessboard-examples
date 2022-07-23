// SPDX-License-Identifier: GPL-V3
pragma solidity >=0.4.22 <0.9.0;
import './Lobby.sol';
import './ChessGame.sol';

contract Challenge {
  address public immutable lobby;
  address public immutable player1;
  address public immutable player2;
  address public game;
  bool public p1IsWhite;
  uint public wagerAmount;
  uint public timePerMove;
  // The receiver address get's passed back and forth
  // between the two players until one player accepts
  // the challenge
  address public sender;
  // TODO Remove receiver.  We can use sender only.
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
    bool startAsWhite,
    uint wager,
    uint timeout
  ) {
    // TODO Should verify this is actually the lobby somehow
    lobby = msg.sender;
    player1 = p1;
    player2 = p2;
    p1IsWhite = startAsWhite;
    wagerAmount = wager;
    timePerMove = timeout;
    // Set the sender and receiver
    sender = player1;
    receiver = player2;
    // Set contract state to pending
    state = State.Pending;
  }

  function whitePlayer() public view returns (address) {
    return p1IsWhite ? player1 : player2;
  }

  function blackPlayer() public view returns (address) {
    return p1IsWhite ? player2 : player1;
  }

  function otherPlayer() private view returns (address) {
    address white = whitePlayer();
    address black = blackPlayer();
    if (msg.sender == white) { return black; }
    else if (msg.sender == black) { return white; }
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

  function modify(bool _p1IsWhite,
                  uint _wagerAmount,
                  uint _timePerMove)
  external isPending playerOnly {
    setSenderReceiver();
    p1IsWhite = _p1IsWhite;
    wagerAmount = _wagerAmount;
    timePerMove = _timePerMove;
    emit ChallengeModified(msg.sender);
  }

  function cancel() external isPending senderOnly {
    setSenderReceiver();
    state = State.Canceled;
    Lobby(lobby).updateChallenge(msg.sender, state);
  }

  function decline() external isPending receiverOnly {
    setSenderReceiver();
    state = State.Declined;
    Lobby(lobby).updateChallenge(msg.sender, state);
  }

  function accept() external isPending receiverOnly {
    setSenderReceiver();
    state = State.Accepted;
    Lobby(lobby).updateChallenge(msg.sender, state);
    address white = whitePlayer();
    address black = blackPlayer();
    ChessGame _game = new ChessGame(white, black, timePerMove);
    game = address(_game);
    Lobby(lobby).startGame(game, white, black);
  }
}
