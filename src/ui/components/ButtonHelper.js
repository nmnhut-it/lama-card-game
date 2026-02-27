/**
 * ButtonHelper - Shared utility for creating interactive buttons.
 * Renders rounded-appearance buttons with shadow and text outline.
 * Anchor (0.5, 0.5) centers the node at position; children are placed
 * at (w/2, h/2) to account for the content-size coordinate offset.
 * Depends on: constants (Display).
 */
'use strict';

(function (exports) {

  var constants = typeof require !== 'undefined'
    ? require('../../constants')
    : window.LAMA;

  var Display = constants.Display;

  /* Default button colors */
  var DEFAULT_BUTTON_COLOR = cc.color(50, 120, 190);
  var DEFAULT_BORDER_COLOR = cc.color(35, 90, 155);
  var DEFAULT_TEXT_COLOR = cc.color(255, 255, 255);
  var BUTTON_SHADOW_COLOR = cc.color(0, 0, 0, 80);
  var TEXT_SHADOW_COLOR = cc.color(0, 0, 0, 100);

  /* Corner offset for rounded appearance */
  var CORNER_OFFSET = 8;

  /* Shadow offsets */
  var DROP_SHADOW_OFFSET_X = 2;
  var DROP_SHADOW_OFFSET_Y = -3;
  var TEXT_SHADOW_OFFSET_X = 1;
  var TEXT_SHADOW_OFFSET_Y = -1;
  var PRESSED_OFFSET_Y = -1;

  /* 2-tone gradient: top half lighter by this amount */
  var GRADIENT_LIGHTEN = 15;

  /* Press darken: subtract this from RGB on touch */
  var PRESS_DARKEN = 30;

  /**
   * Build rounded-rect vertices (8-point chamfered polygon).
   * @param {number} hw - Half width
   * @param {number} hh - Half height
   * @param {number} c - Corner offset
   * @returns {Array} Vertex array
   */
  function _roundedRectVerts(hw, hh, c) {
    return [
      cc.p(-hw + c, -hh), cc.p(hw - c, -hh),
      cc.p(hw, -hh + c), cc.p(hw, hh - c),
      cc.p(hw - c, hh), cc.p(-hw + c, hh),
      cc.p(-hw, hh - c), cc.p(-hw, -hh + c)
    ];
  }

  /**
   * Create a button node with rounded background, shadow, and text.
   * Anchor (0.5, 0.5) so the node is centered at position.
   * All children placed at content center (w/2, h/2).
   * @param {string} label - Button text
   * @param {cc.Point} position - {x, y} center position
   * @param {Function} callback - Invoked on tap
   * @param {Object} [options] - Optional overrides (width, height, color, etc.)
   * @returns {cc.Node}
   */
  function createButton(label, position, callback, options) {
    var opts = options || {};
    var w = opts.width || Display.BUTTON_WIDTH;
    var h = opts.height || Display.BUTTON_HEIGHT;
    var color = opts.color || DEFAULT_BUTTON_COLOR;
    var borderColor = opts.borderColor || DEFAULT_BORDER_COLOR;
    var textColor = opts.textColor || DEFAULT_TEXT_COLOR;
    var cx = w / 2;
    var cy = h / 2;

    var btn = new cc.Node();
    btn.setPosition(position.x, position.y);
    btn.setContentSize(w, h);
    btn.setAnchorPoint(0.5, 0.5);

    _addButtonShadow(btn, w, h, cx, cy);
    var bg = _drawBackground(w, h, color, borderColor);
    bg.setPosition(cx, cy);
    btn.addChild(bg, 1);
    btn._bg = bg;
    btn._cx = cx;
    btn._cy = cy;

    _addTextWithShadow(btn, label, textColor, cx, cy);

    btn._color = color;
    btn._borderColor = borderColor;
    btn._w = w;
    btn._h = h;
    addListener(btn, w, h, callback);

    btn.onExitTransitionDidStart = function () {
      destroy(btn);
    };
    return btn;
  }

  /** Add a drop shadow behind the button */
  function _addButtonShadow(btn, w, h, cx, cy) {
    var shadow = new cc.DrawNode();
    var hw = w / 2;
    var hh = h / 2;
    var verts = _roundedRectVerts(hw, hh, CORNER_OFFSET);
    shadow.drawPoly(verts, BUTTON_SHADOW_COLOR, 0, BUTTON_SHADOW_COLOR);
    shadow.setPosition(cx + DROP_SHADOW_OFFSET_X, cy + DROP_SHADOW_OFFSET_Y);
    btn.addChild(shadow, 0);
  }

  /**
   * Draw the button background with rounded corners and 2-tone gradient.
   * Top half is slightly lighter for a subtle 3D effect.
   * @returns {cc.DrawNode}
   */
  function _drawBackground(w, h, color, borderColor) {
    var bg = new cc.DrawNode();
    var hw = w / 2;
    var hh = h / 2;
    var verts = _roundedRectVerts(hw, hh, CORNER_OFFSET);
    bg.drawPoly(verts, color, 2, borderColor);
    /* Top-half lighter overlay for gradient effect */
    var lighter = cc.color(
      Math.min(color.r + GRADIENT_LIGHTEN, 255),
      Math.min(color.g + GRADIENT_LIGHTEN, 255),
      Math.min(color.b + GRADIENT_LIGHTEN, 255)
    );
    bg.drawPoly(
      [cc.p(-hw + CORNER_OFFSET, 0), cc.p(hw - CORNER_OFFSET, 0),
       cc.p(hw, CORNER_OFFSET), cc.p(hw, hh - CORNER_OFFSET),
       cc.p(hw - CORNER_OFFSET, hh), cc.p(-hw + CORNER_OFFSET, hh),
       cc.p(-hw, hh - CORNER_OFFSET), cc.p(-hw, CORNER_OFFSET)],
      lighter, 0, lighter
    );
    return bg;
  }

  /** Add text with a dark shadow offset for readability */
  function _addTextWithShadow(btn, label, textColor, cx, cy) {
    var shadow = new cc.LabelTTF(label, 'Arial', Display.FONT_SIZE_BODY);
    shadow.setColor(TEXT_SHADOW_COLOR);
    shadow.setPosition(cx + TEXT_SHADOW_OFFSET_X, cy + TEXT_SHADOW_OFFSET_Y);
    btn.addChild(shadow, 2);

    var textLabel = new cc.LabelTTF(label, 'Arial', Display.FONT_SIZE_BODY);
    textLabel.setColor(textColor);
    textLabel.setPosition(cx, cy);
    btn.addChild(textLabel, 3);
  }

  /**
   * Attach a touch listener with hit-test to a button node.
   * With anchor(0.5,0.5), local (0,0) = bottom-left of content,
   * so hit area is [0,w] x [0,h].
   */
  function addListener(btn, w, h, callback) {
    var listener = cc.EventListener.create({
      event: cc.EventListener.TOUCH_ONE_BY_ONE,
      swallowTouches: true,
      onTouchBegan: function (touch) {
        var pos = btn.convertToNodeSpace(touch.getLocation());
        if (pos.x >= 0 && pos.x <= w && pos.y >= 0 && pos.y <= h) {
          _showPressed(btn, true);
          return true;
        }
        return false;
      },
      onTouchEnded: function () {
        _showPressed(btn, false);
        callback();
      },
      onTouchCancelled: function () {
        _showPressed(btn, false);
      }
    });
    cc.eventManager.addListener(listener, btn);
  }

  /**
   * Remove all event listeners from a button node.
   * @param {cc.Node} btn - The button node
   */
  function destroy(btn) {
    cc.eventManager.removeListeners(btn);
  }

  /** Visual pressed state: shift down and darken background */
  function _showPressed(btn, pressed) {
    if (!btn._bg) return;
    if (pressed) {
      btn._bg.setPosition(btn._cx, btn._cy + PRESSED_OFFSET_Y);
      _redrawBgDarkened(btn);
    } else {
      btn._bg.setPosition(btn._cx, btn._cy);
      _redrawBgNormal(btn);
    }
  }

  /** Redraw button bg with darkened colors for press feedback */
  function _redrawBgDarkened(btn) {
    if (!btn._color || !btn._w) return;
    var dark = cc.color(
      Math.max(btn._color.r - PRESS_DARKEN, 0),
      Math.max(btn._color.g - PRESS_DARKEN, 0),
      Math.max(btn._color.b - PRESS_DARKEN, 0)
    );
    var darkBorder = cc.color(
      Math.max(btn._borderColor.r - PRESS_DARKEN, 0),
      Math.max(btn._borderColor.g - PRESS_DARKEN, 0),
      Math.max(btn._borderColor.b - PRESS_DARKEN, 0)
    );
    btn.removeChild(btn._bg);
    btn._bg = _drawBackground(btn._w, btn._h, dark, darkBorder);
    btn._bg.setPosition(btn._cx, btn._cy + PRESSED_OFFSET_Y);
    btn.addChild(btn._bg, 1);
  }

  /** Redraw button bg with normal colors on release */
  function _redrawBgNormal(btn) {
    if (!btn._color || !btn._w) return;
    btn.removeChild(btn._bg);
    btn._bg = _drawBackground(btn._w, btn._h, btn._color, btn._borderColor);
    btn._bg.setPosition(btn._cx, btn._cy);
    btn.addChild(btn._bg, 1);
  }

  exports.ButtonHelper = {
    createButton: createButton,
    addListener: addListener,
    destroy: destroy
  };

})(typeof module !== 'undefined' ? module.exports : (window.LAMA = window.LAMA || {}));
