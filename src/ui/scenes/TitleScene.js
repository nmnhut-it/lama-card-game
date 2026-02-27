/**
 * TitleScene - Game entry point with title, subtitle, and Start button.
 * Positions from screens.md: title at (480,420), subtitle (480,360),
 * Start button (480,240), version (480,40).
 * Depends on: constants (Display), SceneManager, ModeSelectScene.
 */
'use strict';

(function (exports) {

  var constants = typeof require !== 'undefined'
    ? require('../../constants')
    : window.LAMA;

  var Display = constants.Display;

  /* Layout positions from screens.md */
  var TITLE_X = 480;
  var TITLE_Y = 420;
  var SUBTITLE_X = 480;
  var SUBTITLE_Y = 360;
  var START_BUTTON_X = 480;
  var START_BUTTON_Y = 240;
  var VERSION_X = 480;
  var VERSION_Y = 40;

  /* Text content */
  var GAME_TITLE = 'L.A.M.A.';
  var SUBTITLE_TEXT = 'Drop All Your Minus Points';
  var START_LABEL = 'START';
  var VERSION_TEXT = 'v1.0';

  /* Background colors (felt table with vignette) */
  var BG_CENTER_COLOR = cc.color(45, 125, 55);
  var BG_EDGE_COLOR = cc.color(25, 75, 30);
  var BG_VIGNETTE_COLOR = cc.color(10, 40, 12, 80);
  var VIGNETTE_SIZE = 80;

  /* Text colors */
  var TITLE_COLOR = cc.color(255, 215, 0);
  var TITLE_SHADOW_COLOR = cc.color(100, 80, 0, 150);
  var SUBTITLE_COLOR = cc.color(220, 220, 220);
  var VERSION_COLOR = cc.color(150, 150, 150);

  /* Divider line between subtitle and button */
  var DIVIDER_Y = 300;
  var DIVIDER_HW = 140;
  var DIVIDER_COLOR = cc.color(200, 180, 100, 100);

  /* Start button green color */
  var START_BTN_COLOR = cc.color(50, 150, 70);
  var START_BTN_BORDER = cc.color(35, 120, 50);

  /* Entrance animation timing */
  var TITLE_ENTRANCE_OFFSET_Y = 100;
  var TITLE_ENTRANCE_DURATION = 0.5;
  var SUBTITLE_FADE_DELAY = 0.3;
  var SUBTITLE_FADE_DURATION = 0.4;
  var DIVIDER_FADE_DELAY = 0.5;
  var DIVIDER_FADE_DURATION = 0.3;
  var BUTTON_FADE_DELAY = 0.7;
  var BUTTON_FADE_DURATION = 0.3;

  var TitleScene = cc.Scene.extend({
    onEnter: function () {
      this._super();
      var layer = new cc.Layer();
      this.addChild(layer);
      _addBackground(layer);
      _addTitle(layer);
      _addSubtitle(layer);
      _addDivider(layer);
      _addStartButton(layer);
      _addVersionLabel(layer);
    }
  });

  /** Add rich felt-style background with vignette */
  function _addBackground(layer) {
    var bg = new cc.DrawNode();
    var w = Display.CANVAS_WIDTH;
    var h = Display.CANVAS_HEIGHT;
    /* Dark edge base */
    bg.drawPoly(
      [cc.p(0, 0), cc.p(w, 0), cc.p(w, h), cc.p(0, h)],
      BG_EDGE_COLOR, 0, BG_EDGE_COLOR
    );
    /* Lighter center for depth */
    var inset = 40;
    bg.drawPoly(
      [cc.p(inset, inset), cc.p(w - inset, inset),
       cc.p(w - inset, h - inset), cc.p(inset, h - inset)],
      BG_CENTER_COLOR, 0, BG_CENTER_COLOR
    );
    _addVignetteCorners(bg, w, h);
    layer.addChild(bg, Display.Z_BACKGROUND);
  }

  /** Add subtle vignette corners */
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

  /** Add the game title label with shadow; slides down from above */
  function _addTitle(layer) {
    var startY = TITLE_Y + TITLE_ENTRANCE_OFFSET_Y;

    var shadow = new cc.LabelTTF(GAME_TITLE, 'Arial', Display.FONT_SIZE_TITLE);
    shadow.setColor(TITLE_SHADOW_COLOR);
    shadow.setPosition(TITLE_X + 2, startY - 2);
    layer.addChild(shadow, Display.Z_UI);
    shadow.runAction(cc.moveTo(TITLE_ENTRANCE_DURATION, TITLE_X + 2, TITLE_Y - 2)
      .easing(cc.easeBackOut()));

    var label = new cc.LabelTTF(GAME_TITLE, 'Arial', Display.FONT_SIZE_TITLE);
    label.setColor(TITLE_COLOR);
    label.setPosition(TITLE_X, startY);
    layer.addChild(label, Display.Z_UI);
    label.runAction(cc.moveTo(TITLE_ENTRANCE_DURATION, TITLE_X, TITLE_Y)
      .easing(cc.easeBackOut()));
  }

  /** Add the subtitle label; fades in after a delay */
  function _addSubtitle(layer) {
    var label = new cc.LabelTTF(SUBTITLE_TEXT, 'Arial', Display.FONT_SIZE_BODY);
    label.setColor(SUBTITLE_COLOR);
    label.setPosition(SUBTITLE_X, SUBTITLE_Y);
    label.setOpacity(0);
    layer.addChild(label, Display.Z_UI);
    label.runAction(cc.sequence(
      cc.delayTime(SUBTITLE_FADE_DELAY),
      cc.fadeIn(SUBTITLE_FADE_DURATION)
    ));
  }

  /** Add a decorative gold divider line; fades in after a delay */
  function _addDivider(layer) {
    var divider = new cc.DrawNode();
    divider.drawSegment(
      cc.p(TITLE_X - DIVIDER_HW, DIVIDER_Y),
      cc.p(TITLE_X + DIVIDER_HW, DIVIDER_Y),
      1, DIVIDER_COLOR
    );
    divider.setOpacity(0);
    layer.addChild(divider, Display.Z_UI);
    divider.runAction(cc.sequence(
      cc.delayTime(DIVIDER_FADE_DELAY),
      cc.fadeIn(DIVIDER_FADE_DURATION)
    ));
  }

  /** Add the Start button with touch handling; fades in after a delay */
  function _addStartButton(layer) {
    var ButtonHelper = window.LAMA.ButtonHelper;
    var btn = ButtonHelper.createButton(
      START_LABEL,
      { x: START_BUTTON_X, y: START_BUTTON_Y },
      function () {
        var SceneMgr = window.LAMA.SceneManager;
        var TransType = window.LAMA.TransitionType;
        SceneMgr.transitionTo(new window.LAMA.ModeSelectScene(), TransType.SLIDE_LEFT);
      },
      { color: START_BTN_COLOR, borderColor: START_BTN_BORDER }
    );
    btn.setOpacity(0);
    layer.addChild(btn, Display.Z_UI);
    btn.runAction(cc.sequence(
      cc.delayTime(BUTTON_FADE_DELAY),
      cc.fadeIn(BUTTON_FADE_DURATION)
    ));
  }

  /** Add the version label */
  function _addVersionLabel(layer) {
    var label = new cc.LabelTTF(VERSION_TEXT, 'Arial', Display.FONT_SIZE_SMALL);
    label.setColor(VERSION_COLOR);
    label.setPosition(VERSION_X, VERSION_Y);
    layer.addChild(label, Display.Z_UI);
  }

  exports.TitleScene = TitleScene;

})(typeof module !== 'undefined' ? module.exports : (window.LAMA = window.LAMA || {}));
