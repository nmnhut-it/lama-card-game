/**
 * Multi-round game orchestrator: creates rounds, scores them,
 * tracks tokens, and detects game-over at the point threshold.
 */
'use strict';

(function (exports) {

  var constants = typeof require !== 'undefined'
    ? require('../constants')
    : window.LAMA;
  var PlayerModule = typeof require !== 'undefined'
    ? require('./Player')
    : window.LAMA;
  var DeckModule = typeof require !== 'undefined'
    ? require('./Deck')
    : window.LAMA;
  var RoundModule = typeof require !== 'undefined'
    ? require('./Round')
    : window.LAMA;
  var TokenBankModule = typeof require !== 'undefined'
    ? require('./TokenBank')
    : window.LAMA;

  var PLAYER_COUNT = constants.PLAYER_COUNT;
  var GAME_OVER_THRESHOLD = constants.GAME_OVER_THRESHOLD;
  var RoundEndReason = constants.RoundEndReason;
  var Player = PlayerModule.Player;
  var Deck = DeckModule.Deck;
  var Round = RoundModule.Round;
  var TokenBank = TokenBankModule.TokenBank;

  /**
   * @param {string} gameMode - GameMode.LOCAL or GameMode.AI
   */
  function Game(gameMode) {
    this._gameMode = gameMode;
    this._players = this._createPlayers();
    this._tokenBank = new TokenBank();
    this._roundNumber = 0;
    this._startingPlayerIndex = Math.floor(Math.random() * PLAYER_COUNT);
    this._currentRound = null;
  }

  /** Creates PLAYER_COUNT player instances */
  Game.prototype._createPlayers = function () {
    var players = [];
    for (var i = 0; i < PLAYER_COUNT; i++) {
      players.push(new Player(i));
    }
    return players;
  };

  /* ---- Getters ---- */

  Game.prototype.getPlayers = function () { return this._players; };
  Game.prototype.getTokenBank = function () { return this._tokenBank; };
  Game.prototype.getCurrentRound = function () { return this._currentRound; };
  Game.prototype.getRoundNumber = function () { return this._roundNumber; };
  Game.prototype.getGameMode = function () { return this._gameMode; };
  Game.prototype.getStartingPlayerIndex = function () { return this._startingPlayerIndex; };

  /* ---- Round Lifecycle ---- */

  /**
   * Starts a new round: resets players, creates deck, shuffles, deals.
   * Starting player index is NOT advanced here; see scoreRound().
   */
  Game.prototype.startNewRound = function () {
    this._roundNumber++;
    this._resetPlayersForRound();
    var deck = new Deck();
    deck.shuffle();
    this._currentRound = new Round(
      this._players, deck, this._startingPlayerIndex
    );
    return this._currentRound;
  };

  /** Resets each player's hand and status for a new round */
  Game.prototype._resetPlayersForRound = function () {
    for (var i = 0; i < this._players.length; i++) {
      this._players[i].resetForRound();
    }
  };

  /** Moves starting player clockwise for the next round */
  Game.prototype._advanceStartingPlayer = function () {
    this._startingPlayerIndex =
      (this._startingPlayerIndex + 1) % PLAYER_COUNT;
  };

  /* ---- Scoring ---- */

  /**
   * Scores the current round: calculates penalties, distributes tokens,
   * and handles the empty-hand bonus (return one token).
   * @returns {object} Summary with per-player penalties and token info
   */
  Game.prototype.scoreRound = function () {
    var round = this._currentRound;
    var summary = { players: [], handEmptyPlayer: null, tokenReturned: null };

    for (var i = 0; i < this._players.length; i++) {
      var player = this._players[i];
      var penalty = player.getHandPenalty();
      var tokens = this._tokenBank.distributeTokens(player, penalty);
      summary.players.push({
        index: player.getIndex(),
        penalty: penalty,
        tokensGiven: tokens,
        totalPoints: player.totalPoints()
      });
    }

    this._handleEmptyHandBonus(round, summary);
    this._advanceStartingPlayer();
    return summary;
  };

  /** If a player emptied their hand, they return one token */
  Game.prototype._handleEmptyHandBonus = function (round, summary) {
    if (round.getRoundEndReason() !== RoundEndReason.HAND_EMPTY) return;
    var emptyPlayer = round.getHandEmptyPlayer();
    if (!emptyPlayer) return;

    var returned = this._tokenBank.returnBestToken(emptyPlayer);
    summary.handEmptyPlayer = emptyPlayer.getIndex();
    summary.tokenReturned = returned;

    /* Update totalPoints in summary after token return */
    var entry = summary.players[emptyPlayer.getIndex()];
    entry.totalPoints = emptyPlayer.totalPoints();
  };

  /* ---- Game End ---- */

  /** True if any player has reached the point threshold */
  Game.prototype.isGameOver = function () {
    for (var i = 0; i < this._players.length; i++) {
      if (this._players[i].totalPoints() >= GAME_OVER_THRESHOLD) {
        return true;
      }
    }
    return false;
  };

  /** Returns player(s) with the lowest total points (handles ties) */
  Game.prototype.getWinners = function () {
    var minPoints = Infinity;
    for (var i = 0; i < this._players.length; i++) {
      var pts = this._players[i].totalPoints();
      if (pts < minPoints) minPoints = pts;
    }
    var winners = [];
    for (var j = 0; j < this._players.length; j++) {
      if (this._players[j].totalPoints() === minPoints) {
        winners.push(this._players[j]);
      }
    }
    return winners;
  };

  /** Returns all players sorted by total points ascending */
  Game.prototype.getStandings = function () {
    return this._players.slice().sort(function (a, b) {
      return a.totalPoints() - b.totalPoints();
    });
  };

  exports.Game = Game;

})(typeof module !== 'undefined' ? module.exports : (window.LAMA = window.LAMA || {}));
