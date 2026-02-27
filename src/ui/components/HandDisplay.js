/**
 * HandDisplay - Renders a player's hand as a row of CardSprites.
 * Supports horizontal and vertical layouts, centered on a position.
 * Depends on: constants (Display), CardSprite.
 */
'use strict';

(function (exports) {

  var constants = typeof require !== 'undefined'
    ? require('../../constants')
    : window.LAMA;

  var Display = constants.Display;

  /** Orientation constants */
  var Orientation = Object.freeze({
    HORIZONTAL: 'horizontal',
    VERTICAL: 'vertical'
  });

  /**
   * Create a hand display node showing an array of cards.
   * @param {Object} config
   * @param {Card[]} config.cards - Cards to display
   * @param {number} config.x - Center X position
   * @param {number} config.y - Center Y position
   * @param {boolean} config.faceUp - Show face-up or face-down
   * @param {string} [config.orientation] - Orientation.HORIZONTAL or VERTICAL
   * @param {Function} [config.onCardTap] - Callback for card taps
   * @param {Card} [config.topCard] - Top discard card for highlighting playable cards
   * @returns {cc.Node}
   */
  function createHandDisplay(config) {
    var node = new cc.Node();
    var cards = config.cards || [];
    var orientation = config.orientation || Orientation.HORIZONTAL;
    var isHorizontal = (orientation === Orientation.HORIZONTAL);
    var cardScale = config.cardScale || 1;

    var sprites = _createCardSprites(cards, config.faceUp, config.onCardTap);
    _positionSprites(sprites, isHorizontal, cardScale, config.maxSpan);
    _highlightPlayableCards(sprites, cards, config.faceUp, config.topCard);

    for (var i = 0; i < sprites.length; i++) {
      if (cardScale !== 1) sprites[i].setScale(cardScale);
      node.addChild(sprites[i], Display.Z_CARDS);
    }

    node.setPosition(config.x, config.y);
    node._sprites = sprites;
    return node;
  }

  /**
   * Create CardSprite instances for each card.
   * @param {Card[]} cards - Card models
   * @param {boolean} faceUp - Show face-up
   * @param {Function} [onCardTap] - Tap callback
   * @returns {cc.Node[]}
   */
  function _createCardSprites(cards, faceUp, onCardTap) {
    var CardSpriteModule = window.LAMA.CardSprite;
    var sprites = [];
    for (var i = 0; i < cards.length; i++) {
      var sprite = CardSpriteModule.create(cards[i], faceUp, onCardTap);
      sprites.push(sprite);
    }
    return sprites;
  }

  /**
   * Position sprites in a line centered at (0,0).
   * @param {cc.Node[]} sprites - Card sprite nodes
   * @param {boolean} isHorizontal - Layout direction
   */
  /**
   * Position sprites in a line centered at (0,0).
   * When totalSpan exceeds maxSpan, cards overlap automatically.
   */
  function _positionSprites(sprites, isHorizontal, cardScale, maxSpan) {
    var count = sprites.length;
    if (count === 0) return;
    var scale = cardScale || 1;
    var cardSize = (isHorizontal ? Display.CARD_WIDTH : Display.CARD_HEIGHT) * scale;
    var spacing = Display.CARD_SPACING;
    var totalSpan = count * cardSize + (count - 1) * spacing;
    if (maxSpan && totalSpan > maxSpan && count > 1) {
      spacing = (maxSpan - count * cardSize) / (count - 1);
      totalSpan = maxSpan;
    }
    var startOffset = -totalSpan / 2 + cardSize / 2;
    for (var i = 0; i < count; i++) {
      var offset = startOffset + i * (cardSize + spacing);
      if (isHorizontal) {
        sprites[i].setPosition(offset, 0);
      } else {
        sprites[i].setPosition(0, -offset);
      }
    }
  }

  /**
   * Highlight cards that can be legally played on the top card.
   * @param {cc.Node[]} sprites - Card sprite nodes
   * @param {Card[]} cards - Card models
   * @param {boolean} faceUp - Only highlight if face-up
   * @param {Card} [topCard] - Top discard card
   */
  function _highlightPlayableCards(sprites, cards, faceUp, topCard) {
    if (!faceUp || !topCard) return;
    var CardSpriteModule = window.LAMA.CardSprite;
    for (var i = 0; i < cards.length; i++) {
      CardSpriteModule.setHighlight(sprites[i], cards[i].canPlayOn(topCard));
    }
  }

  exports.HandDisplay = {
    create: createHandDisplay,
    Orientation: Orientation
  };

})(typeof module !== 'undefined' ? module.exports : (window.LAMA = window.LAMA || {}));
