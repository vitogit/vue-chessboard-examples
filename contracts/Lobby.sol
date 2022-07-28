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

  function challenge(
    address _player2,
    bool _startAsWhite,
    uint _wagerAmount,
    uint _timePerMove
  ) external payable {
    require(msg.value >= _wagerAmount, 'InvalidDepositAmount');
    require(_timePerMove >= 60, 'InvalidTimePerMove');
    Challenge _challenge = (new Challenge){ value: msg.value }(
                                            payable(msg.sender)
                                          , payable(_player2)
                                          , _startAsWhite
                                          , _wagerAmount
                                          , _timePerMove);
    challenges[address(_challenge)] = ChallengeMetadata(Challenge.State.Pending
                                                      , address(0)
                                                      , true);
    emit CreatedChallenge(address(_challenge), msg.sender, _player2);
  }

  function updateChallenge(address _player, Challenge.State _state)
  external isCurrentChallenge {
    address _challenge = msg.sender;
    if (_state == Challenge.State.Accepted) {
      emit AcceptedChallenge(_challenge, _player);
    } else if (_state == Challenge.State.Canceled
            || _state == Challenge.State.Declined) {
      delete challenges[_challenge];
      emit CanceledChallenge(_challenge, _player);
    }
  }

  function startGame(address _game, address _whitePlayer, address _blackPlayer)
  external isCurrentChallenge {
    address _challenge = msg.sender;
    games[_game] = GameMetadata(ChessGame.State.Started
                            , _challenge
                            , true);
    challenges[_challenge] = ChallengeMetadata(Challenge(_challenge).state()
                                             , _game
                                             , true);
    emit GameStarted(_game, _whitePlayer, _blackPlayer);
  }

  function finishGame(ChessGame.GameOutcome _outcome, address _winner)
  external isCurrentGame {
    address _game = msg.sender;
    address _challenge = games[_game].challenge;
    delete games[_game];
    delete challenges[_challenge];
    emit GameFinished(_game, _winner, _outcome);
  }

  function disputeGame(address _player)
  external isCurrentGame {
    address _game = msg.sender;
    emit GameDisputed(_game, _player);
  }
}
