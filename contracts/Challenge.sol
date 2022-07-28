// SPDX-License-Identifier: GPL-V3
pragma solidity >=0.4.22 <0.9.0;
import './Lobby.sol';
import './ChessGame.sol';
import '@openzeppelin/contracts/utils/math/SafeMath.sol';

contract Challenge {
  using SafeMath for uint256;
  address public immutable lobby;
  address payable public immutable player1;
  address payable public immutable player2;
  address public game;
  bool public p1IsWhite;
  uint public timePerMove;
  uint public wagerAmount;
  uint public p1Balance;
  uint public p2Balance;
  // The receiver address get's passed back and forth
  // between the two players until one player accepts
  // the challenge
  address public sender;
  // TODO Remove receiver.  We can use sender only.
  address public receiver;

  enum State { Pending, Accepted, Declined, Canceled }
  State public state;
  event ChallengeModified(address indexed player);

  // FIXME Should check this is being created by the Lobby contract
  constructor(
    address payable p1,
    address payable p2,
    bool _p1IsWhite,
    uint _wagerAmount,
    uint _timePerMove
  ) payable {
    require(msg.value == _wagerAmount, 'InvalidDepositAmount');
    // TODO Should verify this is actually the lobby somehow
    lobby = msg.sender;
    player1 = p1;
    player2 = p2;
    p1IsWhite = _p1IsWhite;
    timePerMove = _timePerMove;
    wagerAmount = _wagerAmount;
    p1Balance = msg.value;
    // Set the sender and receiver
    sender = player1;
    receiver = player2;
    // Set contract state to pending
    state = State.Pending;
  }

  modifier gameOnly() {
    require(msg.sender == game, 'GameOnly');
    _;
  }

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

  modifier isAccepted() {
    require(state == State.Accepted, 'InvalidContractState');
    _;
  }

  modifier playerIsFunded() {
    if (msg.sender == player1) {
      require(p1Balance >= wagerAmount, 'InsufficientPlayerFunds');
    } else {
      require(p2Balance >= wagerAmount, 'InsufficientPlayerFunds');
    }
    _;
  }

  modifier bothPlayersFunded() {
    require(p1Balance >= wagerAmount
         && p2Balance >= wagerAmount
         , 'InsufficientPlayerFunds');
    _;
  }

  modifier setSenderReceiver() {
    if (msg.sender == player1) {
      sender = player1;
      receiver = player2;
    } else if (msg.sender == player2) {
      sender = player2;
      receiver = player1;
    }
    _;
  }

  modifier updateFunds() {
    if (msg.sender == player1) p1Balance += msg.value;
    else if (msg.sender == player2) p2Balance += msg.value;
    _;
  }

  function whitePlayer() public view returns (address payable) {
    return p1IsWhite ? player1 : player2;
  }

  function blackPlayer() public view returns (address payable) {
    return p1IsWhite ? player2 : player1;
  }

  function otherPlayer() private view returns (address) {
    address white = whitePlayer();
    address black = blackPlayer();
    if (msg.sender == white) { return black; }
    else if (msg.sender == black) { return white; }
  }

  function refund() private {
    player1.transfer(p1Balance);
    p1Balance = 0;

    player2.transfer(p2Balance);
    p2Balance = 0;
  }

  function refundExcess() private {
    uint p1Diff = p1Balance.sub(wagerAmount);
    uint p2Diff = p2Balance.sub(wagerAmount);

    if (p1Diff > 0) {
      player1.transfer(p1Diff);
      p1Balance = wagerAmount;
    }

    if (p2Diff > 0) {
      player2.transfer(p2Diff);
      p2Balance = wagerAmount;
    }
  }

  function modify(bool _p1IsWhite,
                  uint _wagerAmount,
                  uint _timePerMove)
  external payable
  isPending playerOnly updateFunds playerIsFunded setSenderReceiver {
    p1IsWhite = _p1IsWhite;
    wagerAmount = _wagerAmount;
    timePerMove = _timePerMove;
    emit ChallengeModified(msg.sender);
  }

  function cancel() external isPending senderOnly setSenderReceiver {
    state = State.Canceled;
    Lobby(lobby).updateChallenge(msg.sender, state);
    refund();
  }

  function decline() external isPending receiverOnly setSenderReceiver {
    state = State.Declined;
    Lobby(lobby).updateChallenge(msg.sender, state);
    refund();
  }

  function accept() external payable
  isPending receiverOnly updateFunds bothPlayersFunded setSenderReceiver {
    state = State.Accepted;
    Lobby(lobby).updateChallenge(msg.sender, state);
    address white = whitePlayer();
    address black = blackPlayer();
    ChessGame _game = new ChessGame(white, black, timePerMove);
    game = address(_game);
    Lobby(lobby).startGame(game, white, black);
    refundExcess();
  }

  function disburse(ChessGame.GameOutcome _outcome, address _winner) external
  isAccepted gameOnly {
    if (_outcome == ChessGame.GameOutcome.WhiteWon) {
      require(_winner == whitePlayer(), 'InvalidWinningAddress');
      whitePlayer().transfer(p1Balance+p2Balance); 
    } else if (_outcome == ChessGame.GameOutcome.BlackWon) {
      require(_winner == blackPlayer(), 'InvalidWinningAddress');
      blackPlayer().transfer(p1Balance+p2Balance); 
    } else if (_outcome == ChessGame.GameOutcome.Draw) {
      player1.transfer(p1Balance);
      player2.transfer(p2Balance);
    }
  }
}
