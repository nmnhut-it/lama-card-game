/**
 * L.A.M.A. game constants, enums, and display values.
 * Single source of truth — no magic numbers elsewhere.
 */
'use strict';

(function (exports) {

  /* ---- Card Value Enum ---- */
  var CardValue = Object.freeze({
    ONE: 1,
    TWO: 2,
    THREE: 3,
    FOUR: 4,
    FIVE: 5,
    SIX: 6,
    LLAMA: 'Llama'
  });

  /** Ordered list of all card values for iteration */
  var ALL_CARD_VALUES = Object.freeze([
    CardValue.ONE,
    CardValue.TWO,
    CardValue.THREE,
    CardValue.FOUR,
    CardValue.FIVE,
    CardValue.SIX,
    CardValue.LLAMA
  ]);

  /** Maps each card value to the next valid play value (wrap: Llama->1) */
  var NEXT_VALUE = Object.freeze({
    1: CardValue.TWO,
    2: CardValue.THREE,
    3: CardValue.FOUR,
    4: CardValue.FIVE,
    5: CardValue.SIX,
    6: CardValue.LLAMA,
    'Llama': CardValue.ONE
  });

  /** Penalty points per card value; Llama = 10 */
  var PENALTY_VALUES = Object.freeze({
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    'Llama': 10
  });

  /* ---- Game Mode Enum ---- */
  var GameMode = Object.freeze({
    LOCAL: 'local',
    AI: 'ai'
  });

  /* ---- Turn Action Enum ---- */
  var TurnAction = Object.freeze({
    PLAY_CARD: 'play_card',
    DRAW_CARD: 'draw_card',
    QUIT: 'quit'
  });

  /* ---- Player Status Enum ---- */
  var PlayerStatus = Object.freeze({
    ACTIVE: 'active',
    QUIT: 'quit'
  });

  /* ---- Token Type Enum ---- */
  var TokenType = Object.freeze({
    WHITE: 'white',
    BLACK: 'black'
  });

  /* ---- Game Rule Constants ---- */
  var COPIES_PER_VALUE = 8;
  var TOTAL_CARDS = 56;
  var PLAYER_COUNT = 4;
  var HAND_SIZE_INITIAL = 6;
  var WHITE_TOKEN_VALUE = 1;
  var BLACK_TOKEN_VALUE = 10;
  var WHITE_TOKEN_COUNT = 50;
  var BLACK_TOKEN_COUNT = 20;
  var GAME_OVER_THRESHOLD = 40;
  var LLAMA_PENALTY = 10;

  /* ---- Display Constants ---- */
  var Display = Object.freeze({
    CANVAS_WIDTH: 960,
    CANVAS_HEIGHT: 640,
    CARD_WIDTH: 70,
    CARD_HEIGHT: 100,
    CARD_SPACING: 12,
    TOKEN_SIZE: 30,
    TOKEN_SPACING: 8,
    FONT_SIZE_TITLE: 48,
    FONT_SIZE_HEADING: 32,
    FONT_SIZE_BODY: 24,
    FONT_SIZE_SMALL: 18,
    BUTTON_WIDTH: 200,
    BUTTON_HEIGHT: 60,
    BUTTON_SPACING: 20,
    Z_BACKGROUND: 0,
    Z_CARDS: 10,
    Z_TOKENS: 15,
    Z_UI: 20,
    Z_OVERLAY: 30,
    Z_POPUP: 40
  });

  /* ---- Round End Reason Enum ---- */
  var RoundEndReason = Object.freeze({
    HAND_EMPTY: 'hand_empty',
    ALL_QUIT: 'all_quit'
  });

  /* ---- Exports ---- */
  exports.CardValue = CardValue;
  exports.ALL_CARD_VALUES = ALL_CARD_VALUES;
  exports.NEXT_VALUE = NEXT_VALUE;
  exports.PENALTY_VALUES = PENALTY_VALUES;
  exports.GameMode = GameMode;
  exports.TurnAction = TurnAction;
  exports.PlayerStatus = PlayerStatus;
  exports.TokenType = TokenType;
  exports.RoundEndReason = RoundEndReason;
  exports.Display = Display;

  exports.COPIES_PER_VALUE = COPIES_PER_VALUE;
  exports.TOTAL_CARDS = TOTAL_CARDS;
  exports.PLAYER_COUNT = PLAYER_COUNT;
  exports.HAND_SIZE_INITIAL = HAND_SIZE_INITIAL;
  exports.WHITE_TOKEN_VALUE = WHITE_TOKEN_VALUE;
  exports.BLACK_TOKEN_VALUE = BLACK_TOKEN_VALUE;
  exports.WHITE_TOKEN_COUNT = WHITE_TOKEN_COUNT;
  exports.BLACK_TOKEN_COUNT = BLACK_TOKEN_COUNT;
  exports.GAME_OVER_THRESHOLD = GAME_OVER_THRESHOLD;
  exports.LLAMA_PENALTY = LLAMA_PENALTY;

})(typeof module !== 'undefined' ? module.exports : (window.LAMA = window.LAMA || {}));
