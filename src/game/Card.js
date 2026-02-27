/**
 * Immutable Card with value, play validation, and penalty lookup.
 * Value order: 1->2->3->4->5->6->Llama->1 (wraps).
 */
'use strict';

(function (exports) {

  var constants = typeof require !== 'undefined'
    ? require('../constants')
    : window.LAMA;

  var ALL_CARD_VALUES = constants.ALL_CARD_VALUES;
  var NEXT_VALUE = constants.NEXT_VALUE;
  var PENALTY_VALUES = constants.PENALTY_VALUES;

  /**
   * @param {number|string} cardValue - A value from CardValue enum
   */
  function Card(cardValue) {
    if (ALL_CARD_VALUES.indexOf(cardValue) === -1) {
      throw new Error('Invalid card value: ' + cardValue);
    }
    this._value = cardValue;
    Object.freeze(this);
  }

  /** Returns the card's value (number 1-6 or 'Llama') */
  Card.prototype.getValue = function () {
    return this._value;
  };

  /**
   * Can this card be played on top of the given card?
   * Valid if same value or exactly one step higher in the cycle.
   * @param {Card} topCard - The current discard pile top card
   */
  Card.prototype.canPlayOn = function (topCard) {
    if (!topCard) return false;
    var topValue = topCard.getValue();
    return this._value === topValue || this._value === NEXT_VALUE[topValue];
  };

  /** Returns the penalty points this card is worth */
  Card.prototype.getPenaltyValue = function () {
    return PENALTY_VALUES[this._value];
  };

  /** Debug-friendly string representation */
  Card.prototype.toString = function () {
    return 'Card(' + this._value + ')';
  };

  exports.Card = Card;

})(typeof module !== 'undefined' ? module.exports : (window.LAMA = window.LAMA || {}));
