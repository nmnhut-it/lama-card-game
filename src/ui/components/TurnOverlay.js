/**
 * TurnOverlay - Semi-transparent overlay for local multiplayer turn transitions.
 * Shows "Pass to Player N" prompt with styled panel and a Ready button.
 * Uses ButtonHelper for the Ready button to avoid duplicating button logic.
 * Depends on: constants (Display), ButtonHelper.
 */
'use strict';

(function (exports) {

  var constants = typeof require !== 'undefined'
    ? require('../../constants')
    : window.LAMA;

  var Display = constants.Display;

  /* Overlay positions from screens.md */
  var OVERLAY_CENTER_X = 480;
  var PROMPT_Y = 360;
  var READY_BUTTON_Y = 280;

  /* Overlay colors */
  var OVERLAY_BG_COLOR = cc.color(0, 0, 0, 180);
  var PROMPT_TEXT_COLOR = cc.color(255, 255, 255);
  var PROMPT_SHADOW_COLOR = cc.color(0, 0, 0, 160);

  /* Central panel behind prompt */
  var PANEL_COLOR = cc.color(0, 0, 0, 100);
  var PANEL_BORDER_COLOR = cc.color(255, 255, 255, 60);
  var PANEL_HW = 200;
  var PANEL_HH = 70;
  var PANEL_CENTER_Y = 320;
  var PANEL_CORNER = 8;

  /* Ready button colors */
  var READY_BTN_COLOR = cc.color(50, 150, 70);
  var READY_BTN_BORDER = cc.color(35, 120, 50);
  var READY_LABEL = 'Ready';

  /* Text shadow offset */
  var SHADOW_OFFSET_X = 1;
  var SHADOW_OFFSET_Y = -1;

  /** Build chamfered rectangle vertices */
  function _chamferedVerts(hw, hh, c) {
    return [
      cc.p(-hw + c, -hh), cc.p(hw - c, -hh),
      cc.p(hw, -hh + c), cc.p(hw, hh - c),
      cc.p(hw - c, hh), cc.p(-hw + c, hh),
      cc.p(-hw, hh - c), cc.p(-hw, -hh + c)
    ];
  }

  /**
   * Create the turn overlay node.
   * @param {Object} config - playerName, onReady
   * @returns {cc.Node}
   */
  function createTurnOverlay(config) {
    var node = new cc.Node();
    node.setPosition(0, 0);

    var bg = _createOverlayBackground();
    node.addChild(bg, Display.Z_OVERLAY);

    var panel = _createCenterPanel();
    node.addChild(panel, Display.Z_POPUP - 1);

    var promptText = 'Pass to ' + config.playerName;
    _addPromptText(node, promptText);

    var ButtonHelper = window.LAMA.ButtonHelper;
    var readyBtn = ButtonHelper.createButton(
      READY_LABEL,
      { x: OVERLAY_CENTER_X, y: READY_BUTTON_Y },
      config.onReady,
      { color: READY_BTN_COLOR, borderColor: READY_BTN_BORDER }
    );
    node.addChild(readyBtn, Display.Z_POPUP);

    return node;
  }

  /** Full-screen semi-transparent background */
  function _createOverlayBackground() {
    var draw = new cc.DrawNode();
    var w = Display.CANVAS_WIDTH;
    var h = Display.CANVAS_HEIGHT;
    draw.drawPoly(
      [cc.p(0, 0), cc.p(w, 0), cc.p(w, h), cc.p(0, h)],
      OVERLAY_BG_COLOR, 0, OVERLAY_BG_COLOR
    );
    return draw;
  }

  /** Rounded panel behind the prompt and button */
  function _createCenterPanel() {
    var panel = new cc.DrawNode();
    var verts = _chamferedVerts(PANEL_HW, PANEL_HH, PANEL_CORNER);
    panel.drawPoly(verts, PANEL_COLOR, 1, PANEL_BORDER_COLOR);
    panel.setPosition(OVERLAY_CENTER_X, PANEL_CENTER_Y);
    return panel;
  }

  /** Add prompt text with dark shadow */
  function _addPromptText(node, text) {
    var shadow = new cc.LabelTTF(text, 'Arial', Display.FONT_SIZE_HEADING);
    shadow.setColor(PROMPT_SHADOW_COLOR);
    shadow.setPosition(OVERLAY_CENTER_X + SHADOW_OFFSET_X, PROMPT_Y + SHADOW_OFFSET_Y);
    node.addChild(shadow, Display.Z_POPUP);

    var prompt = new cc.LabelTTF(text, 'Arial', Display.FONT_SIZE_HEADING);
    prompt.setColor(PROMPT_TEXT_COLOR);
    prompt.setPosition(OVERLAY_CENTER_X, PROMPT_Y);
    node.addChild(prompt, Display.Z_POPUP);
  }

  exports.TurnOverlay = {
    create: createTurnOverlay
  };

})(typeof module !== 'undefined' ? module.exports : (window.LAMA = window.LAMA || {}));
