/**
 * PileDisplay - Renders draw pile with stacked card effect and discard pile.
 * Draw pile shows 2-3 offset shadow cards behind the top with a count badge.
 * Discard pile has a slight rotation for natural look.
 * Positions from screens.md: draw at (410,320), discard at (550,320).
 * Depends on: constants (Display), CardSprite.
 */
'use strict';

(function (exports) {

  var constants = typeof require !== 'undefined'
    ? require('../../constants')
    : window.LAMA;

  var Display = constants.Display;

  /* Pile positions from screens.md */
  var DRAW_PILE_X = 410;
  var DRAW_PILE_Y = 320;
  var DISCARD_PILE_X = 550;
  var DISCARD_PILE_Y = 320;

  /* Stack effect: offset for shadow cards behind draw pile */
  var STACK_OFFSETS = [
    { x: 3, y: 3 },
    { x: 6, y: 6 }
  ];
  var STACK_SHADOW_COLOR = cc.color(0, 0, 0, 50);

  /* Discard pile random scatter for natural look */
  var DISCARD_ROTATION_RANGE = 8;
  var DISCARD_OFFSET_RANGE = 4;
  var DISCARD_STACK_VISIBLE = 2;

  /* Count badge */
  var BADGE_RADIUS = 14;
  var BADGE_COLOR = cc.color(200, 60, 60);
  var BADGE_BORDER_COLOR = cc.color(160, 40, 40);
  var BADGE_TEXT_COLOR = cc.color(255, 255, 255);
  var BADGE_OFFSET_X = Display.CARD_WIDTH / 2 - 4;
  var BADGE_OFFSET_Y = Display.CARD_HEIGHT / 2 - 4;
  var BADGE_FONT_SIZE = 13;

  /**
   * Create the pile display node containing draw and discard piles.
   * @param {Object} config - drawCount, topCard
   * @returns {cc.Node}
   */
  function createPileDisplay(config) {
    var node = new cc.Node();

    var drawPile = _createDrawPile(config.drawCount);
    node.addChild(drawPile, Display.Z_CARDS);

    var discardPile = _createDiscardPile(config.topCard);
    node.addChild(discardPile, Display.Z_CARDS + 1);

    node._drawPile = drawPile;
    node._discardPile = discardPile;
    node._countBadgeLabel = drawPile._countBadgeLabel;
    /* Keep _countLabel for backward compatibility */
    node._countLabel = drawPile._countBadgeLabel;
    return node;
  }

  /**
   * Create the draw pile with stacked cards and a count badge.
   * @param {number} count - Remaining cards
   * @returns {cc.Node}
   */
  function _createDrawPile(count) {
    var wrapper = new cc.Node();
    _addStackShadows(wrapper);

    var CardSpriteModule = window.LAMA.CardSprite;
    var cardNode = CardSpriteModule.create(null, false, null);
    cardNode.setPosition(DRAW_PILE_X, DRAW_PILE_Y);
    wrapper.addChild(cardNode, STACK_OFFSETS.length);

    var badge = _createCountBadge(count);
    wrapper.addChild(badge, STACK_OFFSETS.length + 1);

    wrapper._countBadgeLabel = badge._label;
    return wrapper;
  }

  /** Add shadow card rectangles behind the top card for stack effect */
  function _addStackShadows(wrapper) {
    for (var i = 0; i < STACK_OFFSETS.length; i++) {
      var offset = STACK_OFFSETS[i];
      var shadow = new cc.DrawNode();
      var hw = Display.CARD_WIDTH / 2;
      var hh = Display.CARD_HEIGHT / 2;
      var verts = [
        cc.p(-hw, -hh), cc.p(hw, -hh),
        cc.p(hw, hh), cc.p(-hw, hh)
      ];
      shadow.drawPoly(verts, STACK_SHADOW_COLOR, 1, cc.color(0, 0, 0, 30));
      shadow.setPosition(DRAW_PILE_X + offset.x, DRAW_PILE_Y - offset.y);
      wrapper.addChild(shadow, i);
    }
  }

  /** Create a circular count badge positioned at top-right of draw pile */
  function _createCountBadge(count) {
    var badge = new cc.Node();
    badge.setPosition(DRAW_PILE_X + BADGE_OFFSET_X, DRAW_PILE_Y + BADGE_OFFSET_Y);

    var circle = new cc.DrawNode();
    circle.drawDot(cc.p(0, 0), BADGE_RADIUS, BADGE_COLOR);
    circle.drawCircle(cc.p(0, 0), BADGE_RADIUS, 0, 20, false, 2, BADGE_BORDER_COLOR);
    badge.addChild(circle, 0);

    var label = new cc.LabelTTF(String(count), 'Arial', BADGE_FONT_SIZE);
    label.setColor(BADGE_TEXT_COLOR);
    label.setPosition(0, 0);
    badge.addChild(label, 1);
    badge._label = label;

    return badge;
  }

  /** Random float in [-range, +range] for natural scatter */
  function _randScatter(range) {
    return (Math.random() * 2 - 1) * range;
  }

  /*
   * Cached scatter values so positions stay stable across UI rebuilds.
   * Under-cards use fixed scatter (generated once per game session).
   * Top card scatter is keyed by a counter that increments each time
   * a new card is played to the discard.
   */
  var _underScatter = null;
  var _topScatter = {};
  var _discardCount = 0;

  /** Generate and cache under-card scatter values (once per session) */
  function _getUnderScatter() {
    if (!_underScatter) {
      _underScatter = [];
      for (var i = 0; i < DISCARD_STACK_VISIBLE; i++) {
        _underScatter.push({
          ox: _randScatter(DISCARD_OFFSET_RANGE),
          oy: _randScatter(DISCARD_OFFSET_RANGE),
          rot: _randScatter(DISCARD_ROTATION_RANGE)
        });
      }
    }
    return _underScatter;
  }

  /** Get or create cached scatter for the current top card */
  function _getTopScatter() {
    if (!_topScatter[_discardCount]) {
      _topScatter[_discardCount] = {
        ox: _randScatter(DISCARD_OFFSET_RANGE),
        oy: _randScatter(DISCARD_OFFSET_RANGE),
        rot: _randScatter(DISCARD_ROTATION_RANGE)
      };
    }
    return _topScatter[_discardCount];
  }

  /**
   * Create the discard pile with scattered under-cards and top card.
   * Uses cached scatter values so positions stay stable across rebuilds.
   * @param {Card} topCard - Current top discard card
   * @returns {cc.Node}
   */
  function _createDiscardPile(topCard) {
    var CardSpriteModule = window.LAMA.CardSprite;
    var wrapper = new cc.Node();
    var us = _getUnderScatter();

    /* Add face-down under-cards for pile depth */
    for (var i = 0; i < DISCARD_STACK_VISIBLE; i++) {
      var under = CardSpriteModule.create(null, false, null);
      under.setPosition(DISCARD_PILE_X + us[i].ox, DISCARD_PILE_Y + us[i].oy);
      under.setRotation(us[i].rot);
      wrapper.addChild(under, i);
    }

    /* Top card face-up with cached scatter */
    var ts = _getTopScatter();
    var cardNode = CardSpriteModule.create(topCard, true, null);
    cardNode.setPosition(DISCARD_PILE_X + ts.ox, DISCARD_PILE_Y + ts.oy);
    cardNode.setRotation(ts.rot);
    wrapper.addChild(cardNode, DISCARD_STACK_VISIBLE);
    wrapper._cardNode = cardNode;
    return wrapper;
  }

  /**
   * Update the draw pile count badge.
   * @param {cc.Node} pileNode - The pile display node
   * @param {number} count - New remaining count
   */
  function updateDrawCount(pileNode, count) {
    if (pileNode._countBadgeLabel) {
      pileNode._countBadgeLabel.setString(String(count));
    } else if (pileNode._countLabel) {
      pileNode._countLabel.setString(String(count));
    }
  }

  /**
   * Advance the discard counter and return the new scatter values.
   * Called by animation code BEFORE the card lands, so the animation
   * target matches what _createDiscardPile will use on rebuild.
   * @returns {{ ox: number, oy: number, rot: number }}
   */
  function advanceScatter() {
    _discardCount++;
    return _getTopScatter();
  }

  /**
   * Replace the discard pile top card using current cached scatter.
   * @param {cc.Node} pileNode - The pile display node
   * @param {Card} topCard - New top card
   */
  function updateDiscardTop(pileNode, topCard) {
    var dw = pileNode._discardPile;
    if (dw._cardNode) {
      dw.removeChild(dw._cardNode);
    }
    var ts = _getTopScatter();
    var CardSpriteModule = window.LAMA.CardSprite;
    var newCard = CardSpriteModule.create(topCard, true, null);
    newCard.setPosition(DISCARD_PILE_X + ts.ox, DISCARD_PILE_Y + ts.oy);
    newCard.setRotation(ts.rot);
    dw.addChild(newCard, DISCARD_STACK_VISIBLE);
    dw._cardNode = newCard;
  }

  /** Reset scatter cache when a new round starts */
  function resetScatter() {
    _underScatter = null;
    _topScatter = {};
    _discardCount = 0;
  }

  exports.PileDisplay = {
    create: createPileDisplay,
    updateDrawCount: updateDrawCount,
    updateDiscardTop: updateDiscardTop,
    advanceScatter: advanceScatter,
    resetScatter: resetScatter
  };

})(typeof module !== 'undefined' ? module.exports : (window.LAMA = window.LAMA || {}));
