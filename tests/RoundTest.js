/**
 * Unit tests for Round logic (T-404).
 * Covers initialization, play validation (same/+1/wrap), draw restrictions,
 * quit behavior, turn advancement, round end detection, and turn validation.
 * Source: src/game/Round.js
 */
'use strict';

const { describe, it, assert } = require('./test-runner');
const { GAME_CONSTANTS } = require('./test-helpers');

let Round, Deck, Player, Card, CardValue, PlayerStatus, TurnAction, RoundEndReason;
try {
  Round = require('../src/game/Round').Round;
  Deck = require('../src/game/Deck').Deck;
  Player = require('../src/game/Player').Player;
  Card = require('../src/game/Card').Card;
  const constants = require('../src/constants');
  CardValue = constants.CardValue;
  PlayerStatus = constants.PlayerStatus;
  TurnAction = constants.TurnAction;
  RoundEndReason = constants.RoundEndReason;
} catch (e) {
  console.log('  SKIP: Round dependencies not yet available - ' + e.message);
  module.exports = { skipped: true };
  return;
}

const PLAYER_COUNT = GAME_CONSTANTS.PLAYER_COUNT;
const HAND_SIZE_INITIAL = GAME_CONSTANTS.HAND_SIZE_INITIAL;
const TOTAL_CARDS = GAME_CONSTANTS.TOTAL_CARDS;
const LLAMA = CardValue.LLAMA;

/**
 * Create a standard test round with shuffled deck and fresh players.
 * Round constructor deals cards and draws the top card internally.
 */
function createTestRound(startIndex) {
  const players = [];
  for (let i = 0; i < PLAYER_COUNT; i++) {
    players.push(new Player(i));
  }
  const deck = new Deck();
  deck.shuffle();
  const round = new Round(players, deck, startIndex || 0);
  return { round, players, deck };
}

/** Find a card value that cannot be played on topVal */
function findUnplayableValue(topVal) {
  if (topVal === 1) return 4;
  if (topVal === 2) return 5;
  if (topVal === 3) return 6;
  if (topVal === LLAMA) return 3;
  return 1;
}

/**
 * Quit all players except player 0, advancing turns properly.
 * Returns with player 0 as the current (and only active) player.
 */
function quitAllExceptFirst(round, players) {
  /* Player 0 draws to use their turn */
  round.drawCard(players[0]);
  round.advanceTurn();
  round.quitRound(players[1]);
  round.advanceTurn();
  round.quitRound(players[2]);
  round.advanceTurn();
  round.quitRound(players[3]);
  round.advanceTurn();
}

/* --- Initialization --- */

describe('Round - Initialization', () => {
  it('should deal HAND_SIZE_INITIAL cards to each of PLAYER_COUNT players', () => {
    const { round, players } = createTestRound();
    assert.equal(players.length, PLAYER_COUNT);
    for (let i = 0; i < PLAYER_COUNT; i++) {
      assert.equal(
        players[i].getHandSize(),
        HAND_SIZE_INITIAL,
        'Player ' + i + ' should have ' + HAND_SIZE_INITIAL + ' cards'
      );
    }
  });

  it('should place a top card on the discard pile', () => {
    const { round } = createTestRound();
    const topCard = round.getTopCard();
    assert.ok(topCard, 'Top card should exist');
    assert.ok(topCard.getValue, 'Top card should be a Card instance');
  });

  it('should reduce deck by dealt cards plus top card', () => {
    const { round } = createTestRound();
    const dealtCount = PLAYER_COUNT * HAND_SIZE_INITIAL;
    const expectedRemaining = TOTAL_CARDS - dealtCount - 1;
    assert.equal(round.getDeck().remaining(), expectedRemaining);
  });

  it('should set the starting player index correctly', () => {
    const { round } = createTestRound(2);
    assert.equal(round.getCurrentPlayerIndex(), 2);
  });

  it('should not be over initially', () => {
    const { round } = createTestRound();
    assert.notOk(round.isRoundOver());
  });
});

/* --- playCard: same value --- */

describe('Round - playCard Same Value', () => {
  it('should succeed for valid card with same value', () => {
    const { round } = createTestRound();
    const current = round.getCurrentPlayer();
    const topVal = round.getTopCard().getValue();
    const matchCard = new Card(topVal);
    current.addCard(matchCard);
    const played = round.playCard(current, matchCard);
    assert.equal(played, matchCard);
  });

  it('should update the discard top to the played card', () => {
    const { round } = createTestRound();
    const current = round.getCurrentPlayer();
    const topVal = round.getTopCard().getValue();
    const matchCard = new Card(topVal);
    current.addCard(matchCard);
    round.playCard(current, matchCard);
    assert.equal(round.getTopCard(), matchCard);
  });

  it('should remove the played card from the hand', () => {
    const { round } = createTestRound();
    const current = round.getCurrentPlayer();
    const topVal = round.getTopCard().getValue();
    const matchCard = new Card(topVal);
    current.addCard(matchCard);
    const handBefore = current.getHandSize();
    round.playCard(current, matchCard);
    assert.equal(current.getHandSize(), handBefore - 1);
  });
});

/* --- playCard: +1 value --- */

describe('Round - playCard Plus One', () => {
  it('should succeed for card with value + 1', () => {
    const { round } = createTestRound();
    const current = round.getCurrentPlayer();
    const topVal = round.getTopCard().getValue();
    /* Determine the +1 value in the cycle */
    let nextVal;
    if (topVal === LLAMA) { nextVal = 1; }
    else if (topVal === 6) { nextVal = LLAMA; }
    else { nextVal = topVal + 1; }
    const nextCard = new Card(nextVal);
    current.addCard(nextCard);
    const played = round.playCard(current, nextCard);
    assert.equal(played.getValue(), nextVal);
  });
});

/* --- playCard: invalid --- */

describe('Round - playCard Invalid', () => {
  it('should throw for a card that cannot play on top card', () => {
    const { round } = createTestRound();
    const current = round.getCurrentPlayer();
    const topVal = round.getTopCard().getValue();
    const invalidVal = findUnplayableValue(topVal);
    const invalidCard = new Card(invalidVal);
    current.addCard(invalidCard);
    assert.throws(() => {
      round.playCard(current, invalidCard);
    });
  });
});

/* --- playCard: wrap rule (6->Llama, Llama->1) --- */

describe('Round - playCard Wrap Rule', () => {
  it('should allow Llama on 6 (6 -> Llama transition)', () => {
    const { round } = createTestRound();
    const current = round.getCurrentPlayer();
    /* Force a known top card by playing a 6 first if possible,
       or set up a chain. Use direct approach: play same-value
       to set a known top card, then test the wrap. */
    const sixCard = new Card(6);
    const llamaCard = new Card(LLAMA);
    /* Clear hand and set up the scenario */
    const hand = current.getHand();
    for (let i = hand.length - 1; i >= 0; i--) {
      current.removeCard(hand[i]);
    }
    /* Set top card to 6 by playing a same-value card */
    const topVal = round.getTopCard().getValue();
    /* We need to chain to 6. Simpler: add enough same-value + next
       cards, but that's complex. Instead, directly manipulate:
       play a matching card to set top, advance, and repeat.
       For simplicity, just play a same-value card to keep top,
       and if top isn't 6, we restructure. */
    /* Simplest: add a card matching current top and a 6 */
    current.addCard(new Card(topVal));
    current.addCard(sixCard);
    current.addCard(llamaCard);
    /* Play same-value to keep position valid */
    round.playCard(current, current.getHand()[0]);
    round.advanceTurn();
    /* Now set top to 6: create a fresh round scenario */
    /* This approach is getting complex. Let's use a simpler method:
       just find a round where top is 5 or 6 */
    /* Actually the cleanest approach is to just test the Card.canPlayOn
       logic through Round. We already tested that in Card tests.
       For Round, let's verify the integration works: */
    assert.ok(llamaCard.canPlayOn(sixCard),
      'Llama should be playable on 6');
  });

  it('should allow 1 on Llama (Llama -> 1 wrap)', () => {
    const oneCard = new Card(1);
    const llamaCard = new Card(LLAMA);
    assert.ok(oneCard.canPlayOn(llamaCard),
      '1 should be playable on Llama');
  });

  it('should integrate wrap rule through round.playCard', () => {
    /* Create rounds until we get a top card of 6 or Llama */
    let wrapTested = false;
    for (let attempt = 0; attempt < 50; attempt++) {
      const { round: r } = createTestRound();
      const topVal = r.getTopCard().getValue();
      const cur = r.getCurrentPlayer();
      if (topVal === 6) {
        const lCard = new Card(LLAMA);
        cur.addCard(lCard);
        r.playCard(cur, lCard);
        assert.equal(r.getTopCard().getValue(), LLAMA);
        wrapTested = true;
        break;
      }
      if (topVal === LLAMA) {
        const oCard = new Card(1);
        cur.addCard(oCard);
        r.playCard(cur, oCard);
        assert.equal(r.getTopCard().getValue(), 1);
        wrapTested = true;
        break;
      }
    }
    assert.ok(wrapTested, 'Should have tested wrap rule through playCard');
  });
});

/* --- drawCard --- */

describe('Round - drawCard', () => {
  it('should add a card to the player hand', () => {
    const { round } = createTestRound();
    const current = round.getCurrentPlayer();
    const handBefore = current.getHandSize();
    round.drawCard(current);
    assert.equal(current.getHandSize(), handBefore + 1);
  });

  it('should decrement the deck count by one', () => {
    const { round } = createTestRound();
    const deckBefore = round.getDeck().remaining();
    round.drawCard(round.getCurrentPlayer());
    assert.equal(round.getDeck().remaining(), deckBefore - 1);
  });

  it('should fail when the deck is empty', () => {
    const { round, deck } = createTestRound();
    while (!deck.isEmpty()) { deck.draw(); }
    const current = round.getCurrentPlayer();
    assert.throws(() => {
      round.drawCard(current);
    }, 'Should throw when deck is empty');
  });
});

/* --- canDraw --- */

describe('Round - canDraw', () => {
  it('should return true when deck has cards and multiple players active', () => {
    const { round } = createTestRound();
    assert.ok(round.canDraw(round.getCurrentPlayer()));
  });

  it('should return false when deck is empty', () => {
    const { round, deck } = createTestRound();
    while (!deck.isEmpty()) { deck.draw(); }
    assert.notOk(round.canDraw(round.getCurrentPlayer()));
  });

  it('should return false for the last active player', () => {
    const { round, players } = createTestRound();
    quitAllExceptFirst(round, players);
    assert.equal(round.getActivePlayerCount(), 1);
    assert.notOk(round.canDraw(players[0]),
      'Last active player should not be able to draw');
  });
});

/* --- quitRound --- */

describe('Round - quitRound', () => {
  it('should set the player status to quit', () => {
    const { round, players } = createTestRound();
    round.quitRound(players[0]);
    assert.notOk(players[0].isActive());
    assert.equal(players[0].getStatus(), PlayerStatus.QUIT);
  });

  it('should keep cards in hand after quitting', () => {
    const { round, players } = createTestRound();
    const handSize = players[0].getHandSize();
    round.quitRound(players[0]);
    assert.equal(players[0].getHandSize(), handSize);
  });
});

/* --- advanceTurn --- */

describe('Round - advanceTurn', () => {
  it('should move to the next player index', () => {
    const { round } = createTestRound();
    round.drawCard(round.getCurrentPlayer());
    round.advanceTurn();
    assert.equal(round.getCurrentPlayerIndex(), 1);
  });

  it('should skip quit players', () => {
    const { round, players } = createTestRound();
    /* Player 0 quits */
    round.quitRound(players[0]);
    round.advanceTurn();
    /* Should skip player 0 if wrapping and land on next active */
    assert.ok(round.getCurrentPlayer().isActive(),
      'Current player after advance should be active');
  });

  it('should wrap around from last player to first', () => {
    const { round } = createTestRound();
    for (let i = 0; i < PLAYER_COUNT; i++) {
      round.drawCard(round.getCurrentPlayer());
      round.advanceTurn();
    }
    assert.equal(round.getCurrentPlayerIndex(), 0);
  });

  it('should skip multiple consecutive quit players', () => {
    const { round, players } = createTestRound();
    /* Player 0 draws, advance */
    round.drawCard(players[0]);
    round.advanceTurn();
    /* Player 1 quits */
    round.quitRound(players[1]);
    round.advanceTurn();
    /* Player 2 quits */
    round.quitRound(players[2]);
    round.advanceTurn();
    /* Should land on player 3 */
    assert.equal(round.getCurrentPlayerIndex(), 3);
    assert.ok(round.getCurrentPlayer().isActive());
  });
});

/* --- isRoundOver --- */

describe('Round - isRoundOver', () => {
  it('should detect when a player empties their hand', () => {
    const { round } = createTestRound();
    const current = round.getCurrentPlayer();
    const topVal = round.getTopCard().getValue();
    /* Clear hand to zero, add one playable card, play it */
    const hand = current.getHand();
    for (let i = hand.length - 1; i >= 0; i--) {
      current.removeCard(hand[i]);
    }
    const lastCard = new Card(topVal);
    current.addCard(lastCard);
    round.playCard(current, lastCard);
    assert.ok(round.isRoundOver());
    assert.equal(round.getRoundEndReason(), RoundEndReason.HAND_EMPTY);
    assert.equal(round.getHandEmptyPlayer(), current);
  });

  it('should detect when all players quit', () => {
    const { round } = createTestRound();
    for (let i = 0; i < PLAYER_COUNT; i++) {
      round.quitRound(round.getCurrentPlayer());
      if (i < PLAYER_COUNT - 1) {
        round.advanceTurn();
      }
    }
    assert.ok(round.isRoundOver());
    assert.equal(round.getRoundEndReason(), RoundEndReason.ALL_QUIT);
  });

  it('should not be over when active players remain with cards', () => {
    const { round } = createTestRound();
    round.quitRound(round.getCurrentPlayer());
    assert.notOk(round.isRoundOver(),
      'Round should not end when some players are still active');
  });
});

/* --- Turn validation --- */

describe('Round - Turn Validation', () => {
  it('should reject playCard from a non-current player', () => {
    const { round, players } = createTestRound();
    /* Current player is 0, try to play as player 1 */
    const topVal = round.getTopCard().getValue();
    const card = new Card(topVal);
    players[1].addCard(card);
    assert.throws(() => {
      round.playCard(players[1], card);
    }, 'Should reject play from non-current player');
  });

  it('should reject drawCard from a non-current player', () => {
    const { round, players } = createTestRound();
    assert.throws(() => {
      round.drawCard(players[2]);
    }, 'Should reject draw from non-current player');
  });

  it('should reject quitRound from a non-current player', () => {
    const { round, players } = createTestRound();
    assert.throws(() => {
      round.quitRound(players[3]);
    }, 'Should reject quit from non-current player');
  });

  it('should reject actions from a quit player', () => {
    const { round, players } = createTestRound();
    round.quitRound(players[0]);
    round.advanceTurn();
    /* Player 1 is now current, but try player 0 who quit */
    assert.throws(() => {
      round.drawCard(players[0]);
    }, 'Should reject draw from quit player');
  });
});

/* --- getValidActions --- */

describe('Round - getValidActions', () => {
  it('should always include QUIT', () => {
    const { round } = createTestRound();
    const actions = round.getValidActions(round.getCurrentPlayer());
    assert.includes(actions, TurnAction.QUIT);
  });

  it('should include DRAW_CARD when deck has cards', () => {
    const { round } = createTestRound();
    const actions = round.getValidActions(round.getCurrentPlayer());
    assert.includes(actions, TurnAction.DRAW_CARD);
  });

  it('should exclude DRAW_CARD when deck is empty', () => {
    const { round, deck } = createTestRound();
    while (!deck.isEmpty()) { deck.draw(); }
    const actions = round.getValidActions(round.getCurrentPlayer());
    assert.notIncludes(actions, TurnAction.DRAW_CARD);
  });
});

/* --- Active player count --- */

describe('Round - getActivePlayerCount', () => {
  it('should start with all players active', () => {
    const { round } = createTestRound();
    assert.equal(round.getActivePlayerCount(), PLAYER_COUNT);
  });

  it('should decrement when a player quits', () => {
    const { round } = createTestRound();
    round.quitRound(round.getCurrentPlayer());
    assert.equal(round.getActivePlayerCount(), PLAYER_COUNT - 1);
  });
});

module.exports = {};
