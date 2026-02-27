/**
 * ModeSelectScene - Choose between Local Multiplayer and Solo vs AI.
 * Positions from screens.md: header (480,520), Local btn (480,370),
 * AI btn (480,240), Back btn (130,90).
 * Depends on: constants (Display, GameMode), SceneManager.
 */
'use strict';

(function (exports) {

  var constants = typeof require !== 'undefined'
    ? require('../../constants')
    : window.LAMA;

  var Display = constants.Display;
  var GameMode = constants.GameMode;

  /* Layout from screens.md */
  var HEADER_X = 480;
  var HEADER_Y = 520;
  var LOCAL_BTN_X = 480;
  var LOCAL_BTN_Y = 370;
  var LOCAL_DESC_Y = 305;
  var AI_BTN_X = 480;
  var AI_BTN_Y = 240;
  var AI_DESC_Y = 175;
  var BACK_BTN_X = 130;
  var BACK_BTN_Y = 90;
  var MODE_BUTTON_WIDTH = 300;
  var BACK_BUTTON_WIDTH = 140;
  var BACK_BUTTON_HEIGHT = 50;

  /* Text content */
  var HEADER_TEXT = 'Select Mode';
  var LOCAL_LABEL = 'Local Multiplayer';
  var LOCAL_DESC = '4 players, same device';
  var AI_LABEL = 'Solo vs AI';
  var AI_DESC = 'You vs 3 AI opponents';
  var BACK_LABEL = 'Back';

  /* Background colors */
  var BG_CENTER_COLOR = cc.color(45, 125, 55);
  var BG_EDGE_COLOR = cc.color(25, 75, 30);
  var BG_VIGNETTE_COLOR = cc.color(10, 40, 12, 80);
  var VIGNETTE_SIZE = 80;

  /* Text colors */
  var HEADER_COLOR = cc.color(255, 255, 255);
  var DESC_COLOR = cc.color(180, 180, 180);
  var BACK_BTN_COLOR = cc.color(100, 100, 100);

  var ModeSelectScene = cc.Scene.extend({
    onEnter: function () {
      this._super();
      var layer = new cc.Layer();
      this.addChild(layer);
      _addBackground(layer);
      _addHeader(layer);
      _addModeButton(layer, LOCAL_BTN_X, LOCAL_BTN_Y, LOCAL_LABEL, GameMode.LOCAL);
      _addDescription(layer, LOCAL_BTN_X, LOCAL_DESC_Y, LOCAL_DESC);
      _addModeButton(layer, AI_BTN_X, AI_BTN_Y, AI_LABEL, GameMode.AI);
      _addDescription(layer, AI_BTN_X, AI_DESC_Y, AI_DESC);
      _addBackButton(layer);
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

  function _addHeader(layer) {
    var label = new cc.LabelTTF(HEADER_TEXT, 'Arial', Display.FONT_SIZE_HEADING);
    label.setColor(HEADER_COLOR);
    label.setPosition(HEADER_X, HEADER_Y);
    layer.addChild(label, Display.Z_UI);
  }

  /** Add a mode selection button that starts the game */
  function _addModeButton(layer, x, y, text, mode) {
    var ButtonHelper = window.LAMA.ButtonHelper;
    var btn = ButtonHelper.createButton(
      text,
      { x: x, y: y },
      function () {
        var SceneMgr = window.LAMA.SceneManager;
        var TransType = window.LAMA.TransitionType;
        var gpScene = new window.LAMA.GameplayScene();
        gpScene.initWithMode(mode);
        SceneMgr.transitionTo(gpScene, TransType.FADE);
      },
      { width: MODE_BUTTON_WIDTH }
    );
    layer.addChild(btn, Display.Z_UI);
  }

  function _addDescription(layer, x, y, text) {
    var label = new cc.LabelTTF(text, 'Arial', Display.FONT_SIZE_SMALL);
    label.setColor(DESC_COLOR);
    label.setPosition(x, y);
    layer.addChild(label, Display.Z_UI);
  }

  function _addBackButton(layer) {
    var ButtonHelper = window.LAMA.ButtonHelper;
    var btn = ButtonHelper.createButton(
      BACK_LABEL,
      { x: BACK_BTN_X, y: BACK_BTN_Y },
      function () {
        var SceneMgr = window.LAMA.SceneManager;
        var TransType = window.LAMA.TransitionType;
        SceneMgr.transitionTo(new window.LAMA.TitleScene(), TransType.SLIDE_RIGHT);
      },
      { width: BACK_BUTTON_WIDTH, height: BACK_BUTTON_HEIGHT, color: BACK_BTN_COLOR, borderColor: cc.color(50, 50, 50) }
    );
    layer.addChild(btn, Display.Z_UI);
  }

  exports.ModeSelectScene = ModeSelectScene;

})(typeof module !== 'undefined' ? module.exports : (window.LAMA = window.LAMA || {}));
