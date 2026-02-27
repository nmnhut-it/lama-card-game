/**
 * CardSprite - Visual component for a single card.
 * Renders card with rounded-corner effect, patterned back,
 * and golden glow highlight for playable cards.
 * Depends on: constants (Display, CardValue).
 */
'use strict';

(function (exports) {

  var constants = typeof require !== 'undefined'
    ? require('../../constants')
    : window.LAMA;

  var Display = constants.Display;
  var CardValue = constants.CardValue;

  /* Face-up card colors */
  var CARD_BG_COLOR = cc.color(255, 252, 240);
  var CARD_BORDER_COLOR = cc.color(160, 140, 120);
  var CARD_SHADOW_COLOR = cc.color(0, 0, 0, 60);

  /* Face-up gold top-edge highlight */
  var CARD_TOP_HIGHLIGHT_COLOR = cc.color(255, 220, 100, 80);

  /* Card value text shadow */
  var VALUE_TEXT_SHADOW_COLOR = cc.color(0, 0, 0, 120);
  var VALUE_SHADOW_OFFSET_X = 1;
  var VALUE_SHADOW_OFFSET_Y = -1;

  /* Face-down card colors */
  var CARD_BACK_PRIMARY = cc.color(28, 60, 120);
  var CARD_BACK_SECONDARY = cc.color(55, 100, 165);
  var CARD_BACK_BORDER = cc.color(30, 60, 110);
  var CARD_BACK_PATTERN = cc.color(60, 110, 180, 100);

  /* Face-down specular highlight (top-left shine) */
  var CARD_BACK_SPECULAR_COLOR = cc.color(255, 255, 255, 80);
  var SPECULAR_OFFSET_X = -12;
  var SPECULAR_OFFSET_Y = 18;
  var SPECULAR_RADIUS = 6;

  /* Highlight (playable card glow) */
  var HIGHLIGHT_GLOW_OUTER = cc.color(255, 200, 0, 80);
  var HIGHLIGHT_GLOW_MID = cc.color(255, 215, 0, 140);
  var HIGHLIGHT_GLOW_INNER = cc.color(255, 225, 50, 220);

  /* Card value text colors */
  var LLAMA_TEXT_COLOR = cc.color(190, 40, 40);
  var NUMBER_TEXT_COLOR = cc.color(25, 50, 100);

  /* Corner radius approximation offset */
  var CORNER_OFFSET = 6;

  /* Pattern line spacing */
  var PATTERN_LINE_STEP = 12;
  var PATTERN_LINE_WIDTH = 0.5;
  var PATTERN_INSET = 6;

  /**
   * Create a card sprite node.
   * @param {Card} card - The card model (or null for face-down)
   * @param {boolean} faceUp - Whether to show the card face
   * @param {Function} [onTap] - Callback when tapped: onTap(card)
   * @returns {cc.Node} The card sprite node
   */
  function createCardSprite(card, faceUp, onTap) {
    var node = new cc.Node();
    node.setContentSize(Display.CARD_WIDTH, Display.CARD_HEIGHT);
    node.setAnchorPoint(0.5, 0.5);
    var cx = Display.CARD_WIDTH / 2;
    var cy = Display.CARD_HEIGHT / 2;

    _addCardShadow(node, cx, cy);
    var bg = faceUp ? _drawFaceUpBackground() : _drawFaceDownBackground();
    bg.setPosition(cx, cy);
    node.addChild(bg, 1);

    if (faceUp && card) {
      var label = _createValueLabel(card);
      label.setPosition(cx, cy);
      node.addChild(label, 2);
    }

    node._cardRef = card;
    node._highlighted = false;
    node._cx = cx;
    node._cy = cy;

    if (onTap && faceUp) {
      _addTouchListener(node, onTap);
    }

    node.onExitTransitionDidStart = function () {
      destroy(node);
    };
    return node;
  }

  /**
   * Build rounded-rect vertices (8-point chamfered polygon).
   * @param {number} hw - Half width
   * @param {number} hh - Half height
   * @param {number} c - Corner offset
   * @returns {Array} Array of cc.p vertices
   */
  function _roundedRectVerts(hw, hh, c) {
    return [
      cc.p(-hw + c, -hh), cc.p(hw - c, -hh),
      cc.p(hw, -hh + c), cc.p(hw, hh - c),
      cc.p(hw - c, hh), cc.p(-hw + c, hh),
      cc.p(-hw, hh - c), cc.p(-hw, -hh + c)
    ];
  }

  /** Add a drop-shadow behind the card */
  function _addCardShadow(node, cx, cy) {
    var draw = new cc.DrawNode();
    var hw = Display.CARD_WIDTH / 2;
    var hh = Display.CARD_HEIGHT / 2;
    var verts = _roundedRectVerts(hw, hh, CORNER_OFFSET);
    draw.drawPoly(verts, CARD_SHADOW_COLOR, 0, CARD_SHADOW_COLOR);
    draw.setPosition(cx + 2, cy - 3);
    node.addChild(draw, 0);
  }

  /** Draw a face-up card: cream bg with border and gold top-edge highlight */
  function _drawFaceUpBackground() {
    var draw = new cc.DrawNode();
    var hw = Display.CARD_WIDTH / 2;
    var hh = Display.CARD_HEIGHT / 2;
    var verts = _roundedRectVerts(hw, hh, CORNER_OFFSET);
    draw.drawPoly(verts, CARD_BG_COLOR, 2, CARD_BORDER_COLOR);
    /* Gold highlight on top edge */
    draw.drawSegment(
      cc.p(-hw + CORNER_OFFSET, hh),
      cc.p(hw - CORNER_OFFSET, hh),
      1, CARD_TOP_HIGHLIGHT_COLOR
    );
    return draw;
  }

  /** Draw a face-down card with blue background, pattern, and specular highlight */
  function _drawFaceDownBackground() {
    var draw = new cc.DrawNode();
    var hw = Display.CARD_WIDTH / 2;
    var hh = Display.CARD_HEIGHT / 2;
    var verts = _roundedRectVerts(hw, hh, CORNER_OFFSET);
    draw.drawPoly(verts, CARD_BACK_PRIMARY, 2, CARD_BACK_BORDER);
    _addBackPattern(draw, hw, hh);
    /* Specular highlight dot (top-left shine) */
    draw.drawDot(cc.p(SPECULAR_OFFSET_X, SPECULAR_OFFSET_Y), SPECULAR_RADIUS, CARD_BACK_SPECULAR_COLOR);
    return draw;
  }

  /** Add a cross-hatch pattern to the card back */
  function _addBackPattern(draw, hw, hh) {
    var innerHw = hw - PATTERN_INSET;
    var innerHh = hh - PATTERN_INSET;
    var innerCorner = Math.max(CORNER_OFFSET - 2, 2);
    var innerVerts = _roundedRectVerts(innerHw, innerHh, innerCorner);
    draw.drawPoly(innerVerts, CARD_BACK_SECONDARY, 1, CARD_BACK_PATTERN);
    var xExtent = innerHw - 4;
    for (var i = -hh + PATTERN_LINE_STEP; i < hh; i += PATTERN_LINE_STEP) {
      draw.drawSegment(cc.p(-xExtent, i), cc.p(xExtent, i), PATTERN_LINE_WIDTH, CARD_BACK_PATTERN);
    }
  }

  /**
   * Create the value label with text shadow for a face-up card.
   * Returns a wrapper node containing shadow + main label.
   * @param {Card} card - The card model
   * @returns {cc.Node}
   */
  function _createValueLabel(card) {
    var value = card.getValue();
    var text = (value === CardValue.LLAMA) ? 'L' : String(value);
    var color = (value === CardValue.LLAMA) ? LLAMA_TEXT_COLOR : NUMBER_TEXT_COLOR;
    var fontSize = Display.FONT_SIZE_HEADING + 4;
    var wrapper = new cc.Node();

    var shadow = new cc.LabelTTF(text, 'Arial', fontSize);
    shadow.setColor(VALUE_TEXT_SHADOW_COLOR);
    shadow.setPosition(VALUE_SHADOW_OFFSET_X, VALUE_SHADOW_OFFSET_Y);
    wrapper.addChild(shadow, 0);

    var label = new cc.LabelTTF(text, 'Arial', fontSize);
    label.setColor(color);
    label.setPosition(0, 0);
    wrapper.addChild(label, 1);

    return wrapper;
  }

  /**
   * Add a touch listener that fires onTap with the card reference.
   * @param {cc.Node} node - The card node
   * @param {Function} onTap - Callback
   */
  function _addTouchListener(node, onTap) {
    var listener = cc.EventListener.create({
      event: cc.EventListener.TOUCH_ONE_BY_ONE,
      swallowTouches: true,
      onTouchBegan: function (touch) {
        var pos = node.convertToNodeSpace(touch.getLocation());
        var size = node.getContentSize();
        return (pos.x >= 0 && pos.x <= size.width && pos.y >= 0 && pos.y <= size.height);
      },
      onTouchEnded: function () {
        if (node._cardRef) {
          onTap(node._cardRef);
        }
      }
    });
    cc.eventManager.addListener(listener, node);
  }

  /**
   * Remove all event listeners from a card sprite node.
   * Should be called when the node is removed from the scene.
   * @param {cc.Node} node - The card sprite node
   */
  function destroy(node) {
    cc.eventManager.removeListeners(node);
  }

  /**
   * Toggle highlight border on a card sprite.
   * Uses layered golden glow for a prominent effect.
   * @param {cc.Node} node - The card sprite node
   * @param {boolean} enabled - Whether to show highlight
   */
  function setHighlight(node, enabled) {
    if (node._highlighted === enabled) return;
    node._highlighted = enabled;
    if (node._highlightDraw) {
      node.removeChild(node._highlightDraw);
      node._highlightDraw = null;
    }
    if (enabled) {
      _addHighlightGlow(node);
    }
  }

  /** Add layered golden glow highlight */
  function _addHighlightGlow(node) {
    var draw = new cc.DrawNode();
    var hw = Display.CARD_WIDTH / 2;
    var hh = Display.CARD_HEIGHT / 2;
    var layers = [
      { offset: 5, color: HIGHLIGHT_GLOW_OUTER, width: 3 },
      { offset: 3, color: HIGHLIGHT_GLOW_MID, width: 2 },
      { offset: 1, color: HIGHLIGHT_GLOW_INNER, width: 2 }
    ];
    for (var i = 0; i < layers.length; i++) {
      var cfg = layers[i];
      var verts = _roundedRectVerts(hw + cfg.offset, hh + cfg.offset, CORNER_OFFSET);
      draw.drawPoly(verts, cc.color(0, 0, 0, 0), cfg.width, cfg.color);
    }
    draw.setPosition(node._cx, node._cy);
    node.addChild(draw, 3);
    node._highlightDraw = draw;
  }

  /**
   * Swap a card node's visual from face-down to face-up (or vice versa).
   * Removes old children and rebuilds. Used at flip animation midpoint.
   * @param {cc.Node} node - The card sprite node
   * @param {Card} card - Card model (null for face-down)
   * @param {boolean} faceUp - New face state
   */
  function swapFace(node, card, faceUp) {
    node.removeAllChildren();
    var cx = node._cx;
    var cy = node._cy;
    _addCardShadow(node, cx, cy);
    var bg = faceUp ? _drawFaceUpBackground() : _drawFaceDownBackground();
    bg.setPosition(cx, cy);
    node.addChild(bg, 1);
    if (faceUp && card) {
      var label = _createValueLabel(card);
      label.setPosition(cx, cy);
      node.addChild(label, 2);
    }
    if (node._highlightDraw) {
      node._highlightDraw = null;
      node._highlighted = false;
    }
  }

  exports.CardSprite = {
    create: createCardSprite,
    destroy: destroy,
    setHighlight: setHighlight,
    swapFace: swapFace
  };

})(typeof module !== 'undefined' ? module.exports : (window.LAMA = window.LAMA || {}));
