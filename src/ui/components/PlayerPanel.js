/**
 * PlayerPanel - Composite component for one player's area.
 * Renders name, hand, tokens, and status with a styled background panel.
 * Active player gets golden glow border; quit players are dimmed.
 * Positions per screens.md for each player slot (bottom/left/top/right).
 * Depends on: constants (Display, PLAYER_COUNT), HandDisplay, TokenDisplay.
 */
'use strict';

(function (exports) {

  var constants = typeof require !== 'undefined'
    ? require('../../constants')
    : window.LAMA;

  var Display = constants.Display;

  /* Name label colors */
  var CURRENT_PLAYER_COLOR = cc.color(255, 215, 0);
  var DEFAULT_NAME_COLOR = cc.color(255, 255, 255);
  var NAME_SHADOW_COLOR = cc.color(0, 0, 0, 160);

  /* Panel background colors */
  var PANEL_BG_COLOR = cc.color(0, 0, 0, 60);
  var PANEL_BORDER_COLOR = cc.color(255, 255, 255, 30);
  var ACTIVE_GLOW_COLOR = cc.color(255, 215, 0, 180);
  var QUIT_OVERLAY_COLOR = cc.color(0, 0, 0, 80);
  var PANEL_HIGHLIGHT_COLOR = cc.color(255, 255, 255, 20);

  /* Status label colors */
  var STATUS_ACTIVE_COLOR = cc.color(200, 200, 200);
  var STATUS_QUIT_COLOR = cc.color(255, 80, 80);

  /* Panel sizing per slot; padding around content */
  var PANEL_PADDING = 10;
  var PANEL_CORNER = 6;

  /* Card scaling and max hand span per slot */
  var OPPONENT_CARD_SCALE = 0.5;
  var SIDE_HAND_MAX_SPAN = 200;
  var TOP_HAND_MAX_SPAN = 500;
  var BOTTOM_HAND_MAX_SPAN = 400;

  /* Player layout configs, indexed by player slot 0-3.
   * All opponents use OPPONENT_CARD_SCALE (0.5) for uniform card size.
   * Side panels (1,3): name→cards→tokens→status stacked vertically.
   * Top panel (2): name/tokens top row, cards/status bottom row. */
  var PLAYER_LAYOUTS = Object.freeze([
    /* Player 0 (Bottom — human, cards fan when many) */
    {
      nameX: 480, nameY: 148, handX: 480, handY: 80,
      tokenX: 780, tokenY: 80, statusX: 480, statusY: 20,
      orientation: 'horizontal', nameRotation: 0,
      panelX: 480, panelY: 85, panelW: 700, panelH: 160,
      cardScale: 1, maxSpan: BOTTOM_HAND_MAX_SPAN
    },
    /* Player 1 (Left — vertical, tokens centered on panel X) */
    {
      nameX: 55, nameY: 535, handX: 70, handY: 360,
      tokenX: 70, tokenY: 236, statusX: 70, statusY: 182,
      orientation: 'vertical', nameRotation: 90,
      panelX: 70, panelY: 380, panelW: 100, panelH: 420,
      cardScale: OPPONENT_CARD_SCALE, maxSpan: SIDE_HAND_MAX_SPAN
    },
    /* Player 2 (Top — name/tokens top row, cards/status bottom row) */
    {
      nameX: 480, nameY: 610, handX: 480, handY: 555,
      tokenX: 770, tokenY: 610, statusX: 770, statusY: 548,
      orientation: 'horizontal', nameRotation: 0,
      panelX: 480, panelY: 578, panelW: 700, panelH: 115,
      cardScale: OPPONENT_CARD_SCALE, maxSpan: TOP_HAND_MAX_SPAN
    },
    /* Player 3 (Right — vertical, tokens centered on panel X) */
    {
      nameX: 905, nameY: 535, handX: 890, handY: 360,
      tokenX: 890, tokenY: 236, statusX: 890, statusY: 182,
      orientation: 'vertical', nameRotation: -90,
      panelX: 890, panelY: 380, panelW: 100, panelH: 420,
      cardScale: OPPONENT_CARD_SCALE, maxSpan: SIDE_HAND_MAX_SPAN
    }
  ]);

  /**
   * Create a player panel node with styled background.
   * @param {Object} config - See createPlayerPanel for fields
   * @returns {cc.Node}
   */
  function createPlayerPanel(config) {
    var layout = PLAYER_LAYOUTS[config.playerIndex];
    var node = new cc.Node();

    var panelBg = _createPanelBackground(layout, config);
    node.addChild(panelBg, Display.Z_BACKGROUND + 1);

    var nameLabel = _createNameLabel(layout, config);
    node.addChild(nameLabel, Display.Z_UI);

    var hand = _createHand(layout, config);
    node.addChild(hand, Display.Z_CARDS);

    var tokens = _createTokens(layout, config);
    node.addChild(tokens, Display.Z_TOKENS);

    var status = _createStatusLabel(layout, config);
    node.addChild(status, Display.Z_UI);

    node._nameLabel = nameLabel;
    node._hand = hand;
    node._tokens = tokens;
    node._statusLabel = status;
    return node;
  }

  /** Create a semi-transparent background panel with border highlight */
  function _createPanelBackground(layout, config) {
    var draw = new cc.DrawNode();
    var hw = layout.panelW / 2;
    var hh = layout.panelH / 2;
    var verts = _chamferedVerts(hw, hh, PANEL_CORNER);
    draw.drawPoly(verts, PANEL_BG_COLOR, 1, PANEL_BORDER_COLOR);
    /* Subtle inner border highlight for depth */
    var innerVerts = _chamferedVerts(hw - 1, hh - 1, PANEL_CORNER);
    draw.drawPoly(innerVerts, cc.color(0, 0, 0, 0), 1, PANEL_HIGHLIGHT_COLOR);
    if (config.isCurrent) {
      _addActiveGlow(draw, hw, hh);
    }
    if (!config.isActive) {
      draw.drawPoly(verts, QUIT_OVERLAY_COLOR, 0, QUIT_OVERLAY_COLOR);
    }
    draw.setPosition(layout.panelX, layout.panelY);
    return draw;
  }

  /** Add golden glow border for the active (current turn) player */
  function _addActiveGlow(draw, hw, hh) {
    var glowVerts = _chamferedVerts(hw + 2, hh + 2, PANEL_CORNER);
    draw.drawPoly(glowVerts, cc.color(0, 0, 0, 0), 2, ACTIVE_GLOW_COLOR);
  }

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
   * Create the player name label with dark shadow for readability.
   * @param {Object} layout - Position config
   * @param {Object} config - Player config
   * @returns {cc.Node}
   */
  function _createNameLabel(layout, config) {
    var wrapper = new cc.Node();
    wrapper.setPosition(layout.nameX, layout.nameY);
    wrapper.setRotation(layout.nameRotation);

    var shadow = new cc.LabelTTF(config.playerName, 'Arial', Display.FONT_SIZE_BODY);
    shadow.setColor(NAME_SHADOW_COLOR);
    shadow.setPosition(1, -1);
    wrapper.addChild(shadow, 0);

    var label = new cc.LabelTTF(config.playerName, 'Arial', Display.FONT_SIZE_BODY);
    label.setColor(config.isCurrent ? CURRENT_PLAYER_COLOR : DEFAULT_NAME_COLOR);
    label.setPosition(0, 0);
    wrapper.addChild(label, 1);

    return wrapper;
  }

  /**
   * Create the hand display for this player.
   * @param {Object} layout - Position config
   * @param {Object} config - Player config
   * @returns {cc.Node}
   */
  function _createHand(layout, config) {
    var HandDisplay = window.LAMA.HandDisplay;
    return HandDisplay.create({
      cards: config.cards,
      x: layout.handX,
      y: layout.handY,
      faceUp: config.faceUp,
      orientation: layout.orientation,
      onCardTap: config.onCardTap,
      topCard: config.topCard,
      cardScale: layout.cardScale,
      maxSpan: layout.maxSpan
    });
  }

  /**
   * Create the token display for this player.
   * @param {Object} layout - Position config
   * @param {Object} config - Player config
   * @returns {cc.Node}
   */
  function _createTokens(layout, config) {
    var TokenDisplayModule = window.LAMA.TokenDisplay;
    return TokenDisplayModule.create({
      x: layout.tokenX,
      y: layout.tokenY,
      blackTokens: config.blackTokens,
      whiteTokens: config.whiteTokens
    });
  }

  /**
   * Create the status label (Active/Quit or card count).
   * @param {Object} layout - Position config
   * @param {Object} config - Player config
   * @returns {cc.LabelTTF}
   */
  function _createStatusLabel(layout, config) {
    var text = config.isActive ? '' : 'Quit';
    if (!config.faceUp && config.isActive) {
      text = config.cards.length + ' cards';
    }
    var label = new cc.LabelTTF(text, 'Arial', Display.FONT_SIZE_SMALL);
    label.setPosition(layout.statusX, layout.statusY);
    label.setColor(config.isActive ? STATUS_ACTIVE_COLOR : STATUS_QUIT_COLOR);
    return label;
  }

  exports.PlayerPanel = {
    create: createPlayerPanel,
    PLAYER_LAYOUTS: PLAYER_LAYOUTS
  };

})(typeof module !== 'undefined' ? module.exports : (window.LAMA = window.LAMA || {}));
