/**
 * Unit tests for Card model (T-401).
 * Covers construction, canPlayOn validation (including wrap rule), and penalty values.
 */
'use strict';

const { describe, it, assert } = require('./test-runner');
const { GAME_CONSTANTS, VALID_PLAY_MAP } = require('./test-helpers');

let Card, CardValue;
try {
  Card = require('../src/game/Card').Card;
  const constants = require('../src/constants');
  CardValue = constants.CardValue;
} catch (e) {
  console.log('  SKIP: Card or constants not yet available - ' + e.message);
  module.exports = { skipped: true };
  return;
}

const ALL_CARD_VALUES = GAME_CONSTANTS.CARD_VALUES;
const LLAMA_PENALTY = GAME_CONSTANTS.LLAMA_PENALTY;
const LLAMA = CardValue ? CardValue.LLAMA : 'Llama';

/* --- Construction --- */

describe('Card - Construction', () => {
  it('should create a card for each numeric value (1-6)', () => {
    for (let val = 1; val <= 6; val++) {
      const card = new Card(val);
      assert.equal(card.getValue(), val);
    }
  });

  it('should create a Llama card', () => {
    const card = new Card(LLAMA);
    assert.equal(card.getValue(), LLAMA);
  });

  it('should be immutable after construction', () => {
    const card = new Card(3);
    const valueBefore = card.getValue();
    try { card.value = 99; } catch (_e) { /* frozen or setter blocked */ }
    assert.equal(card.getValue(), valueBefore);
  });
});

/* --- canPlayOn: same value --- */

describe('Card - canPlayOn Same Value', () => {
  it('should allow playing same number on matching number', () => {
    for (let val = 1; val <= 6; val++) {
      const top = new Card(val);
      const play = new Card(val);
      assert.ok(play.canPlayOn(top),
        'Card ' + val + ' should be playable on ' + val);
    }
  });

  it('should allow playing Llama on Llama', () => {
    const top = new Card(LLAMA);
    const play = new Card(LLAMA);
    assert.ok(play.canPlayOn(top));
  });
});

/* --- canPlayOn: plus one --- */

describe('Card - canPlayOn Plus One', () => {
  it('should allow playing value + 1 on current value', () => {
    for (let val = 1; val <= 5; val++) {
      const top = new Card(val);
      const play = new Card(val + 1);
      assert.ok(play.canPlayOn(top),
        'Card ' + (val + 1) + ' should be playable on ' + val);
    }
  });
});

/* --- canPlayOn: wrap rule --- */

describe('Card - canPlayOn Wrap Rule', () => {
  it('should allow Llama on 6 (6 -> Llama transition)', () => {
    const top = new Card(6);
    const play = new Card(LLAMA);
    assert.ok(play.canPlayOn(top));
  });

  it('should allow 1 on Llama (Llama -> 1 wrap-around)', () => {
    const top = new Card(LLAMA);
    const play = new Card(1);
    assert.ok(play.canPlayOn(top));
  });

  it('should form complete cycle: 1->2->3->4->5->6->Llama->1', () => {
    const cycle = [1, 2, 3, 4, 5, 6, LLAMA, 1];
    for (let i = 0; i < cycle.length - 1; i++) {
      const top = new Card(cycle[i]);
      const play = new Card(cycle[i + 1]);
      assert.ok(play.canPlayOn(top),
        cycle[i + 1] + ' should be playable on ' + cycle[i]);
    }
  });
});

/* --- canPlayOn: invalid plays --- */

describe('Card - canPlayOn Invalid Plays', () => {
  it('should reject playing value + 2 or higher', () => {
    const top = new Card(1);
    const play = new Card(3);
    assert.notOk(play.canPlayOn(top),
      'Card 3 should NOT be playable on 1');
  });

  it('should reject playing lower value (non-wrap)', () => {
    const top = new Card(4);
    const play = new Card(2);
    assert.notOk(play.canPlayOn(top),
      'Card 2 should NOT be playable on 4');
  });

  it('should reject Llama on values other than 6 or Llama', () => {
    for (let val = 1; val <= 5; val++) {
      const top = new Card(val);
      const play = new Card(LLAMA);
      assert.notOk(play.canPlayOn(top),
        'Llama should NOT be playable on ' + val);
    }
  });

  it('should reject number cards (2-6) on Llama', () => {
    const top = new Card(LLAMA);
    for (let val = 2; val <= 6; val++) {
      const play = new Card(val);
      assert.notOk(play.canPlayOn(top),
        'Card ' + val + ' should NOT be playable on Llama');
    }
  });

  it('should match VALID_PLAY_MAP for all card values', () => {
    for (const topStr of Object.keys(VALID_PLAY_MAP)) {
      const topVal = topStr === 'Llama' ? LLAMA : Number(topStr);
      const validPlays = VALID_PLAY_MAP[topStr];
      for (const cardVal of ALL_CARD_VALUES) {
        const resolvedCard = cardVal === 'Llama' ? LLAMA : cardVal;
        const top = new Card(topVal);
        const play = new Card(resolvedCard);
        const shouldBeValid = validPlays.includes(cardVal);
        assert.equal(play.canPlayOn(top), shouldBeValid,
          'canPlayOn(' + cardVal + ', ' + topStr + ') expected ' + shouldBeValid);
      }
    }
  });
});

/* --- getPenaltyValue --- */

describe('Card - getPenaltyValue', () => {
  it('should return face value for number cards (1-6)', () => {
    for (let val = 1; val <= 6; val++) {
      const card = new Card(val);
      assert.equal(card.getPenaltyValue(), val);
    }
  });

  it('should return LLAMA_PENALTY for Llama card', () => {
    const card = new Card(LLAMA);
    assert.equal(card.getPenaltyValue(), LLAMA_PENALTY);
  });
});

module.exports = {};
