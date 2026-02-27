/**
 * RoundResultScene - Displays round scoring table after each round.
 * Shows each player's remaining cards, round penalty, total points.
 * Positions from screens.md.
 * Depends on: constants (Display, PLAYER_COUNT, GAME_OVER_THRESHOLD),
 *   SceneManager, GameplayScene, FinalScoreScene.
 */
'use strict';

(function (exports) {

  var constants = typeof require !== 'undefined'
    ? require('../../constants')
    : window.LAMA;

  var Display = constants.Display;
  var PLAYER_COUNT = constants.PLAYER_COUNT;

  /* Layout — centered on canvas (960x640) */
  var HEADER_X = 480;
  var HEADER_Y = 570;
  var TABLE_HEADER_Y = 510;
  var PLAYER_ROW_START_Y = 455;
  var PLAYER_ROW_SPACING = 50;
  var WINNER_LABEL_Y = 195;
  var CONTINUE_BTN_X = 480;
  var CONTINUE_BTN_Y = 100;

  /* Table column X positions — padded 100px inside panel edges */
  var COL_NAME_X = 230;
  var COL_CARDS_X = 400;
  var COL_ROUND_X = 580;
  var COL_TOTAL_X = 730;

  /* Text content */
  var HEADER_TEXT = 'Round Results';
  var COL_HEADERS = ['Player', 'Cards Left', 'Round Pts', 'Total Pts'];
  var NEXT_ROUND_LABEL = 'Next Round';
  var FINAL_RESULTS_LABEL = 'Final Results';
  var HAND_EMPTY_RETURN_BLACK_MSG = ' emptied hand! Returns 1 black token (-10 pts).';
  var HAND_EMPTY_RETURN_WHITE_MSG = ' emptied hand! Returns 1 white token (-1 pt).';
  var HAND_EMPTY_NO_RETURN_MSG = ' emptied hand! (No tokens to return)';
  var ALL_QUIT_MSG = 'All players quit.';

  /* Background colors */
  var BG_CENTER_COLOR = cc.color(45, 125, 55);
  var BG_EDGE_COLOR = cc.color(25, 75, 30);
  var BG_VIGNETTE_COLOR = cc.color(10, 40, 12, 80);
  var VIGNETTE_SIZE = 80;

  /* Score panel background (semi-transparent dark panel) */
  var PANEL_COLOR = cc.color(0, 0, 0, 60);
  var PANEL_BORDER_COLOR = cc.color(255, 255, 255, 30);
  var PANEL_CENTER_X = 480;
  var PANEL_CENTER_Y = 385;
  var PANEL_HW = 350;
  var PANEL_HH = 160;
  var PANEL_CORNER = 8;

  /* Table row stripe — narrower than panel for inner padding */
  var ROW_STRIPE_COLOR = cc.color(0, 0, 0, 30);
  var ROW_WINNER_STRIPE_COLOR = cc.color(255, 215, 0, 40);
  var ROW_STRIPE_HW = 310;
  var ROW_STRIPE_HH = 18;

  /* Text colors */
  var HEADER_COLOR = cc.color(255, 255, 255);
  var HEADER_SHADOW_COLOR = cc.color(0, 0, 0, 120);
  var TABLE_COLOR = cc.color(200, 200, 200);
  var HIGHLIGHT_ROW_COLOR = cc.color(255, 215, 0);

  /* Text shadow offset */
  var SHADOW_OFFSET_X = 1;
  var SHADOW_OFFSET_Y = -1;

  /* Continue button green */
  var CONTINUE_BTN_COLOR = cc.color(50, 150, 70);
  var CONTINUE_BTN_BORDER = cc.color(35, 120, 50);

  /* Entrance animation timing */
  var HEADER_FADE_DELAY = 0.2;
  var HEADER_FADE_DURATION = 0.3;
  var ROW_SLIDE_OFFSET_X = 200;
  var ROW_SLIDE_DURATION = 0.3;
  var ROW_STAGGER_DELAY = 0.15;

  /**
   * Factory for RoundResultScene.
   * @param {Game} game - Game instance
   * @param {Object} roundSummary - From game.scoreRound()
   */
  var RoundResultScene = cc.Scene.extend({
    _game: null,
    _roundSummary: null,

    /**
     * Initialize with game state and round summary.
     * @param {Game} game
     * @param {Object} roundSummary
     */
    initWithData: function (game, roundSummary) {
      this._game = game;
      this._roundSummary = roundSummary;
    },

    onEnter: function () {
      this._super();
      var layer = new cc.Layer();
      this.addChild(layer);
      _addBackground(layer);
      _addHeader(layer);
      _addScorePanel(layer);
      _addTableHeaders(layer);
      _addPlayerRows(layer, this._game, this._roundSummary);
      _addWinnerLabel(layer, this._game, this._roundSummary);
      _addContinueButton(layer, this._game);
    }
  });

  function _addBackground(layer) {
    var bg = new cc.DrawNode();
    var w = Display.CANVAS_WIDTH;
    var h = Display.CANVAS_HEIGHT;
    bg.drawPoly(
      [cc.p(0, 0), cc.p(w, 0), cc.p(w, h), cc.p(0, h)],
      BG_EDGE_COLOR, 0, BG_EDGE_COLOR
    );
    var inset = 40;
    bg.drawPoly(
      [cc.p(inset, inset), cc.p(w - inset, inset),
       cc.p(w - inset, h - inset), cc.p(inset, h - inset)],
      BG_CENTER_COLOR, 0, BG_CENTER_COLOR
    );
    _addVignetteCorners(bg, w, h);
    layer.addChild(bg, Display.Z_BACKGROUND);
  }

  function _addVignetteCorners(draw, w, h) {
    var cs = VIGNETTE_SIZE;
    var corners = [
      [cc.p(0, 0), cc.p(cs, 0), cc.p(0, cs)],
      [cc.p(w, 0), cc.p(w - cs, 0), cc.p(w, cs)],
      [cc.p(w, h), cc.p(w - cs, h), cc.p(w, h - cs)],
      [cc.p(0, h), cc.p(cs, h), cc.p(0, h - cs)]
    ];
    for (var i = 0; i < corners.length; i++) {
      draw.drawPoly(corners[i], BG_VIGNETTE_COLOR, 0, BG_VIGNETTE_COLOR);
    }
  }

  /** Add header with fadeIn entrance animation */
  function _addHeader(layer) {
    var shadow = new cc.LabelTTF(HEADER_TEXT, 'Arial', Display.FONT_SIZE_HEADING);
    shadow.setColor(HEADER_SHADOW_COLOR);
    shadow.setPosition(HEADER_X + SHADOW_OFFSET_X, HEADER_Y + SHADOW_OFFSET_Y);
    shadow.setOpacity(0);
    layer.addChild(shadow, Display.Z_UI);
    shadow.runAction(cc.sequence(
      cc.delayTime(HEADER_FADE_DELAY), cc.fadeIn(HEADER_FADE_DURATION)
    ));

    var label = new cc.LabelTTF(HEADER_TEXT, 'Arial', Display.FONT_SIZE_HEADING);
    label.setColor(HEADER_COLOR);
    label.setPosition(HEADER_X, HEADER_Y);
    label.setOpacity(0);
    layer.addChild(label, Display.Z_UI);
    label.runAction(cc.sequence(
      cc.delayTime(HEADER_FADE_DELAY), cc.fadeIn(HEADER_FADE_DURATION)
    ));
  }

  /** Add semi-transparent panel behind the scores table */
  function _addScorePanel(layer) {
    var panel = new cc.DrawNode();
    var verts = _chamferedVerts(PANEL_HW, PANEL_HH, PANEL_CORNER);
    panel.drawPoly(verts, PANEL_COLOR, 1, PANEL_BORDER_COLOR);
    panel.setPosition(PANEL_CENTER_X, PANEL_CENTER_Y);
    layer.addChild(panel, Display.Z_UI - 2);
  }

  /** Build chamfered rect vertices */
  function _chamferedVerts(hw, hh, c) {
    return [
      cc.p(-hw + c, -hh), cc.p(hw - c, -hh),
      cc.p(hw, -hh + c), cc.p(hw, hh - c),
      cc.p(hw - c, hh), cc.p(-hw + c, hh),
      cc.p(-hw, hh - c), cc.p(-hw, -hh + c)
    ];
  }

  function _addTableHeaders(layer) {
    var colXs = [COL_NAME_X, COL_CARDS_X, COL_ROUND_X, COL_TOTAL_X];
    for (var i = 0; i < COL_HEADERS.length; i++) {
      var label = new cc.LabelTTF(COL_HEADERS[i], 'Arial', Display.FONT_SIZE_SMALL);
      label.setColor(HEADER_COLOR);
      label.setPosition(colXs[i], TABLE_HEADER_Y);
      layer.addChild(label, Display.Z_UI);
    }
  }

  /** Add one row per player with staggered slide-in from the right */
  function _addPlayerRows(layer, game, summary) {
    var players = game.getPlayers();
    var centerX = (COL_NAME_X + COL_TOTAL_X) / 2;
    for (var i = 0; i < PLAYER_COUNT; i++) {
      _addSinglePlayerRow(layer, players, summary, centerX, i);
    }
  }

  /** Build and animate one player row with staggered entrance */
  function _addSinglePlayerRow(layer, players, summary, centerX, i) {
    var y = PLAYER_ROW_START_Y - i * PLAYER_ROW_SPACING;
    var ps = summary.players[i];
    var isWinner = (summary.handEmptyPlayer === i);
    var rowNode = new cc.Node();
    rowNode.setPosition(ROW_SLIDE_OFFSET_X, 0);
    layer.addChild(rowNode, Display.Z_UI);

    if (isWinner) {
      _addRowStripe(rowNode, centerX, y, ROW_WINNER_STRIPE_COLOR);
    } else if (i % 2 === 0) {
      _addRowStripe(rowNode, centerX, y, ROW_STRIPE_COLOR);
    }
    var color = isWinner ? HIGHLIGHT_ROW_COLOR : TABLE_COLOR;
    _addRowCell(rowNode, COL_NAME_X, y, 'Player ' + (i + 1), color);
    _addRowCell(rowNode, COL_CARDS_X, y, String(players[i].getHandSize()), color);
    _addRowCell(rowNode, COL_ROUND_X, y, String(ps.penalty), color);
    _addRowCell(rowNode, COL_TOTAL_X, y, String(ps.totalPoints), color);

    var delay = cc.delayTime(i * ROW_STAGGER_DELAY);
    var slide = cc.moveTo(ROW_SLIDE_DURATION, 0, 0).easing(cc.easeSineOut());
    rowNode.runAction(cc.sequence(delay, slide));
  }

  /** Draw a semi-transparent stripe behind a table row */
  function _addRowStripe(layer, x, y, color) {
    var stripe = new cc.DrawNode();
    stripe.drawPoly(
      [cc.p(-ROW_STRIPE_HW, -ROW_STRIPE_HH), cc.p(ROW_STRIPE_HW, -ROW_STRIPE_HH),
       cc.p(ROW_STRIPE_HW, ROW_STRIPE_HH), cc.p(-ROW_STRIPE_HW, ROW_STRIPE_HH)],
      color, 0, color
    );
    stripe.setPosition(x, y);
    layer.addChild(stripe, Display.Z_UI - 1);
  }

  function _addRowCell(layer, x, y, text, color) {
    var label = new cc.LabelTTF(text, 'Arial', Display.FONT_SIZE_BODY);
    label.setColor(color);
    label.setPosition(x, y);
    layer.addChild(label, Display.Z_UI);
  }

  function _addWinnerLabel(layer, game, summary) {
    var text;
    if (summary.handEmptyPlayer !== null) {
      var prefix = 'Player ' + (summary.handEmptyPlayer + 1);
      if (summary.tokenReturned === 'black') {
        text = prefix + HAND_EMPTY_RETURN_BLACK_MSG;
      } else if (summary.tokenReturned === 'white') {
        text = prefix + HAND_EMPTY_RETURN_WHITE_MSG;
      } else {
        text = prefix + HAND_EMPTY_NO_RETURN_MSG;
      }
    } else {
      text = ALL_QUIT_MSG;
    }
    var label = new cc.LabelTTF(text, 'Arial', Display.FONT_SIZE_BODY);
    label.setColor(HIGHLIGHT_ROW_COLOR);
    label.setPosition(HEADER_X, WINNER_LABEL_Y);
    layer.addChild(label, Display.Z_UI);
  }

  function _addContinueButton(layer, game) {
    var isGameOver = game.isGameOver();
    var btnText = isGameOver ? FINAL_RESULTS_LABEL : NEXT_ROUND_LABEL;
    var ButtonHelper = window.LAMA.ButtonHelper;
    var btn = ButtonHelper.createButton(
      btnText,
      { x: CONTINUE_BTN_X, y: CONTINUE_BTN_Y },
      function () {
        var SceneMgr = window.LAMA.SceneManager;
        var TransType = window.LAMA.TransitionType;
        if (isGameOver) {
          var scene = new window.LAMA.FinalScoreScene();
          scene.initWithData(game);
          SceneMgr.transitionTo(scene, TransType.FADE);
        } else {
          var gpScene = new window.LAMA.GameplayScene();
          gpScene.initWithGame(game);
          SceneMgr.transitionTo(gpScene, TransType.SLIDE_DOWN);
        }
      },
      { color: CONTINUE_BTN_COLOR, borderColor: CONTINUE_BTN_BORDER }
    );
    layer.addChild(btn, Display.Z_UI);
  }

  exports.RoundResultScene = RoundResultScene;

})(typeof module !== 'undefined' ? module.exports : (window.LAMA = window.LAMA || {}));
