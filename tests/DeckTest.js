/**
 * Unit tests for Deck model (T-402).
 * Covers creation count, shuffle, deal, draw, and empty state.
 */
'use strict';

const { describe, it, assert } = require('./test-runner');
const { GAME_CONSTANTS } = require('./test-helpers');

let Deck;
try {
  Deck = require('../src/game/Deck').Deck;
} catch (e) {
  console.log('  SKIP: Deck not yet available - ' + e.message);
  module.exports = { skipped: true };
  return;
}

const {
  TOTAL_CARDS, COPIES_PER_VALUE, HAND_SIZE_INITIAL, PLAYER_COUNT
} = GAME_CONSTANTS;

const DISCARD_PILE_INITIAL = 1;
const EXPECTED_AFTER_DEAL = TOTAL_CARDS
  - (HAND_SIZE_INITIAL * PLAYER_COUNT)
  - DISCARD_PILE_INITIAL;

/* --- Card Composition --- */

describe('Deck - Card Composition', () => {
  it('should contain exactly TOTAL_CARDS cards', () => {
    const deck = new Deck();
    assert.equal(deck.remaining(), TOTAL_CARDS);
  });

  it('should have COPIES_PER_VALUE of each card value', () => {
    const deck = new Deck();
    const counts = {};
    while (!deck.isEmpty()) {
      const card = deck.draw();
      const val = card.getValue();
      counts[val] = (counts[val] || 0) + 1;
    }
    for (const val of GAME_CONSTANTS.CARD_VALUES) {
      assert.equal(counts[val], COPIES_PER_VALUE,
        'Expected ' + COPIES_PER_VALUE + ' copies of ' + val + ', got ' + counts[val]);
    }
  });

  it('should have 7 distinct card values', () => {
    const deck = new Deck();
    const seen = new Set();
    while (!deck.isEmpty()) {
      seen.add(deck.draw().getValue());
    }
    assert.equal(seen.size, GAME_CONSTANTS.CARD_VALUES.length);
  });
});

/* --- Shuffle --- */

describe('Deck - Shuffle', () => {
  it('should maintain the same number of cards after shuffle', () => {
    const deck = new Deck();
    deck.shuffle();
    assert.equal(deck.remaining(), TOTAL_CARDS);
  });

  it('should produce a different order after shuffle (probabilistic)', () => {
    const deck1 = new Deck();
    const deck2 = new Deck();
    deck2.shuffle();
    const sampleSize = 10;
    let sameCount = 0;
    for (let i = 0; i < sampleSize; i++) {
      const c1 = deck1.draw();
      const c2 = deck2.draw();
      if (c1.getValue() === c2.getValue()) {
        sameCount++;
      }
    }
    assert.ok(sameCount < sampleSize,
      'Shuffled deck should differ from unshuffled');
  });

  it('should preserve all card values after shuffle', () => {
    const deck = new Deck();
    deck.shuffle();
    const counts = {};
    while (!deck.isEmpty()) {
      const val = deck.draw().getValue();
      counts[val] = (counts[val] || 0) + 1;
    }
    for (const val of GAME_CONSTANTS.CARD_VALUES) {
      assert.equal(counts[val], COPIES_PER_VALUE);
    }
  });
});

/* --- Deal --- */

describe('Deck - Deal', () => {
  it('should deal requested number of cards', () => {
    const deck = new Deck();
    deck.shuffle();
    const hand = deck.deal(HAND_SIZE_INITIAL);
    assert.equal(hand.length, HAND_SIZE_INITIAL);
  });

  it('should remove dealt cards from the deck', () => {
    const deck = new Deck();
    deck.shuffle();
    deck.deal(HAND_SIZE_INITIAL);
    assert.equal(deck.remaining(), TOTAL_CARDS - HAND_SIZE_INITIAL);
  });

  it('should return correct remaining after dealing to all players + discard', () => {
    const deck = new Deck();
    deck.shuffle();
    for (let i = 0; i < PLAYER_COUNT; i++) {
      deck.deal(HAND_SIZE_INITIAL);
    }
    deck.draw();
    assert.equal(deck.remaining(), EXPECTED_AFTER_DEAL);
  });

  it('should deal unique card objects (no shared references)', () => {
    const deck = new Deck();
    deck.shuffle();
    const allDealt = [];
    for (let i = 0; i < PLAYER_COUNT; i++) {
      const hand = deck.deal(HAND_SIZE_INITIAL);
      allDealt.push(...hand);
    }
    const uniqueRefs = new Set(allDealt);
    assert.equal(uniqueRefs.size, allDealt.length);
  });
});

/* --- Draw --- */

describe('Deck - Draw', () => {
  it('should return top card from draw pile', () => {
    const deck = new Deck();
    const card = deck.draw();
    assert.ok(card !== null && card !== undefined,
      'draw() should return a card');
  });

  it('should reduce draw pile size by one', () => {
    const deck = new Deck();
    const before = deck.remaining();
    deck.draw();
    assert.equal(deck.remaining(), before - 1);
  });

  it('should return null when draw pile is empty', () => {
    const deck = new Deck();
    while (!deck.isEmpty()) {
      deck.draw();
    }
    const result = deck.draw();
    assert.equal(result, null);
  });
});

/* --- isEmpty / remaining --- */

describe('Deck - Empty State', () => {
  it('should not be empty when first created', () => {
    const deck = new Deck();
    assert.notOk(deck.isEmpty());
  });

  it('should be empty after drawing all cards', () => {
    const deck = new Deck();
    for (let i = 0; i < TOTAL_CARDS; i++) {
      deck.draw();
    }
    assert.ok(deck.isEmpty());
  });

  it('should report remaining as zero when empty', () => {
    const deck = new Deck();
    for (let i = 0; i < TOTAL_CARDS; i++) {
      deck.draw();
    }
    assert.equal(deck.remaining(), 0);
  });
});

module.exports = {};
