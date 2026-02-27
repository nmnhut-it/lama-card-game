/**
 * ActionButtons - Draw Card and Quit Round buttons for the active player.
 * Draw uses green color, Quit uses amber/red for clear visual distinction.
 * Rounded appearance with shadow and text shadow.
 * Positions from screens.md: Draw at (310,200), Quit at (650,200).
 * Depends on: constants (Display).
 */
'use strict';

(function (exports) {

  var constants = typeof require !== 'undefined'
    ? require('../../constants')
    : window.LAMA;

  var Display = constants.Display;

  /* Button positions from screens.md */
  var DRAW_BUTTON_X = 310;
  var DRAW_BUTTON_Y = 200;
  var QUIT_BUTTON_X = 650;
  var QUIT_BUTTON_Y = 200;
  var ACTION_BUTTON_WIDTH = 140;
  var ACTION_BUTTON_HEIGHT = 50;

  /* Button labels */
  var DRAW_LABEL = 'Draw Card';
  var QUIT_LABEL = 'Quit Round';

  /* Draw button colors (green) */
  var DRAW_ENABLED_COLOR = cc.color(50, 140, 70);
  var DRAW_ENABLED_BORDER = cc.color(35, 110, 50);

  /* Quit button colors (amber) */
  var QUIT_COLOR = cc.color(180, 100, 40);
  var QUIT_BORDER = cc.color(150, 80, 30);

  /* Disabled colors */
  var DISABLED_COLOR = cc.color(100, 100, 100);
  var DISABLED_BORDER = cc.color(75, 75, 75);

  /* Text and shadow */
  var BUTTON_TEXT_COLOR = cc.color(255, 255, 255);
  var TEXT_SHADOW_COLOR = cc.color(0, 0, 0, 100);
  var BUTTON_SHADOW_COLOR = cc.color(0, 0, 0, 80);

  /* Press darken: subtract this from RGB on touch */
  var PRESS_DARKEN = 30;

  /* Rounded corner offset */
  var CORNER_OFFSET = 7;

  /** Build chamfered rectangle vertices */
  function _roundedRectVerts(hw, hh, c) {
    return [
      cc.p(-hw + c, -hh), cc.p(hw - c, -hh),
      cc.p(hw, -hh + c), cc.p(hw, hh - c),
      cc.p(hw - c, hh), cc.p(-hw + c, hh),
      cc.p(-hw, hh - c), cc.p(-hw, -hh + c)
    ];
  }

  /**
   * Create the action buttons node.
   * @param {Object} config - onDraw, onQuit, drawEnabled
   * @returns {cc.Node}
   */
  function createActionButtons(config) {
    var node = new cc.Node();

    var drawColor = config.drawEnabled ? DRAW_ENABLED_COLOR : DISABLED_COLOR;
    var drawBorder = config.drawEnabled ? DRAW_ENABLED_BORDER : DISABLED_BORDER;
    var drawBtn = _createButton(
      DRAW_BUTTON_X, DRAW_BUTTON_Y, DRAW_LABEL,
      config.drawEnabled, config.onDraw, drawColor, drawBorder
    );
    node.addChild(drawBtn, Display.Z_UI);

    var quitBtn = _createButton(
      QUIT_BUTTON_X, QUIT_BUTTON_Y, QUIT_LABEL,
      true, config.onQuit, QUIT_COLOR, QUIT_BORDER
    );
    node.addChild(quitBtn, Display.Z_UI);

    node._drawBtn = drawBtn;
    node._quitBtn = quitBtn;
    return node;
  }

  /** Create a single action button with rounded bg, shadow, and text */
  function _createButton(x, y, text, enabled, callback, fillColor, borderColor) {
    var btn = new cc.Node();
    btn.setPosition(x, y);
    btn.setContentSize(ACTION_BUTTON_WIDTH, ACTION_BUTTON_HEIGHT);
    btn.setAnchorPoint(0.5, 0.5);
    var cx = ACTION_BUTTON_WIDTH / 2;
    var cy = ACTION_BUTTON_HEIGHT / 2;

    _addShadow(btn, cx, cy);
    var bg = _drawButtonBackground(fillColor, borderColor);
    bg.setPosition(cx, cy);
    btn.addChild(bg, 1);
    _addTextWithShadow(btn, text, cx, cy);

    btn._enabled = enabled;
    btn._bg = bg;
    btn._cx = cx;
    btn._cy = cy;
    btn._fillColor = fillColor;
    btn._borderColor = borderColor;

    if (enabled && callback) {
      _addButtonListener(btn, callback);
    }

    btn.onExitTransitionDidStart = function () {
      cc.eventManager.removeListeners(btn);
    };
    return btn;
  }

  /** Add drop shadow behind button */
  function _addShadow(btn, cx, cy) {
    var shadow = new cc.DrawNode();
    var hw = ACTION_BUTTON_WIDTH / 2;
    var hh = ACTION_BUTTON_HEIGHT / 2;
    var verts = _roundedRectVerts(hw, hh, CORNER_OFFSET);
    shadow.drawPoly(verts, BUTTON_SHADOW_COLOR, 0, BUTTON_SHADOW_COLOR);
    shadow.setPosition(cx + 2, cy - 3);
    btn.addChild(shadow, 0);
  }

  /** Draw rounded button background */
  function _drawButtonBackground(fillColor, borderColor) {
    var draw = new cc.DrawNode();
    var hw = ACTION_BUTTON_WIDTH / 2;
    var hh = ACTION_BUTTON_HEIGHT / 2;
    var verts = _roundedRectVerts(hw, hh, CORNER_OFFSET);
    draw.drawPoly(verts, fillColor, 2, borderColor);
    return draw;
  }

  /** Add text with a dark shadow for readability */
  function _addTextWithShadow(btn, text, cx, cy) {
    var shadow = new cc.LabelTTF(text, 'Arial', Display.FONT_SIZE_SMALL);
    shadow.setColor(TEXT_SHADOW_COLOR);
    shadow.setPosition(cx + 1, cy - 1);
    btn.addChild(shadow, 2);

    var label = new cc.LabelTTF(text, 'Arial', Display.FONT_SIZE_SMALL);
    label.setColor(BUTTON_TEXT_COLOR);
    label.setPosition(cx, cy);
    btn.addChild(label, 3);
    btn._label = label;
  }

  /**
   * Add touch listener with press darken effect.
   * @param {cc.Node} btn - Button node
   * @param {Function} callback - On-press callback
   */
  function _addButtonListener(btn, callback) {
    var listener = cc.EventListener.create({
      event: cc.EventListener.TOUCH_ONE_BY_ONE,
      swallowTouches: true,
      onTouchBegan: function (touch) {
        var pos = btn.convertToNodeSpace(touch.getLocation());
        if (pos.x >= 0 && pos.x <= ACTION_BUTTON_WIDTH && pos.y >= 0 && pos.y <= ACTION_BUTTON_HEIGHT) {
          _showActionPressed(btn, true);
          return true;
        }
        return false;
      },
      onTouchEnded: function () {
        _showActionPressed(btn, false);
        if (btn._enabled) callback();
      },
      onTouchCancelled: function () {
        _showActionPressed(btn, false);
      }
    });
    cc.eventManager.addListener(listener, btn);
  }

  /** Show/hide pressed state: shift down and darken bg */
  function _showActionPressed(btn, pressed) {
    if (!btn._bg) return;
    btn.removeChild(btn._bg);
    if (pressed) {
      var dark = cc.color(
        Math.max(btn._fillColor.r - PRESS_DARKEN, 0),
        Math.max(btn._fillColor.g - PRESS_DARKEN, 0),
        Math.max(btn._fillColor.b - PRESS_DARKEN, 0)
      );
      var darkBorder = cc.color(
        Math.max(btn._borderColor.r - PRESS_DARKEN, 0),
        Math.max(btn._borderColor.g - PRESS_DARKEN, 0),
        Math.max(btn._borderColor.b - PRESS_DARKEN, 0)
      );
      btn._bg = _drawButtonBackground(dark, darkBorder);
      btn._bg.setPosition(btn._cx, btn._cy - 1);
    } else {
      btn._bg = _drawButtonBackground(btn._fillColor, btn._borderColor);
      btn._bg.setPosition(btn._cx, btn._cy);
    }
    btn.addChild(btn._bg, 1);
  }

  /**
   * Update the draw button enabled state.
   * @param {cc.Node} node - ActionButtons node
   * @param {boolean} enabled - New enabled state
   */
  function setDrawEnabled(node, enabled) {
    var drawBtn = node._drawBtn;
    if (!drawBtn || drawBtn._enabled === enabled) return;
    drawBtn._enabled = enabled;
    drawBtn.removeChild(drawBtn._bg);
    var color = enabled ? DRAW_ENABLED_COLOR : DISABLED_COLOR;
    var border = enabled ? DRAW_ENABLED_BORDER : DISABLED_BORDER;
    drawBtn._fillColor = color;
    drawBtn._borderColor = border;
    var newBg = _drawButtonBackground(color, border);
    newBg.setPosition(drawBtn._cx, drawBtn._cy);
    drawBtn.addChild(newBg, 1);
    drawBtn._bg = newBg;
  }

  /**
   * Remove event listeners from both child buttons.
   * @param {cc.Node} node - ActionButtons node
   */
  function destroy(node) {
    if (node._drawBtn) cc.eventManager.removeListeners(node._drawBtn);
    if (node._quitBtn) cc.eventManager.removeListeners(node._quitBtn);
  }

  /**
   * Show or hide the action buttons.
   * @param {cc.Node} node - ActionButtons node
   * @param {boolean} visible - Whether to show
   */
  function setVisible(node, visible) {
    node.setVisible(visible);
  }

  exports.ActionButtons = {
    create: createActionButtons,
    destroy: destroy,
    setDrawEnabled: setDrawEnabled,
    setVisible: setVisible
  };

})(typeof module !== 'undefined' ? module.exports : (window.LAMA = window.LAMA || {}));
