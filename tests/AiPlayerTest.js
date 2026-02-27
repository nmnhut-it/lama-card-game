/**
 * Tests for AI player logic: valid decisions, no cheating, edge cases.
 * Source: src/ai/AiPlayer.js
 */
'use strict';

const { describe, it, assert } = require('./test-runner');
const { GAME_CONSTANTS } = require('./test-helpers');

let AiPlayer, Round, Deck, Player, Card, TurnAction, CardValue;
try {
  AiPlayer = require('../src/ai/AiPlayer').AiPlayer;
  Round = require('../src/game/Round').Round;
  Deck = require('../src/game/Deck').Deck;
  Player = require('../src/game/Player').Player;
  Card = require('../src/game/Card').Card;
  const constants = require('../src/constants');
  TurnAction = constants.TurnAction;
  CardValue = constants.CardValue;
} catch (e) {
  console.log('  SKIP: AiPlayer dependencies not yet available - ' + e.message);
}

function skipIfNoSource() {
  return !AiPlayer || !Round || !Deck || !Player || !Card;
}

/** Create a standard test round */
function createTestRound() {
  const deck = new Deck();
  deck.shuffle();
  const players = [];
  for (let i = 0; i < GAME_CONSTANTS.PLAYER_COUNT; i++) {
    players.push(new Player(i));
  }
  return new Round(players, deck, 0);
}

describe('AI Player - Valid Action Types', () => {
  it('should return a recognized action type', () => {
    if (skipIfNoSource()) return;
    const round = createTestRound();
    const player = round.getCurrentPlayer();
    const result = AiPlayer.decideAction(player, round);
    const validActions = Object.values(TurnAction);
    assert.ok(
      validActions.includes(result.action),
      `Action ${result.action} should be one of ${validActions.join(', ')}`
    );
  });
});

describe('AI Player - Play Validation', () => {
  it('should only play cards that can play on the top card', () => {
    if (skipIfNoSource()) return;
    const round = createTestRound();
    const player = round.getCurrentPlayer();
    const result = AiPlayer.decideAction(player, round);
    if (result.action === TurnAction.PLAY_CARD) {
      assert.ok(
        result.card.canPlayOn(round.getTopCard()),
        `AI played ${result.card.getValue()} on ${round.getTopCard().getValue()} which is invalid`
      );
    }
  });

  it('should only play cards that are in its hand', () => {
    if (skipIfNoSource()) return;
    const round = createTestRound();
    const player = round.getCurrentPlayer();
    const handValues = player.getHand().map(c => c.getValue());
    const result = AiPlayer.decideAction(player, round);
    if (result.action === TurnAction.PLAY_CARD) {
      assert.ok(
        handValues.includes(result.card.getValue()),
        `AI played ${result.card.getValue()} which is not in hand [${handValues}]`
      );
    }
  });

  it('should prefer high-penalty cards when multiple are playable', () => {
    if (skipIfNoSource()) return;
    /* Run multiple rounds, track cases where AI had a choice */
    let highPlayed = 0;
    let choiceCount = 0;
    const iterations = 50;
    for (let t = 0; t < iterations; t++) {
      const round = createTestRound();
      const player = round.getCurrentPlayer();
      const result = AiPlayer.decideAction(player, round);
      if (result.action === TurnAction.PLAY_CARD) {
        const playable = player.getPlayableCards(round.getTopCard());
        if (playable.length > 1) {
          choiceCount++;
          const maxPenalty = Math.max(...playable.map(c => c.getPenaltyValue()));
          if (result.card.getPenaltyValue() === maxPenalty) {
            highPlayed++;
          }
        }
      }
    }
    /* AI deterministically picks highest penalty; every choice should match */
    if (choiceCount > 0) {
      assert.equal(highPlayed, choiceCount,
        'AI should always pick the highest penalty card when choosing (' +
        highPlayed + '/' + choiceCount + ')');
    }
  });
});

describe('AI Player - Draw Restrictions', () => {
  it('should not draw when draw pile is empty', () => {
    if (skipIfNoSource()) return;
    const round = createTestRound();
    // Empty the draw pile
    const deck = round.getDeck();
    while (!deck.isEmpty()) { deck.draw(); }
    const player = round.getCurrentPlayer();
    const result = AiPlayer.decideAction(player, round);
    assert.ok(
      result.action !== TurnAction.DRAW_CARD,
      'AI should not draw from empty pile'
    );
  });

  it('should not draw when last active player', () => {
    if (skipIfNoSource()) return;
    const round = createTestRound();
    // Quit players 0-2 in turn order, leaving player 3 as last active
    for (let i = 0; i < GAME_CONSTANTS.PLAYER_COUNT - 1; i++) {
      round.quitRound(round.getCurrentPlayer());
      round.advanceTurn();
    }
    const lastActive = round.getCurrentPlayer();
    const result = AiPlayer.decideAction(lastActive, round);
    assert.ok(
      result.action !== TurnAction.DRAW_CARD,
      'AI (last active) should not draw'
    );
  });
});

describe('AI Player - Edge Cases', () => {
  it('should choose draw or quit when no playable cards', () => {
    if (skipIfNoSource()) return;
    // Give player only 1s, top is 4 -> no valid play
    const deck = new Deck();
    deck.shuffle();
    const players = [];
    for (let i = 0; i < GAME_CONSTANTS.PLAYER_COUNT; i++) {
      players.push(new Player(i));
    }
    const round = new Round(players, deck, 0);
    const player = round.getCurrentPlayer();
    // Clear hand and add only non-playable cards
    while (player.getHandSize() > 0) {
      player.removeCard(player.getHand()[0]);
    }
    // If top card is X, add cards that cannot play on X
    const topVal = round.getTopCard().getValue();
    // Find a value that is neither same nor +1
    let badVal = 1;
    if (topVal === 1 || topVal === CardValue.LLAMA) badVal = 4;
    player.addCard(new Card(badVal));
    player.addCard(new Card(badVal));

    // Only if no card is playable
    if (!player.hasPlayableCard(round.getTopCard())) {
      const result = AiPlayer.decideAction(player, round);
      assert.ok(
        result.action === TurnAction.DRAW_CARD || result.action === TurnAction.QUIT,
        'With no playable cards, AI must draw or quit'
      );
    }
  });

  it('should quit when no play possible, empty pile, and last player', () => {
    if (skipIfNoSource()) return;
    const deck = new Deck();
    deck.shuffle();
    const players = [];
    for (let i = 0; i < GAME_CONSTANTS.PLAYER_COUNT; i++) {
      players.push(new Player(i));
    }
    const round = new Round(players, deck, 0);
    // Empty the deck
    const d = round.getDeck();
    while (!d.isEmpty()) { d.draw(); }
    // Quit players 0-2 in turn order, leaving player 3 as last active
    for (let i = 0; i < GAME_CONSTANTS.PLAYER_COUNT - 1; i++) {
      round.quitRound(round.getCurrentPlayer());
      round.advanceTurn();
    }
    const player = round.getCurrentPlayer();
    // Clear hand and add non-playable card
    while (player.getHandSize() > 0) {
      player.removeCard(player.getHand()[0]);
    }
    const topVal = round.getTopCard().getValue();
    let badVal = 1;
    if (topVal === 1 || topVal === CardValue.LLAMA) badVal = 4;
    player.addCard(new Card(badVal));

    if (!player.hasPlayableCard(round.getTopCard())) {
      const result = AiPlayer.decideAction(player, round);
      assert.equal(
        result.action,
        TurnAction.QUIT,
        'Last player, no play, empty pile: must quit'
      );
    }
  });

  it('should never return an invalid action', () => {
    if (skipIfNoSource()) return;
    // Run many iterations to check AI never cheats
    const validActions = Object.values(TurnAction);
    const iterations = 30;
    for (let t = 0; t < iterations; t++) {
      const round = createTestRound();
      const player = round.getCurrentPlayer();
      const result = AiPlayer.decideAction(player, round);
      assert.ok(
        validActions.includes(result.action),
        `Iteration ${t}: Invalid action ${result.action}`
      );
      if (result.action === TurnAction.PLAY_CARD) {
        assert.ok(result.card, 'PLAY_CARD must include a card');
        assert.ok(
          result.card.canPlayOn(round.getTopCard()),
          `Iteration ${t}: AI played invalid card`
        );
      }
    }
  });
});
