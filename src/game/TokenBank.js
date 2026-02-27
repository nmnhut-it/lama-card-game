/**
 * Shared token supply for penalty distribution, return, and exchange.
 * White tokens = 1 point, Black tokens = 10 points.
 */
'use strict';

(function (exports) {

  var constants = typeof require !== 'undefined'
    ? require('../constants')
    : window.LAMA;

  var TokenType = constants.TokenType;
  var WHITE_TOKEN_COUNT = constants.WHITE_TOKEN_COUNT;
  var BLACK_TOKEN_COUNT = constants.BLACK_TOKEN_COUNT;
  var BLACK_TOKEN_VALUE = constants.BLACK_TOKEN_VALUE;

  /** Initializes supply with standard token counts */
  function TokenBank() {
    this._white = WHITE_TOKEN_COUNT;
    this._black = BLACK_TOKEN_COUNT;
  }

  /* ---- Supply Queries ---- */
  TokenBank.prototype.getWhiteSupply = function () { return this._white; };
  TokenBank.prototype.getBlackSupply = function () { return this._black; };

  /**
   * Gives a player tokens totaling the given penalty points.
   * Prefers black tokens (10 pts each), remainder in white (1 pt each).
   * Respects supply limits — gives as many as available.
   */
  TokenBank.prototype.distributeTokens = function (player, points) {
    var blackNeeded = Math.floor(points / BLACK_TOKEN_VALUE);
    var blackToGive = Math.min(blackNeeded, this._black);
    var remaining = points - (blackToGive * BLACK_TOKEN_VALUE);
    var whiteToGive = Math.min(remaining, this._white);

    this._black -= blackToGive;
    this._white -= whiteToGive;
    player.addBlackTokens(blackToGive);
    player.addWhiteTokens(whiteToGive);

    return { black: blackToGive, white: whiteToGive };
  };

  /**
   * Player returns one token of the specified type to the supply.
   * @returns {boolean} true if successful, false if player has none
   */
  TokenBank.prototype.returnToken = function (player, tokenType) {
    if (tokenType === TokenType.BLACK && player.getBlackTokens() > 0) {
      player.addBlackTokens(-1);
      this._black += 1;
      return true;
    }
    if (tokenType === TokenType.WHITE && player.getWhiteTokens() > 0) {
      player.addWhiteTokens(-1);
      this._white += 1;
      return true;
    }
    return false;
  };

  /**
   * Returns the best token a player has (black first, then white).
   * Per GDD, players can exchange at any time — so if the player has
   * no black but >= BLACK_TOKEN_VALUE white, exchange first, then
   * return the black token (saving 10 pts instead of 1).
   */
  TokenBank.prototype.returnBestToken = function (player) {
    if (player.getBlackTokens() > 0) {
      this.returnToken(player, TokenType.BLACK);
      return TokenType.BLACK;
    }
    if (this._canExchangeWhiteToBlack(player)) {
      this._exchangeWhiteToBlack(player);
      this.returnToken(player, TokenType.BLACK);
      return TokenType.BLACK;
    }
    if (player.getWhiteTokens() > 0) {
      this.returnToken(player, TokenType.WHITE);
      return TokenType.WHITE;
    }
    return null;
  };

  /** True if the player can exchange 10 white for 1 black */
  TokenBank.prototype._canExchangeWhiteToBlack = function (player) {
    return player.getWhiteTokens() >= BLACK_TOKEN_VALUE && this._black >= 1;
  };

  /**
   * Exchange tokens: 1 black <-> 10 white.
   * @param {Player} player
   * @param {string} fromType - TokenType to convert FROM
   * @returns {boolean} true if exchange succeeded
   */
  TokenBank.prototype.exchange = function (player, fromType) {
    if (fromType === TokenType.BLACK) {
      return this._exchangeBlackToWhite(player);
    }
    if (fromType === TokenType.WHITE) {
      return this._exchangeWhiteToBlack(player);
    }
    return false;
  };

  /** Convert 1 black token to 10 white tokens */
  TokenBank.prototype._exchangeBlackToWhite = function (player) {
    var whiteNeeded = BLACK_TOKEN_VALUE;
    if (player.getBlackTokens() < 1 || this._white < whiteNeeded) {
      return false;
    }
    player.addBlackTokens(-1);
    this._black += 1;
    player.addWhiteTokens(whiteNeeded);
    this._white -= whiteNeeded;
    return true;
  };

  /** Convert 10 white tokens to 1 black token */
  TokenBank.prototype._exchangeWhiteToBlack = function (player) {
    var whiteNeeded = BLACK_TOKEN_VALUE;
    if (player.getWhiteTokens() < whiteNeeded || this._black < 1) {
      return false;
    }
    player.addWhiteTokens(-whiteNeeded);
    this._white += whiteNeeded;
    player.addBlackTokens(1);
    this._black -= 1;
    return true;
  };

  exports.TokenBank = TokenBank;

})(typeof module !== 'undefined' ? module.exports : (window.LAMA = window.LAMA || {}));
