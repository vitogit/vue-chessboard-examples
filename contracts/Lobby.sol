// SPDX-License-Identifier: GPL-V3
pragma solidity >=0.4.22 <0.9.0;
import './Challenge.sol';
import './ChessGame.sol';

contract Lobby {
  address public immutable arbiter;

  event CreatedChallenge(address challenge
                       , address indexed player1
                       , address indexed player2);
  event CanceledChallenge(address indexed challenge
                        , address indexed player
                        , Challenge.State state);
  event GameStarted(address game
                  , address indexed whitePlayer
                  , address indexed blackPlayer);
  event GameFinished(address indexed game
                   , ChessGame.GameOutcome outcome
                   , address indexed winner);
  event GameDisputed(address indexed game
                   , address indexed player);

  struct ChallengeMetadata { Challenge.State state; address game; bool exists; }
  struct GameMetadata { ChessGame.State state; address challenge; bool exists; }
  mapping(address => ChallengeMetadata) internal challenges;
  mapping(address => GameMetadata) internal games;

  modifier isCurrentChallenge {
    require(challenges[msg.sender].exists, 'ChallengeContractOnly');
    _;
  }

  modifier isCurrentGame {
    require(games[msg.sender].exists, 'GameContractOnly');
    _;
  }

  constructor(address _arbiter) public {
    arbiter = _arbiter;
  }

  // Slightly more advanced, wagers can be different
  function challenge(address player2, bool startAsWhite, uint wagerAmount, uint timePerMove)
  external {
    Challenge _challenge = new Challenge(msg.sender
                                       , player2
                                       , startAsWhite
                                       , wagerAmount
                                       , timePerMove);
    challenges[address(_challenge)] = ChallengeMetadata(Challenge.State.Pending
                                                      , address(0)
                                                      , true);
    emit CreatedChallenge(address(_challenge), msg.sender, player2);
  }

  function cancel(address sender, Challenge.State state)
  external isCurrentChallenge {
    address _challenge = msg.sender;
    delete challenges[_challenge];
    emit CanceledChallenge(_challenge, sender, state);
  }

  function startGame(address game, address whitePlayer, address blackPlayer)
  external isCurrentChallenge {
    address _challenge = msg.sender;
    games[game] = GameMetadata(ChessGame.State.Started
                            , _challenge
                            , true);
    challenges[_challenge] = ChallengeMetadata(Challenge(_challenge).state(), game, true);
    emit GameStarted(game, whitePlayer, blackPlayer);
  }

  function finishGame(ChessGame.GameOutcome outcome, address winner)
  external isCurrentGame {
    address _game = msg.sender;
    address _challenge = games[_game].challenge;
    // TODO Unlock funds from the challenge
    delete games[_game];
    delete challenges[_challenge];
    emit GameFinished(_game, outcome, winner);
  }

  function disputeGame(address player)
  external isCurrentGame {
    address _game = msg.sender;
    emit GameDisputed(_game, player);
  }
}
