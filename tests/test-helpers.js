/**
 * Shared test constants and helper utilities for L.A.M.A. tests.
 * All values derived from the Game Design Document.
 */
'use strict';

/** Game constants matching GDD spec */
const GAME_CONSTANTS = Object.freeze({
  CARD_VALUES: [1, 2, 3, 4, 5, 6, 'Llama'],
  COPIES_PER_VALUE: 8,
  TOTAL_CARDS: 56,
  PLAYER_COUNT: 4,
  HAND_SIZE_INITIAL: 6,
  WHITE_TOKEN_VALUE: 1,
  BLACK_TOKEN_VALUE: 10,
  WHITE_TOKEN_COUNT: 50,
  BLACK_TOKEN_COUNT: 20,
  TOTAL_TOKENS: 70,
  GAME_OVER_THRESHOLD: 40,
  LLAMA_PENALTY: 10,
  NUMBER_CARD_COUNT: 48,
  LLAMA_CARD_COUNT: 8
});

/** Valid play transitions: top card -> playable card values */
const VALID_PLAY_MAP = Object.freeze({
  1: [1, 2],
  2: [2, 3],
  3: [3, 4],
  4: [4, 5],
  5: [5, 6],
  6: [6, 'Llama'],
  'Llama': ['Llama', 1]
});

/** Penalty points for each card value */
const PENALTY_MAP = Object.freeze({
  1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6,
  'Llama': 10
});

/**
 * Try to load a source module. Returns null if not available.
 * @param {string} relativePath - Path relative to project root
 */
function tryRequire(relativePath) {
  try {
    return require(relativePath);
  } catch (_e) {
    return null;
  }
}

module.exports = {
  GAME_CONSTANTS,
  VALID_PLAY_MAP,
  PENALTY_MAP,
  tryRequire
};
