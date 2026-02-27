/**
 * AiPlayer - Decision logic for AI-controlled opponents.
 * Evaluates hand, top discard, and draw pile state to choose
 * the best action: play a card, draw, or quit.
 * Depends on: constants (TurnAction).
 */
'use strict';

(function (exports) {

  var constants = typeof require !== 'undefined'
    ? require('../constants')
    : window.LAMA;

  var TurnAction = constants.TurnAction;

  /** Penalty threshold below which AI prefers to quit over drawing */
  var QUIT_PENALTY_THRESHOLD = 5;

  var AiPlayer = {};

  /**
   * Decide the best action for an AI player this turn.
   * @param {Player} player - The AI player
   * @param {Round} round - Current round state
   * @returns {{ action: string, card: Card|null }}
   */
  AiPlayer.decideAction = function (player, round) {
    var playableCards = AiPlayer._findPlayableCards(player, round);
    if (playableCards.length > 0) {
      return AiPlayer._chooseCardToPlay(playableCards);
    }
    if (AiPlayer._shouldDraw(player, round)) {
      return { action: TurnAction.DRAW_CARD, card: null };
    }
    return { action: TurnAction.QUIT, card: null };
  };

  /**
   * Find all cards in hand that can legally be played.
   * @param {Player} player - The AI player
   * @param {Round} round - Current round state
   * @returns {Card[]} Playable cards
   */
  AiPlayer._findPlayableCards = function (player, round) {
    var topCard = round.getTopCard();
    var hand = player.getHand();
    var playable = [];
    for (var i = 0; i < hand.length; i++) {
      if (hand[i].canPlayOn(topCard)) {
        playable.push(hand[i]);
      }
    }
    return playable;
  };

  /**
   * Choose the highest-penalty playable card to shed expensive cards first.
   * @param {Card[]} playableCards - Non-empty array of playable cards
   * @returns {{ action: string, card: Card }}
   */
  AiPlayer._chooseCardToPlay = function (playableCards) {
    var best = playableCards[0];
    for (var i = 1; i < playableCards.length; i++) {
      if (playableCards[i].getPenaltyValue() > best.getPenaltyValue()) {
        best = playableCards[i];
      }
    }
    return { action: TurnAction.PLAY_CARD, card: best };
  };

  /**
   * Determine whether drawing is better than quitting.
   * Draws when allowed and current hand penalty is high enough.
   * @param {Player} player - The AI player
   * @param {Round} round - Current round state
   * @returns {boolean}
   */
  AiPlayer._shouldDraw = function (player, round) {
    if (!round.canDraw(player)) {
      return false;
    }
    return player.getHandPenalty() > QUIT_PENALTY_THRESHOLD;
  };

  exports.AiPlayer = AiPlayer;

})(typeof module !== 'undefined' ? module.exports : (window.LAMA = window.LAMA || {}));
