// SPDX-License-Identifier: GPL-V3
pragma solidity >=0.4.22 <0.9.0;
import './Challenge.sol';
import './ChessGame.sol';

contract Lobby {
  address public immutable arbiter;

  event CreatedChallenge(address challenge
                       , address indexed player1
                       , address indexed player2);
  event AcceptedChallenge(address indexed challenge
                        , address indexed player);
  event CanceledChallenge(address indexed challenge
                        , address indexed player);
  event GameStarted(address game
                  , address indexed whitePlayer
                  , address indexed blackPlayer);
  event GameFinished(address indexed game
                   , address indexed winner
                   , ChessGame.GameOutcome outcome);
  // We probably want to index the receiver as well
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

  constructor(address _arbiter) {
    arbiter = _arbiter;
  }

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

  function updateChallenge(address player, Challenge.State state)
  external isCurrentChallenge {
    address _challenge = msg.sender;
    if (state == Challenge.State.Accepted) {
      emit AcceptedChallenge(_challenge, player);
    } else if (state == Challenge.State.Canceled
            || state == Challenge.State.Declined) {
      delete challenges[_challenge];
      emit CanceledChallenge(_challenge, player);
    }
  }

  function startGame(address _game, address whitePlayer, address blackPlayer)
  external isCurrentChallenge {
    address _challenge = msg.sender;
    games[_game] = GameMetadata(ChessGame.State.Started
                            , _challenge
                            , true);
    challenges[_challenge] = ChallengeMetadata(Challenge(_challenge).state()
                                             , _game
                                             , true);
    emit GameStarted(_game, whitePlayer, blackPlayer);
  }

  function finishGame(ChessGame.GameOutcome outcome, address winner)
  external isCurrentGame {
    address _game = msg.sender;
    address _challenge = games[_game].challenge;
    // TODO Unlock funds from the challenge
    delete games[_game];
    delete challenges[_challenge];
    emit GameFinished(_game, winner, outcome);
  }

  function disputeGame(address player)
  external isCurrentGame {
    address _game = msg.sender;
    emit GameDisputed(_game, player);
  }
}
