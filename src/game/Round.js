/**
 * Single round: deals cards, manages turns, validates actions,
 * detects round-end (empty hand or all quit).
 */
'use strict';

(function (exports) {

  var constants = typeof require !== 'undefined'
    ? require('../constants')
    : window.LAMA;

  var HAND_SIZE_INITIAL = constants.HAND_SIZE_INITIAL;
  var PLAYER_COUNT = constants.PLAYER_COUNT;
  var TurnAction = constants.TurnAction;
  var RoundEndReason = constants.RoundEndReason;

  /**
   * @param {Player[]} players - All players (must already be reset)
   * @param {Deck} deck - A shuffled deck
   * @param {number} startingPlayerIndex - Index of first player to act
   */
  function Round(players, deck, startingPlayerIndex) {
    this._players = players;
    this._deck = deck;
    this._currentPlayerIndex = startingPlayerIndex;
    this._roundOver = false;
    this._roundEndReason = null;
    this._handEmptyPlayer = null;

    this._dealInitialHands();
    this._topCard = this._deck.draw();
  }

  /** Deals HAND_SIZE_INITIAL cards to each player */
  Round.prototype._dealInitialHands = function () {
    for (var i = 0; i < this._players.length; i++) {
      var cards = this._deck.deal(HAND_SIZE_INITIAL);
      this._players[i].addCards(cards);
    }
  };

  /* ---- Getters ---- */

  Round.prototype.getTopCard = function () { return this._topCard; };
  Round.prototype.getCurrentPlayerIndex = function () { return this._currentPlayerIndex; };
  Round.prototype.getDeck = function () { return this._deck; };
  Round.prototype.getPlayers = function () { return this._players; };
  Round.prototype.isRoundOver = function () { return this._roundOver; };

  Round.prototype.getCurrentPlayer = function () {
    return this._players[this._currentPlayerIndex];
  };

  Round.prototype.getRoundEndReason = function () { return this._roundEndReason; };
  Round.prototype.getHandEmptyPlayer = function () { return this._handEmptyPlayer; };

  /* ---- Actions ---- */

  /**
   * Play a card from the player's hand onto the discard pile.
   * Validates turn order, active status, and legal card play.
   */
  Round.prototype.playCard = function (player, card) {
    this._validateCurrentPlayer(player);
    if (!card.canPlayOn(this._topCard)) {
      throw new Error('Invalid play: ' + card + ' on ' + this._topCard);
    }
    player.removeCard(card);
    this._topCard = card;
    this._checkRoundEnd();
    return card;
  };

  /**
   * Draw the top card from the deck into the player's hand.
   * Validates turn order and active status before drawing.
   */
  Round.prototype.drawCard = function (player) {
    this._validateCurrentPlayer(player);
    if (!this.canDraw(player)) {
      throw new Error('Cannot draw: deck empty or last active player');
    }
    var card = this._deck.draw();
    if (!card) return null;
    player.addCard(card);
    return card;
  };

  /** Player quits the round; validates turn order and active status */
  Round.prototype.quitRound = function (player) {
    this._validateCurrentPlayer(player);
    player.quit();
    this._checkRoundEnd();
  };

  /* ---- Validation ---- */

  /** Throws if player is not the current player or not active */
  Round.prototype._validateCurrentPlayer = function (player) {
    if (player !== this._players[this._currentPlayerIndex]) {
      throw new Error('Not this player\'s turn');
    }
    if (!player.isActive()) {
      throw new Error('Player is not active');
    }
  };

  /** True if the player is allowed to draw a card */
  Round.prototype.canDraw = function (player) {
    if (this._deck.isEmpty()) return false;
    if (this._isLastActivePlayer(player)) return false;
    return true;
  };

  /** True if only this player is still active */
  Round.prototype._isLastActivePlayer = function (player) {
    var activeCount = this.getActivePlayerCount();
    return activeCount === 1 && player.isActive();
  };

  /** Count of players who have not quit */
  Round.prototype.getActivePlayerCount = function () {
    var count = 0;
    for (var i = 0; i < this._players.length; i++) {
      if (this._players[i].isActive()) count++;
    }
    return count;
  };

  /** Returns available TurnAction values for the given player */
  Round.prototype.getValidActions = function (player) {
    var actions = [];
    if (player.hasPlayableCard(this._topCard)) {
      actions.push(TurnAction.PLAY_CARD);
    }
    if (this.canDraw(player)) {
      actions.push(TurnAction.DRAW_CARD);
    }
    actions.push(TurnAction.QUIT);
    return actions;
  };

  /* ---- Turn Advancement ---- */

  /**
   * Advances to the next active player, skipping quit players.
   * @returns {number} New current player index
   */
  Round.prototype.advanceTurn = function () {
    if (this._roundOver) return this._currentPlayerIndex;
    var start = this._currentPlayerIndex;
    do {
      this._currentPlayerIndex =
        (this._currentPlayerIndex + 1) % PLAYER_COUNT;
    } while (
      !this._players[this._currentPlayerIndex].isActive() &&
      this._currentPlayerIndex !== start
    );
    return this._currentPlayerIndex;
  };

  /* ---- Round End Detection ---- */

  /** Checks both end conditions after every action */
  Round.prototype._checkRoundEnd = function () {
    if (this._roundOver) return;

    var emptyPlayer = this._findEmptyHandPlayer();
    if (emptyPlayer !== null) {
      this._roundOver = true;
      this._roundEndReason = RoundEndReason.HAND_EMPTY;
      this._handEmptyPlayer = emptyPlayer;
      return;
    }

    if (this.getActivePlayerCount() === 0) {
      this._roundOver = true;
      this._roundEndReason = RoundEndReason.ALL_QUIT;
    }
  };

  /** Returns the first player with an empty hand, or null */
  Round.prototype._findEmptyHandPlayer = function () {
    for (var i = 0; i < this._players.length; i++) {
      if (this._players[i].hasEmptyHand()) {
        return this._players[i];
      }
    }
    return null;
  };

  exports.Round = Round;

})(typeof module !== 'undefined' ? module.exports : (window.LAMA = window.LAMA || {}));
