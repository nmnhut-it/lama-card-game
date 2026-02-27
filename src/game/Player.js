/**
 * Player state: hand of cards, token counts, active/quit status.
 * Penalty uses the duplicate-counts-once rule from the GDD.
 */
'use strict';

(function (exports) {

  var constants = typeof require !== 'undefined'
    ? require('../constants')
    : window.LAMA;

  var PlayerStatus = constants.PlayerStatus;
  var PENALTY_VALUES = constants.PENALTY_VALUES;
  var WHITE_TOKEN_VALUE = constants.WHITE_TOKEN_VALUE;
  var BLACK_TOKEN_VALUE = constants.BLACK_TOKEN_VALUE;

  /**
   * @param {number} index - Player seat index (0-3)
   */
  function Player(index) {
    this._index = index;
    this._hand = [];
    this._whiteTokens = 0;
    this._blackTokens = 0;
    this._status = PlayerStatus.ACTIVE;
  }

  /* ---- Identity ---- */
  Player.prototype.getIndex = function () { return this._index; };

  /* ---- Hand Management ---- */

  Player.prototype.addCard = function (card) {
    this._hand.push(card);
  };

  Player.prototype.addCards = function (cards) {
    for (var i = 0; i < cards.length; i++) {
      this._hand.push(cards[i]);
    }
  };

  /** Removes a specific Card instance by reference */
  Player.prototype.removeCard = function (card) {
    var idx = this._hand.indexOf(card);
    if (idx === -1) {
      throw new Error('Card not found in hand');
    }
    this._hand.splice(idx, 1);
  };

  /** Returns a shallow copy of the hand */
  Player.prototype.getHand = function () {
    return this._hand.slice();
  };

  Player.prototype.getHandSize = function () { return this._hand.length; };
  Player.prototype.hasEmptyHand = function () { return this._hand.length === 0; };

  /* ---- Play Validation ---- */

  /** True if at least one card in hand can be played on topCard */
  Player.prototype.hasPlayableCard = function (topCard) {
    for (var i = 0; i < this._hand.length; i++) {
      if (this._hand[i].canPlayOn(topCard)) return true;
    }
    return false;
  };

  /** Returns array of cards in hand that can be played on topCard */
  Player.prototype.getPlayableCards = function (topCard) {
    var playable = [];
    for (var i = 0; i < this._hand.length; i++) {
      if (this._hand[i].canPlayOn(topCard)) {
        playable.push(this._hand[i]);
      }
    }
    return playable;
  };

  /* ---- Status ---- */

  Player.prototype.quit = function () { this._status = PlayerStatus.QUIT; };
  Player.prototype.isActive = function () { return this._status === PlayerStatus.ACTIVE; };
  Player.prototype.getStatus = function () { return this._status; };

  /** Resets hand and status for a new round */
  Player.prototype.resetForRound = function () {
    this._hand = [];
    this._status = PlayerStatus.ACTIVE;
  };

  /* ---- Scoring ---- */

  /**
   * Penalty for remaining hand cards.
   * Duplicate values count only once (GDD duplicate rule).
   */
  Player.prototype.getHandPenalty = function () {
    var seen = {};
    var penalty = 0;
    for (var i = 0; i < this._hand.length; i++) {
      var val = this._hand[i].getValue();
      if (!seen[val]) {
        seen[val] = true;
        penalty += PENALTY_VALUES[val];
      }
    }
    return penalty;
  };

  /** Total penalty points from tokens held */
  Player.prototype.totalPoints = function () {
    return (this._whiteTokens * WHITE_TOKEN_VALUE)
         + (this._blackTokens * BLACK_TOKEN_VALUE);
  };

  /* ---- Token Accessors ---- */

  Player.prototype.getWhiteTokens = function () { return this._whiteTokens; };
  Player.prototype.getBlackTokens = function () { return this._blackTokens; };
  Player.prototype.addWhiteTokens = function (n) { this._whiteTokens += n; };
  Player.prototype.addBlackTokens = function (n) { this._blackTokens += n; };

  exports.Player = Player;

})(typeof module !== 'undefined' ? module.exports : (window.LAMA = window.LAMA || {}));
