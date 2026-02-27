/**
 * 56-card deck with Fisher-Yates shuffle, deal, and draw.
 * Cards are drawn/dealt from the end of the internal array (top of deck).
 */
'use strict';

(function (exports) {

  var constants = typeof require !== 'undefined'
    ? require('../constants')
    : window.LAMA;
  var CardModule = typeof require !== 'undefined'
    ? require('./Card')
    : window.LAMA;

  var ALL_CARD_VALUES = constants.ALL_CARD_VALUES;
  var COPIES_PER_VALUE = constants.COPIES_PER_VALUE;
  var Card = CardModule.Card;

  /** Creates a full 56-card deck (8 copies of each of 7 values) */
  function Deck() {
    this._cards = [];
    for (var v = 0; v < ALL_CARD_VALUES.length; v++) {
      for (var c = 0; c < COPIES_PER_VALUE; c++) {
        this._cards.push(new Card(ALL_CARD_VALUES[v]));
      }
    }
  }

  /** Fisher-Yates in-place shuffle. Returns this for chaining. */
  Deck.prototype.shuffle = function () {
    var cards = this._cards;
    for (var i = cards.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = cards[i];
      cards[i] = cards[j];
      cards[j] = temp;
    }
    return this;
  };

  /**
   * Removes and returns top N cards.
   * @param {number} count - Number of cards to deal
   * @returns {Card[]}
   */
  Deck.prototype.deal = function (count) {
    if (count > this._cards.length) {
      throw new Error('Not enough cards to deal ' + count);
    }
    return this._cards.splice(-count, count);
  };

  /** Removes and returns the top card, or null if empty */
  Deck.prototype.draw = function () {
    return this._cards.length > 0 ? this._cards.pop() : null;
  };

  /** Returns the top card without removing it, or null if empty */
  Deck.prototype.peek = function () {
    return this._cards.length > 0
      ? this._cards[this._cards.length - 1]
      : null;
  };

  /** True when no cards remain */
  Deck.prototype.isEmpty = function () {
    return this._cards.length === 0;
  };

  /** Number of cards remaining in the deck */
  Deck.prototype.remaining = function () {
    return this._cards.length;
  };

  exports.Deck = Deck;

})(typeof module !== 'undefined' ? module.exports : (window.LAMA = window.LAMA || {}));
