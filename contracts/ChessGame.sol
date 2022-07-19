// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
import './Lobby.sol';
import './Challenge.sol';

contract ChessGame {
  address public immutable lobby;
  address public immutable challenge;
  address public immutable arbiter;
  address public immutable whitePlayer;
  address public immutable blackPlayer;
  uint public immutable timePerMove;
  bool public isWhiteMove;

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
  //event MovedPiece(address indexed player, bytes1 from, bytes1 to);
  //event CapturedPiece(address indexed player, bytes2 from, bytes2 to);
  event ArbiterAction(address indexed arbiter, string comment);

  modifier currentPlayer() {
    require(isWhiteMove ? (msg.sender == whitePlayer)
                        : (msg.sender == blackPlayer)
          , 'CurrentPlayerOnly');
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

  // FIXME Should check this is being created by the Lobby contract
  constructor(address white, address black, uint movetime) public {
    challenge = msg.sender;
    lobby = Challenge(challenge).lobby();
    arbiter = Lobby(lobby).arbiter();
    whitePlayer = white;
    blackPlayer = black;
    timePerMove = movetime;
    isWhiteMove = true;
    state = State.Started;
  }

  function isWhitePlayer() private returns (bool) {
    return (msg.sender == whitePlayer);
  }

  function otherPlayer() private returns (address) {
    if (msg.sender == whitePlayer) { return blackPlayer; }
    else if (msg.sender == blackPlayer) { return whitePlayer; }
  }

  function winner() public view isFinished returns (address) {
    if (outcome == GameOutcome.WhiteWon) return whitePlayer;
    else if (outcome == GameOutcome.BlackWon) return blackPlayer;
  }

  function finish(GameOutcome result) private {
    outcome = result;
    state = State.Finished;
    Lobby(lobby).finishGame(result, winner());
  }

  /* Probably going to be easier this way once you implement bitboards
  //function move(bytes1 piece, bytes1 from, bytes1 to) external inProgress currentPlayer {
  function move(bytes1 from, bytes1 to) external inProgress currentPlayer {
    isWhiteMove = !isWhiteMove;
    emit MovedPiece(msg.sender, from, to);
    // TODO Calculate the SAN
  }
  */

  function move(string memory san, bytes1 flags) public inProgress currentPlayer {
    if (msg.sender == whitePlayer) whiteFlags = flags;
    else if (msg.sender == blackPlayer) blackFlags = flags;
    if ((stalemateMask & whiteFlags & blackFlags) > 0) {      // stalemate
      finish(GameOutcome.Draw);
      return;
    }

    isWhiteMove = !isWhiteMove;
    emit MoveSAN(msg.sender, san, flags);
  }

  function resign() external inProgress playerOnly {
    if (msg.sender == whitePlayer) finish(GameOutcome.BlackWon);
    else if (msg.sender == blackPlayer) finish(GameOutcome.WhiteWon);
  }

  function dispute() external inProgress playerOnly {
    state = State.Review;
    Lobby(lobby).disputeGame(msg.sender);
  }

  function resolve(address winner, string memory comment) internal arbiterOnly inReview {
    if (winner == whitePlayer) finish(GameOutcome.WhiteWon);
    else if (winner == blackPlayer) finish(GameOutcome.BlackWon);
    //else /* TODO */
    emit ArbiterAction(msg.sender, comment);
  }

  function resolve(address winner) external arbiterOnly inReview {
    if (winner == whitePlayer) resolve(winner, 'White won');
    else if (winner == blackPlayer) resolve(winner, 'Black won');
    //else /* TODO */
  }
}
