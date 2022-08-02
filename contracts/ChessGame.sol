// SPDX-License-Identifier: GPL-V3
pragma solidity >=0.4.22 <0.9.0;
import './Lobby.sol';
import './Challenge.sol';
import './lib/stringUtils.sol';

contract ChessGame {
  address public immutable lobby;
  address public immutable challenge;
  address public immutable arbiter;
  address public immutable whitePlayer;
  address public immutable blackPlayer;
  uint public immutable timePerMove;      // Seconds per move
  uint public timeOfLastMove;             // Seconds from the last move
  bool public isWhiteMove;
  // A common error is the user send the tx twice before the
  // block is mined.  This is an easy way to prevent it.
  string private prevWhiteMove;
  string private prevBlackMove;
  // Moveflags
  bytes1 private whiteFlags;
  bytes1 private blackFlags;
  bytes1 private checkMask = 0x01;
  bytes1 private checkmateMask = 0x02;
  bytes1 private stalemateMask = 0x04;

  enum GameOutcome { Undecided, WhiteWon, BlackWon, Draw }
  GameOutcome public outcome;

  enum State { Started, Finished, Paused, Review }
  State public state;

  event MoveSAN(address indexed player, string san, bytes1 flags);
  event ArbiterAction(address indexed arbiter, string comment);

  modifier currentPlayer() {
    require(isWhiteMove ? (msg.sender == whitePlayer)
                        : (msg.sender == blackPlayer)
          , 'CurrentPlayerOnly');
    _;
  }

  modifier isOtherPlayer() {
    require(isWhiteMove ? (msg.sender == blackPlayer)
                        : (msg.sender == whitePlayer)
          , 'OtherPlayerOnly');
    _;
  }

  modifier playerOnly() {
    require(msg.sender == whitePlayer || msg.sender == blackPlayer, 'PlayerOnly');
    _;
  }

  modifier arbiterOnly() {
    require(msg.sender == arbiter, 'ArbiterOnly');
    _;
  }

  modifier inProgress() {
    require(state == State.Started, 'InvalidContractState');
    _;
  }

  modifier inReview() {
    require(state == State.Review, 'InvalidContractState');
    _;
  }

  modifier isFinished() {
    require(state == State.Finished, 'InvalidContractState');
    _;
  }

  function timeExpired() public view returns (bool) {
    return block.timestamp > timeOfLastMove+timePerMove;
  }

  modifier timerExpired() {
    require(timeExpired(), 'TimerStillActive');
    _;
  }

  modifier timerActive() {
    require(!timeExpired(), 'TimerExpired');
    _;
  }

  // FIXME Should check this is being created by the Lobby contract
  constructor(address white, address black, uint movetime) {
    challenge = msg.sender;
    lobby = Challenge(challenge).lobby();
    arbiter = Lobby(lobby).arbiter();
    whitePlayer = white;
    blackPlayer = black;
    timePerMove = movetime;
    isWhiteMove = true;
    timeOfLastMove = block.timestamp;
    state = State.Started;
  }

  function isWhitePlayer() private view returns (bool) {
    return (msg.sender == whitePlayer);
  }

  function otherPlayer() private view returns (address) {
    if (msg.sender == whitePlayer) return blackPlayer;
    else if (msg.sender == blackPlayer) return whitePlayer;
    else return address(0);
  }

  function winner() public view isFinished returns (address) {
    if (outcome == GameOutcome.WhiteWon) return whitePlayer;
    else if (outcome == GameOutcome.BlackWon) return blackPlayer;
    else return address(0);
  }

  function loser() public view isFinished returns (address) {
    if (outcome == GameOutcome.WhiteWon) return blackPlayer;
    else if (outcome == GameOutcome.BlackWon) return whitePlayer;
    else return address(0);
  }

  function finish(GameOutcome _outcome) private {
    outcome = _outcome;
    state = State.Finished;
    Challenge(challenge).disburse(_outcome, winner());
    Lobby(lobby).finishGame(winner(), loser());
  }

  /* Probably going to be easier this way once you implement bitboards
  //function move(bytes1 piece, bytes1 from, bytes1 to) external inProgress currentPlayer {
  function move(bytes1 from, bytes1 to) external inProgress currentPlayer {
    isWhiteMove = !isWhiteMove;
    emit MovedPiece(msg.sender, from, to);
    // TODO Calculate the SAN
  }
  */

  // TODO Remove the previous move checks in bitboard implementation
  function move(string memory san, bytes1 flags) public
  inProgress currentPlayer timerActive {
    if (msg.sender == whitePlayer) {
      require(!StringUtils.equal(san, prevWhiteMove), 'IllegalMove');
      prevWhiteMove = san;
      whiteFlags = flags;
    }
    else if (msg.sender == blackPlayer) {
      require(!StringUtils.equal(san, prevBlackMove), 'IllegalMove');
      prevBlackMove = san;
      blackFlags = flags;
    }

    if ((stalemateMask & whiteFlags & blackFlags) > 0) {      // stalemate
      finish(GameOutcome.Draw);
      return;
    }

    isWhiteMove = !isWhiteMove;
    timeOfLastMove = block.timestamp;
    emit MoveSAN(msg.sender, san, flags);
    Lobby(lobby).broadcastMove(msg.sender, otherPlayer());
  }

  function resign() external inProgress playerOnly {
    if (msg.sender == whitePlayer) finish(GameOutcome.BlackWon);
    else if (msg.sender == blackPlayer) finish(GameOutcome.WhiteWon);
  }

  function dispute() external inProgress playerOnly {
    state = State.Review;
    Lobby(lobby).disputeGame(msg.sender, otherPlayer());
  }

  function claim() external inProgress isOtherPlayer timerExpired {
    if (msg.sender == whitePlayer) finish(GameOutcome.WhiteWon);
    else if (msg.sender == blackPlayer) finish(GameOutcome.BlackWon);
  }

  function resolve(GameOutcome _outcome, address _winner, string memory comment)
  public inReview arbiterOnly {
    if (_outcome == GameOutcome.WhiteWon) {
      require(_winner == whitePlayer, 'AddressMismatch');
    } else if (_outcome == GameOutcome.BlackWon) {
      require(_winner == blackPlayer, 'AddressMismatch');
    }
    finish(_outcome);
    emit ArbiterAction(msg.sender, comment);
  }

  function resolve(GameOutcome _outcome, address _winner)
  external inReview arbiterOnly {
    if (_outcome == GameOutcome.WhiteWon) resolve(_outcome, _winner, 'White won');
    else if (_outcome == GameOutcome.BlackWon) resolve(_outcome, _winner, 'Black won');
    else if (_outcome == GameOutcome.Draw) resolve(_outcome, _winner, 'Draw');
  }
}
