/**
 * FinalScoreScene - Final game results with sorted standings, winner, and navigation.
 * Positions from screens.md: header (480,570), winner banner (480,500),
 * scores table (480,350), Play Again (340,100), Main Menu (620,100).
 * Depends on: constants (Display), SceneManager, GameplayScene, TitleScene.
 */
'use strict';

(function (exports) {

  var constants = typeof require !== 'undefined'
    ? require('../../constants')
    : window.LAMA;

  var Display = constants.Display;

  /* Layout from screens.md */
  var HEADER_X = 480;
  var HEADER_Y = 570;
  var WINNER_BANNER_X = 480;
  var WINNER_BANNER_Y = 500;
  var WINNER_BANNER_W = 600;
  var WINNER_BANNER_H = 60;
  var TABLE_START_Y = 420;
  var TABLE_ROW_SPACING = 50;
  var PLAY_AGAIN_X = 340;
  var PLAY_AGAIN_Y = 100;
  var MAIN_MENU_X = 620;
  var MAIN_MENU_Y = 100;

  /* Table column X positions */
  var COL_RANK_X = 200;
  var COL_NAME_X = 400;
  var COL_POINTS_X = 600;

  /* Rank labels */
  var RANK_LABELS = ['1st', '2nd', '3rd', '4th'];

  /* Text content */
  var HEADER_TEXT = 'Game Over';
  var PLAY_AGAIN_LABEL = 'Play Again';
  var MAIN_MENU_LABEL = 'Main Menu';
  var WINS_SUFFIX = ' Wins!';
  var TIE_MSG = 'Tie!';

  /* Background colors */
  var BG_CENTER_COLOR = cc.color(45, 125, 55);
  var BG_EDGE_COLOR = cc.color(25, 75, 30);
  var BG_VIGNETTE_COLOR = cc.color(10, 40, 12, 80);
  var VIGNETTE_SIZE = 80;

  /* Banner colors */
  var HEADER_COLOR = cc.color(255, 215, 0);
  var HEADER_SHADOW_COLOR = cc.color(100, 80, 0, 150);
  var WINNER_BG_COLOR = cc.color(60, 120, 170);
  var WINNER_BORDER_COLOR = cc.color(255, 215, 0, 160);
  var WINNER_TEXT_COLOR = cc.color(255, 255, 255);
  var BANNER_CORNER = 8;

  /* Table colors */
  var ROW_COLOR = cc.color(200, 200, 200);
  var FIRST_PLACE_COLOR = cc.color(255, 215, 0);
  var ROW_STRIPE_COLOR = cc.color(0, 0, 0, 30);
  var ROW_STRIPE_HW = 220;
  var ROW_STRIPE_HH = 18;

  /* Trophy star visual for 1st place */
  var TROPHY_RADIUS = 18;
  var TROPHY_COLOR = cc.color(255, 215, 0);
  var TROPHY_OFFSET_X = -60;

  /* Button colors */
  var PLAY_AGAIN_COLOR = cc.color(50, 150, 70);
  var PLAY_AGAIN_BORDER = cc.color(35, 120, 50);
  var MENU_BTN_COLOR = cc.color(100, 100, 100);
  var MENU_BTN_BORDER = cc.color(70, 70, 70);

  /* Entrance animation timing */
  var HEADER_FADE_DELAY = 0.2;
  var HEADER_FADE_DURATION = 0.3;
  var BANNER_FADE_DELAY = 0.4;
  var BANNER_FADE_DURATION = 0.3;
  var ROW_STAGGER_DELAY = 0.15;
  var ROW_SLIDE_OFFSET_X = 200;
  var ROW_SLIDE_DURATION = 0.3;

  var FinalScoreScene = cc.Scene.extend({
    _game: null,

    initWithData: function (game) {
      this._game = game;
    },

    onEnter: function () {
      this._super();
      var layer = new cc.Layer();
      this.addChild(layer);
      _addBackground(layer);
      _addHeader(layer);
      _addWinnerBanner(layer, this._game);
      _addTrophyStar(layer);
      _addStandingsTable(layer, this._game);
      _addNavigationButtons(layer, this._game);
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
    var shadow = new cc.LabelTTF(HEADER_TEXT, 'Arial', Display.FONT_SIZE_TITLE);
    shadow.setColor(HEADER_SHADOW_COLOR);
    shadow.setPosition(HEADER_X + 2, HEADER_Y - 2);
    shadow.setOpacity(0);
    layer.addChild(shadow, Display.Z_UI);
    shadow.runAction(cc.sequence(
      cc.delayTime(HEADER_FADE_DELAY), cc.fadeIn(HEADER_FADE_DURATION)
    ));

    var label = new cc.LabelTTF(HEADER_TEXT, 'Arial', Display.FONT_SIZE_TITLE);
    label.setColor(HEADER_COLOR);
    label.setPosition(HEADER_X, HEADER_Y);
    label.setOpacity(0);
    layer.addChild(label, Display.Z_UI);
    label.runAction(cc.sequence(
      cc.delayTime(HEADER_FADE_DELAY), cc.fadeIn(HEADER_FADE_DURATION)
    ));
  }

  /** Add winner banner with fadeIn entrance animation */
  function _addWinnerBanner(layer, game) {
    var winners = game.getWinners();
    var text = _buildWinnerText(winners);

    var bannerBg = new cc.DrawNode();
    var hw = WINNER_BANNER_W / 2;
    var hh = WINNER_BANNER_H / 2;
    var c = BANNER_CORNER;
    var verts = [
      cc.p(-hw + c, -hh), cc.p(hw - c, -hh),
      cc.p(hw, -hh + c), cc.p(hw, hh - c),
      cc.p(hw - c, hh), cc.p(-hw + c, hh),
      cc.p(-hw, hh - c), cc.p(-hw, -hh + c)
    ];
    bannerBg.drawPoly(verts, WINNER_BG_COLOR, 2, WINNER_BORDER_COLOR);
    bannerBg.setPosition(WINNER_BANNER_X, WINNER_BANNER_Y);
    bannerBg.setOpacity(0);
    layer.addChild(bannerBg, Display.Z_UI);
    bannerBg.runAction(cc.sequence(
      cc.delayTime(BANNER_FADE_DELAY), cc.fadeIn(BANNER_FADE_DURATION)
    ));

    var label = new cc.LabelTTF(text, 'Arial', Display.FONT_SIZE_HEADING);
    label.setColor(WINNER_TEXT_COLOR);
    label.setPosition(WINNER_BANNER_X, WINNER_BANNER_Y);
    label.setOpacity(0);
    layer.addChild(label, Display.Z_UI);
    label.runAction(cc.sequence(
      cc.delayTime(BANNER_FADE_DELAY), cc.fadeIn(BANNER_FADE_DURATION)
    ));
  }

  /** Add a gold star beside the winner banner; fades in with banner */
  function _addTrophyStar(layer) {
    var star = new cc.DrawNode();
    star.drawDot(cc.p(0, 0), TROPHY_RADIUS, TROPHY_COLOR);
    star.setPosition(WINNER_BANNER_X + TROPHY_OFFSET_X - WINNER_BANNER_W / 2, WINNER_BANNER_Y);
    star.setOpacity(0);
    layer.addChild(star, Display.Z_UI);
    star.runAction(cc.sequence(
      cc.delayTime(BANNER_FADE_DELAY), cc.fadeIn(BANNER_FADE_DURATION)
    ));
  }

  /** Build the winner text, handling ties */
  function _buildWinnerText(winners) {
    if (winners.length > 1) {
      var names = [];
      for (var i = 0; i < winners.length; i++) {
        names.push('Player ' + (winners[i].getIndex() + 1));
      }
      return names.join(' & ') + ' ' + TIE_MSG;
    }
    return 'Player ' + (winners[0].getIndex() + 1) + WINS_SUFFIX;
  }

  /** Add sorted standings with staggered slide-in from the right */
  function _addStandingsTable(layer, game) {
    var standings = game.getStandings();
    var centerX = (COL_RANK_X + COL_POINTS_X) / 2;
    for (var i = 0; i < standings.length; i++) {
      _addStandingsRow(layer, standings, centerX, i);
    }
  }

  /** Build and animate one standings row with staggered entrance */
  function _addStandingsRow(layer, standings, centerX, i) {
    var y = TABLE_START_Y - i * TABLE_ROW_SPACING;
    var rowNode = new cc.Node();
    rowNode.setPosition(ROW_SLIDE_OFFSET_X, 0);
    layer.addChild(rowNode, Display.Z_UI);

    if (i % 2 === 0) {
      _addRowStripe(rowNode, centerX, y);
    }
    var color = (i === 0) ? FIRST_PLACE_COLOR : ROW_COLOR;
    var player = standings[i];
    _addCell(rowNode, COL_RANK_X, y, RANK_LABELS[i], color);
    _addCell(rowNode, COL_NAME_X, y, 'Player ' + (player.getIndex() + 1), color);
    _addCell(rowNode, COL_POINTS_X, y, String(player.totalPoints()) + ' pts', color);

    var delay = cc.delayTime(i * ROW_STAGGER_DELAY);
    var slide = cc.moveTo(ROW_SLIDE_DURATION, 0, 0).easing(cc.easeSineOut());
    rowNode.runAction(cc.sequence(delay, slide));
  }

  /** Draw a semi-transparent stripe behind a table row */
  function _addRowStripe(layer, x, y) {
    var stripe = new cc.DrawNode();
    stripe.drawPoly(
      [cc.p(-ROW_STRIPE_HW, -ROW_STRIPE_HH), cc.p(ROW_STRIPE_HW, -ROW_STRIPE_HH),
       cc.p(ROW_STRIPE_HW, ROW_STRIPE_HH), cc.p(-ROW_STRIPE_HW, ROW_STRIPE_HH)],
      ROW_STRIPE_COLOR, 0, ROW_STRIPE_COLOR
    );
    stripe.setPosition(x, y);
    layer.addChild(stripe, Display.Z_UI - 1);
  }

  function _addCell(layer, x, y, text, color) {
    var label = new cc.LabelTTF(text, 'Arial', Display.FONT_SIZE_BODY);
    label.setColor(color);
    label.setPosition(x, y);
    layer.addChild(label, Display.Z_UI);
  }

  /** Add Play Again and Main Menu buttons */
  function _addNavigationButtons(layer, game) {
    var ButtonHelper = window.LAMA.ButtonHelper;
    var playAgainBtn = ButtonHelper.createButton(
      PLAY_AGAIN_LABEL,
      { x: PLAY_AGAIN_X, y: PLAY_AGAIN_Y },
      function () {
        var SceneMgr = window.LAMA.SceneManager;
        var TransType = window.LAMA.TransitionType;
        var gpScene = new window.LAMA.GameplayScene();
        gpScene.initWithMode(game.getGameMode());
        SceneMgr.transitionTo(gpScene, TransType.FADE);
      },
      { color: PLAY_AGAIN_COLOR, borderColor: PLAY_AGAIN_BORDER }
    );
    layer.addChild(playAgainBtn, Display.Z_UI);

    var menuBtn = ButtonHelper.createButton(
      MAIN_MENU_LABEL,
      { x: MAIN_MENU_X, y: MAIN_MENU_Y },
      function () {
        var SceneMgr = window.LAMA.SceneManager;
        var TransType = window.LAMA.TransitionType;
        SceneMgr.transitionTo(new window.LAMA.TitleScene(), TransType.SLIDE_RIGHT);
      },
      { color: MENU_BTN_COLOR, borderColor: MENU_BTN_BORDER }
    );
    layer.addChild(menuBtn, Display.Z_UI);
  }

  exports.FinalScoreScene = FinalScoreScene;

})(typeof module !== 'undefined' ? module.exports : (window.LAMA = window.LAMA || {}));
