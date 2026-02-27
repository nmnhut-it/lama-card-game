/**
 * Unit tests for Player model (T-403).
 * Covers hand management, quit status, playable card check,
 * penalty calculation with duplicate rule, and total points.
 */
'use strict';

const { describe, it, assert } = require('./test-runner');
const { GAME_CONSTANTS } = require('./test-helpers');

let Player, Card, CardValue;
try {
  Player = require('../src/game/Player').Player;
  Card = require('../src/game/Card').Card;
  const constants = require('../src/constants');
  CardValue = constants.CardValue;
} catch (e) {
  console.log('  SKIP: Player/Card/constants not yet available - ' + e.message);
  module.exports = { skipped: true };
  return;
}

const {
  WHITE_TOKEN_VALUE, BLACK_TOKEN_VALUE, LLAMA_PENALTY
} = GAME_CONSTANTS;
const LLAMA = CardValue ? CardValue.LLAMA : 'Llama';

function card(val) {
  return new Card(val);
}

/* --- Hand Management --- */

describe('Player - Hand Management', () => {
  it('should start with an empty hand', () => {
    const player = new Player(0);
    assert.equal(player.getHandSize(), 0);
  });

  it('should add a card to hand via addCard', () => {
    const player = new Player(0);
    player.addCard(card(3));
    assert.equal(player.getHandSize(), 1);
  });

  it('should remove a card from hand via removeCard', () => {
    const player = new Player(0);
    const c = card(5);
    player.addCard(c);
    player.removeCard(c);
    assert.equal(player.getHandSize(), 0);
  });

  it('should handle adding multiple cards', () => {
    const player = new Player(0);
    player.addCard(card(1));
    player.addCard(card(2));
    player.addCard(card(3));
    assert.equal(player.getHandSize(), 3);
  });
});

/* --- hasPlayableCard --- */

describe('Player - hasPlayableCard', () => {
  it('should return true when hand contains a playable card', () => {
    const player = new Player(0);
    player.addCard(card(3));
    player.addCard(card(5));
    const topCard = card(4);
    assert.ok(player.hasPlayableCard(topCard));
  });

  it('should return false when no card is playable', () => {
    const player = new Player(0);
    player.addCard(card(1));
    player.addCard(card(2));
    const topCard = card(5);
    assert.notOk(player.hasPlayableCard(topCard));
  });

  it('should detect Llama playable on 6', () => {
    const player = new Player(0);
    player.addCard(card(LLAMA));
    const topCard = card(6);
    assert.ok(player.hasPlayableCard(topCard));
  });

  it('should detect 1 playable on Llama (wrap)', () => {
    const player = new Player(0);
    player.addCard(card(1));
    const topCard = card(LLAMA);
    assert.ok(player.hasPlayableCard(topCard));
  });

  it('should return false for empty hand', () => {
    const player = new Player(0);
    const topCard = card(3);
    assert.notOk(player.hasPlayableCard(topCard));
  });
});

/* --- Quit Status --- */

describe('Player - Quit Status', () => {
  it('should be active initially', () => {
    const player = new Player(0);
    assert.ok(player.isActive());
  });

  it('should be inactive after quitting', () => {
    const player = new Player(0);
    player.quit();
    assert.notOk(player.isActive());
  });

  it('should retain hand after quitting', () => {
    const player = new Player(0);
    player.addCard(card(2));
    player.addCard(card(4));
    player.quit();
    assert.equal(player.getHandSize(), 2);
  });
});

/* --- getHandPenalty: no duplicates --- */

describe('Player - getHandPenalty (No Duplicates)', () => {
  it('should sum face values of unique cards', () => {
    const player = new Player(0);
    player.addCard(card(1));
    player.addCard(card(3));
    player.addCard(card(5));
    assert.equal(player.getHandPenalty(), 9);
  });

  it('should return zero for empty hand', () => {
    const player = new Player(0);
    assert.equal(player.getHandPenalty(), 0);
  });
});

/* --- getHandPenalty: duplicate rule --- */

describe('Player - getHandPenalty (Duplicate Rule)', () => {
  it('should count duplicate values only once', () => {
    const player = new Player(0);
    player.addCard(card(5));
    player.addCard(card(5));
    player.addCard(card(5));
    assert.equal(player.getHandPenalty(), 5);
  });

  it('should count duplicate Llamas only once', () => {
    const player = new Player(0);
    player.addCard(card(LLAMA));
    player.addCard(card(LLAMA));
    assert.equal(player.getHandPenalty(), LLAMA_PENALTY);
  });

  it('should sum unique values from mixed hand with duplicates', () => {
    const player = new Player(0);
    player.addCard(card(3));
    player.addCard(card(3));
    player.addCard(card(6));
    player.addCard(card(LLAMA));
    assert.equal(player.getHandPenalty(), 3 + 6 + LLAMA_PENALTY);
  });

  it('should handle all same value', () => {
    const player = new Player(0);
    player.addCard(card(4));
    player.addCard(card(4));
    player.addCard(card(4));
    player.addCard(card(4));
    assert.equal(player.getHandPenalty(), 4);
  });

  it('should score worst case hand (all values + Llama)', () => {
    const player = new Player(0);
    for (let v = 1; v <= 6; v++) {
      player.addCard(card(v));
    }
    player.addCard(card(LLAMA));
    const expected = 1 + 2 + 3 + 4 + 5 + 6 + LLAMA_PENALTY;
    assert.equal(player.getHandPenalty(), expected);
  });
});

/* --- totalPoints --- */

describe('Player - totalPoints', () => {
  it('should return zero for player with no tokens', () => {
    const player = new Player(0);
    assert.equal(player.totalPoints(), 0);
  });

  it('should calculate total from white tokens', () => {
    const player = new Player(0);
    player.addWhiteTokens(7);
    assert.equal(player.totalPoints(), 7 * WHITE_TOKEN_VALUE);
  });

  it('should calculate total from black tokens', () => {
    const player = new Player(0);
    player.addBlackTokens(3);
    assert.equal(player.totalPoints(), 3 * BLACK_TOKEN_VALUE);
  });

  it('should sum mixed token values correctly', () => {
    const player = new Player(0);
    player.addWhiteTokens(5);
    player.addBlackTokens(2);
    const expected = (5 * WHITE_TOKEN_VALUE) + (2 * BLACK_TOKEN_VALUE);
    assert.equal(player.totalPoints(), expected);
  });
});

module.exports = {};
