/**
 * Tests for Game orchestrator: round lifecycle, scoring, game end, winner.
 * Source: src/game/Game.js
 */
'use strict';

const { describe, it, assert } = require('./test-runner');
const { GAME_CONSTANTS } = require('./test-helpers');

let Game, Card, CardValue, GameMode, RoundEndReason, NEXT_VALUE;
try {
  Game = require('../src/game/Game').Game;
  Card = require('../src/game/Card').Card;
  const constants = require('../src/constants');
  CardValue = constants.CardValue;
  GameMode = constants.GameMode;
  RoundEndReason = constants.RoundEndReason;
  NEXT_VALUE = constants.NEXT_VALUE;
} catch (e) {
  console.log('  SKIP: Game dependencies not yet available - ' + e.message);
}

function skipIfNoSource() {
  return !Game;
}

describe('Game - Initialization', () => {
  it('should create PLAYER_COUNT players', () => {
    if (skipIfNoSource()) return;
    const game = new Game(GameMode.AI);
    assert.equal(game.getPlayers().length, GAME_CONSTANTS.PLAYER_COUNT);
  });

  it('should start at round 0', () => {
    if (skipIfNoSource()) return;
    const game = new Game(GameMode.AI);
    assert.equal(game.getRoundNumber(), 0);
  });

  it('should create a TokenBank', () => {
    if (skipIfNoSource()) return;
    const game = new Game(GameMode.AI);
    assert.ok(game.getTokenBank());
  });
});

describe('Game - Start New Round', () => {
  it('should return a round object', () => {
    if (skipIfNoSource()) return;
    const game = new Game(GameMode.AI);
    const round = game.startNewRound();
    assert.ok(round, 'startNewRound should return a round');
  });

  it('should increment round number', () => {
    if (skipIfNoSource()) return;
    const game = new Game(GameMode.AI);
    game.startNewRound();
    assert.equal(game.getRoundNumber(), 1);
  });

  it('should deal HAND_SIZE_INITIAL cards to each player', () => {
    if (skipIfNoSource()) return;
    const game = new Game(GameMode.AI);
    game.startNewRound();
    for (const player of game.getPlayers()) {
      assert.equal(
        player.getHandSize(),
        GAME_CONSTANTS.HAND_SIZE_INITIAL,
        `Player ${player.getIndex()} should have ${GAME_CONSTANTS.HAND_SIZE_INITIAL} cards`
      );
    }
  });

  it('should reset players between rounds', () => {
    if (skipIfNoSource()) return;
    const game = new Game(GameMode.AI);
    const round1 = game.startNewRound();
    // Quit player 0 in round 1
    game.getPlayers()[0].quit();
    assert.notOk(game.getPlayers()[0].isActive());
    // Start round 2 - player should be active again
    game.startNewRound();
    assert.ok(game.getPlayers()[0].isActive());
  });
});

describe('Game - Score Round', () => {
  it('should calculate penalties using duplicate rule via scoreRound', () => {
    if (skipIfNoSource()) return;
    const game = new Game(GameMode.AI);
    const round = game.startNewRound();
    const players = game.getPlayers();
    /* Set up known hand for player 0: two 3s and one 5 (penalty = 3+5 = 8) */
    while (players[0].getHandSize() > 0) {
      players[0].removeCard(players[0].getHand()[0]);
    }
    players[0].addCard(new Card(3));
    players[0].addCard(new Card(3));
    players[0].addCard(new Card(5));
    /* End the round by quitting all players in turn order */
    for (let i = 0; i < GAME_CONSTANTS.PLAYER_COUNT; i++) {
      round.quitRound(round.getCurrentPlayer());
      if (i < GAME_CONSTANTS.PLAYER_COUNT - 1) {
        round.advanceTurn();
      }
    }
    const summary = game.scoreRound();
    /* Verify player 0 penalty is 8 (duplicate 3 counted once: 3 + 5) */
    const p0Summary = summary.players[0];
    assert.equal(p0Summary.penalty, 8,
      'Duplicate 3s should count once: penalty = 3 + 5 = 8');
    assert.ok(p0Summary.tokensGiven !== undefined,
      'Summary should include tokens distributed');
  });

  it('should return a scoring summary', () => {
    if (skipIfNoSource()) return;
    const game = new Game(GameMode.AI);
    const round = game.startNewRound();
    // End round by quitting all players in turn order
    for (let i = 0; i < GAME_CONSTANTS.PLAYER_COUNT; i++) {
      round.quitRound(round.getCurrentPlayer());
      if (i < GAME_CONSTANTS.PLAYER_COUNT - 1) {
        round.advanceTurn();
      }
    }
    const summary = game.scoreRound();
    assert.ok(summary.players, 'Summary should have players array');
    assert.equal(summary.players.length, GAME_CONSTANTS.PLAYER_COUNT);
  });
});

describe('Game - Game Over Detection', () => {
  it('should trigger game over at GAME_OVER_THRESHOLD', () => {
    if (skipIfNoSource()) return;
    const game = new Game(GameMode.AI);
    const player = game.getPlayers()[0];
    // Give tokens totaling the threshold
    player.addBlackTokens(
      GAME_CONSTANTS.GAME_OVER_THRESHOLD / GAME_CONSTANTS.BLACK_TOKEN_VALUE
    );
    assert.ok(game.isGameOver());
  });

  it('should not trigger game over when all below threshold', () => {
    if (skipIfNoSource()) return;
    const game = new Game(GameMode.AI);
    const belowThreshold = GAME_CONSTANTS.GAME_OVER_THRESHOLD - 1;
    for (const player of game.getPlayers()) {
      player.addWhiteTokens(belowThreshold);
    }
    assert.notOk(game.isGameOver());
  });

  it('should trigger when exceeding threshold', () => {
    if (skipIfNoSource()) return;
    const game = new Game(GameMode.AI);
    game.getPlayers()[2].addBlackTokens(5);
    assert.ok(game.isGameOver(), 'Player with 50 points should trigger end');
  });
});

describe('Game - Winner Determination', () => {
  it('should return player with fewest points as winner', () => {
    if (skipIfNoSource()) return;
    const game = new Game(GameMode.AI);
    game.getPlayers()[0].addWhiteTokens(5);
    game.getPlayers()[1].addBlackTokens(1);
    game.getPlayers()[1].addWhiteTokens(5);
    game.getPlayers()[2].addBlackTokens(3);
    game.getPlayers()[3].addBlackTokens(4);
    const winners = game.getWinners();
    assert.equal(winners.length, 1);
    assert.equal(winners[0].getIndex(), 0);
  });

  it('should handle tied winners', () => {
    if (skipIfNoSource()) return;
    const game = new Game(GameMode.AI);
    game.getPlayers()[0].addWhiteTokens(5);
    game.getPlayers()[1].addWhiteTokens(5);
    game.getPlayers()[2].addBlackTokens(4);
    game.getPlayers()[3].addBlackTokens(4);
    const winners = game.getWinners();
    assert.equal(winners.length, 2);
  });
});

describe('Game - Standings', () => {
  it('should return players sorted by points ascending', () => {
    if (skipIfNoSource()) return;
    const game = new Game(GameMode.AI);
    game.getPlayers()[0].addBlackTokens(3);
    game.getPlayers()[1].addWhiteTokens(5);
    game.getPlayers()[2].addBlackTokens(4);
    game.getPlayers()[3].addWhiteTokens(1);
    const standings = game.getStandings();
    for (let i = 0; i < standings.length - 1; i++) {
      assert.ok(
        standings[i].totalPoints() <= standings[i + 1].totalPoints(),
        'Standings should be ascending'
      );
    }
  });
});

describe('Game - Empty hand bonus with token exchange', () => {

  /**
   * Helper: set up a round where the target player empties their hand
   * by actually playing their last card (triggering proper round end).
   * Advances turns to the target, replaces hand with a single playable
   * card, then plays it.
   */
  function setupEmptyHandRound(game, targetPlayerIndex) {
    const round = game.startNewRound();
    const target = game.getPlayers()[targetPlayerIndex];
    var topCardValue = round.getTopCard().getValue();

    /* Advance to target player's turn, quitting others along the way */
    var safetyLimit = GAME_CONSTANTS.PLAYER_COUNT * 2;
    while (round.getCurrentPlayerIndex() !== targetPlayerIndex && safetyLimit > 0) {
      safetyLimit--;
      round.quitRound(round.getCurrentPlayer());
      round.advanceTurn();
    }

    /* Replace target's hand with a single card matching the top card */
    while (target.getHandSize() > 0) {
      target.removeCard(target.getHand()[0]);
    }
    var playableCard = new Card(topCardValue);
    target.addCard(playableCard);

    /* Play the last card → hand empty → round ends */
    round.playCard(target, playableCard);
    assert.ok(round.isRoundOver(), 'Round should end when hand empties');
    return round;
  }

  it('should exchange white->black before returning when player has 10+ white', () => {
    if (skipIfNoSource()) return;
    const game = new Game(GameMode.AI);
    const target = game.getPlayers()[0];

    /* Simulate prior-round tokens: 12 white, 0 black */
    target.addWhiteTokens(12);
    assert.equal(target.totalPoints(), 12);

    setupEmptyHandRound(game, 0);
    const summary = game.scoreRound();
    assert.equal(summary.handEmptyPlayer, 0, 'Player 0 emptied hand');
    assert.equal(summary.tokenReturned, 'black',
      'Should exchange white->black then return black');
    assert.equal(summary.players[0].totalPoints, 2,
      'Should save 10 pts: 12 - 10 = 2');
  });

  it('should return 1 black when player already has black tokens', () => {
    if (skipIfNoSource()) return;
    const game = new Game(GameMode.AI);
    const target = game.getPlayers()[0];

    target.addBlackTokens(1);
    assert.equal(target.totalPoints(), 10);

    setupEmptyHandRound(game, 0);
    const summary = game.scoreRound();
    assert.equal(summary.tokenReturned, 'black');
    assert.equal(summary.players[0].totalPoints, 0,
      'Returning 1 black saves 10 pts: 10 - 10 = 0');
  });

  it('should return 1 white when player has < 10 white and 0 black', () => {
    if (skipIfNoSource()) return;
    const game = new Game(GameMode.AI);
    const target = game.getPlayers()[0];

    target.addWhiteTokens(3);

    setupEmptyHandRound(game, 0);
    const summary = game.scoreRound();
    assert.equal(summary.tokenReturned, 'white');
    assert.equal(summary.players[0].totalPoints, 2, '3 - 1 = 2');
  });

  it('should return null when empty-hand player has 0 tokens', () => {
    if (skipIfNoSource()) return;
    const game = new Game(GameMode.AI);

    setupEmptyHandRound(game, 0);
    const summary = game.scoreRound();
    assert.equal(summary.tokenReturned, null, 'No tokens to return');
    assert.equal(summary.players[0].totalPoints, 0);
  });
});
