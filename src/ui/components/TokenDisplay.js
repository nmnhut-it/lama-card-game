/**
 * TokenDisplay - Shows a player's black and white token counts.
 * Black tokens show "10" value, white tokens show "1" value.
 * Renders styled circles with highlights and shadows.
 * Depends on: constants (Display).
 */
'use strict';

(function (exports) {

  var constants = typeof require !== 'undefined'
    ? require('../../constants')
    : window.LAMA;

  var Display = constants.Display;

  /* Token colors */
  var BLACK_TOKEN_FILL = cc.color(25, 25, 25);
  var BLACK_TOKEN_BORDER = cc.color(60, 60, 60);
  var BLACK_TOKEN_HIGHLIGHT = cc.color(80, 80, 80, 120);
  var WHITE_TOKEN_FILL = cc.color(235, 235, 230);
  var WHITE_TOKEN_BORDER = cc.color(140, 140, 130);
  var WHITE_TOKEN_HIGHLIGHT = cc.color(255, 255, 255, 160);
  var TOKEN_SHADOW_COLOR = cc.color(0, 0, 0, 60);

  /* Token text colors */
  var TOKEN_LABEL_WHITE = cc.color(255, 255, 255);
  var TOKEN_LABEL_DARK = cc.color(30, 30, 30);

  /* Token value labels */
  var BLACK_VALUE_TEXT = '10';
  var WHITE_VALUE_TEXT = '1';

  /* Token visual sizing */
  var TOKEN_RADIUS = Display.TOKEN_SIZE / 2 + 2;
  var TOKEN_FONT_SIZE = 14;
  var COUNT_FONT_SIZE = Display.FONT_SIZE_SMALL;
  var COUNT_OFFSET_Y = -20;
  var SHADOW_OFFSET = 1;
  var HIGHLIGHT_OFFSET = 3;
  var TOKEN_BORDER_WIDTH = 2;
  var INNER_GRADIENT_SHRINK = 2;
  var INNER_LIGHTEN = 20;
  var COUNT_SHADOW_OFFSET_X = 0.5;
  var COUNT_SHADOW_OFFSET_Y = -0.5;
  var COUNT_SHADOW_COLOR = cc.color(0, 0, 0, 120);

  /**
   * Create a token display node showing black and white token counts.
   * @param {Object} config - x, y, blackTokens, whiteTokens
   * @returns {cc.Node}
   */
  function createTokenDisplay(config) {
    var node = new cc.Node();
    node.setPosition(config.x, config.y);

    var halfSpacing = (TOKEN_RADIUS * 2 + Display.TOKEN_SPACING) / 2;

    var blackGroup = _createTokenGroup(
      -halfSpacing, 0, BLACK_TOKEN_FILL, BLACK_TOKEN_BORDER,
      BLACK_TOKEN_HIGHLIGHT, TOKEN_LABEL_WHITE,
      BLACK_VALUE_TEXT, config.blackTokens
    );
    node.addChild(blackGroup, Display.Z_TOKENS);

    var whiteGroup = _createTokenGroup(
      halfSpacing, 0, WHITE_TOKEN_FILL, WHITE_TOKEN_BORDER,
      WHITE_TOKEN_HIGHLIGHT, TOKEN_LABEL_DARK,
      WHITE_VALUE_TEXT, config.whiteTokens
    );
    node.addChild(whiteGroup, Display.Z_TOKENS);

    node._blackLabel = blackGroup._label;
    node._whiteLabel = whiteGroup._label;
    return node;
  }

  /**
   * Create one token circle with value and count labels.
   * @param {number} x - X offset
   * @param {number} y - Y offset
   * @param {cc.Color} fill - Circle fill color
   * @param {cc.Color} border - Circle border color
   * @param {cc.Color} highlight - Highlight color for shine
   * @param {cc.Color} textColor - Text color
   * @param {string} valueText - Value shown inside the token
   * @param {number} count - Token count shown below
   * @returns {cc.Node}
   */
  function _createTokenGroup(x, y, fill, border, highlight, textColor, valueText, count) {
    var group = new cc.Node();
    group.setPosition(x, y);

    _drawTokenCircle(group, fill, border, highlight);
    _addValueLabel(group, valueText, textColor);
    var countLabel = _addCountLabel(group, count, textColor);
    group._label = countLabel;

    return group;
  }

  /** Draw the token circle with shadow, inner gradient, highlight, and border */
  function _drawTokenCircle(group, fill, border, highlight) {
    var circle = new cc.DrawNode();
    /* Shadow */
    circle.drawDot(cc.p(SHADOW_OFFSET, -SHADOW_OFFSET), TOKEN_RADIUS, TOKEN_SHADOW_COLOR);
    /* Main circle */
    circle.drawDot(cc.p(0, 0), TOKEN_RADIUS, fill);
    /* Inner gradient circle (slightly lighter, smaller) for 3D effect */
    var innerFill = cc.color(
      Math.min(fill.r + INNER_LIGHTEN, 255),
      Math.min(fill.g + INNER_LIGHTEN, 255),
      Math.min(fill.b + INNER_LIGHTEN, 255)
    );
    circle.drawDot(cc.p(0, 0), TOKEN_RADIUS - INNER_GRADIENT_SHRINK, innerFill);
    /* Border stroke */
    circle.drawCircle(cc.p(0, 0), TOKEN_RADIUS, 0, 32, false, TOKEN_BORDER_WIDTH, border);
    /* Highlight dot (top-left shine), larger */
    circle.drawDot(cc.p(-HIGHLIGHT_OFFSET, HIGHLIGHT_OFFSET), TOKEN_RADIUS / 3, highlight);
    group.addChild(circle, 0);
  }

  /** Add the token value text inside the circle */
  function _addValueLabel(group, valueText, textColor) {
    var label = new cc.LabelTTF(valueText, 'Arial', TOKEN_FONT_SIZE);
    label.setColor(textColor);
    label.setPosition(0, 0);
    group.addChild(label, 1);
  }

  /** Add the count label with shadow below the token */
  function _addCountLabel(group, count, textColor) {
    var shadow = new cc.LabelTTF('x' + String(count), 'Arial', COUNT_FONT_SIZE);
    shadow.setColor(COUNT_SHADOW_COLOR);
    shadow.setPosition(COUNT_SHADOW_OFFSET_X, COUNT_OFFSET_Y + COUNT_SHADOW_OFFSET_Y);
    group.addChild(shadow, 1);

    var label = new cc.LabelTTF('x' + String(count), 'Arial', COUNT_FONT_SIZE);
    label.setColor(textColor);
    label.setPosition(0, COUNT_OFFSET_Y);
    group.addChild(label, 2);
    return label;
  }

  /**
   * Update token counts on an existing display.
   * @param {cc.Node} node - The token display node
   * @param {number} blackTokens - New black count
   * @param {number} whiteTokens - New white count
   */
  function updateCounts(node, blackTokens, whiteTokens) {
    if (node._blackLabel) {
      node._blackLabel.setString('x' + String(blackTokens));
    }
    if (node._whiteLabel) {
      node._whiteLabel.setString('x' + String(whiteTokens));
    }
  }

  exports.TokenDisplay = {
    create: createTokenDisplay,
    updateCounts: updateCounts
  };

})(typeof module !== 'undefined' ? module.exports : (window.LAMA = window.LAMA || {}));
