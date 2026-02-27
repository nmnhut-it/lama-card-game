/**
 * GameplayScene - Main gameplay interface for a round.
 * Creates/manages Game + Round, renders 4 PlayerPanels, PileDisplay,
 * ActionButtons. Handles human input, AI turns, and round-end transition.
 * Includes animated card play, draw, quit, AI thinking, turn transitions,
 * token awards, and playable-card highlighting.
 * Depends on: constants, Game, AiPlayer, all UI components, AnimationHelper,
 *   SceneManager.
 */
'use strict';

(function (exports) {

  var constants = typeof require !== 'undefined'
    ? require('../../constants')
    : window.LAMA;

  var Display = constants.Display;
  var GameMode = constants.GameMode;
  var TurnAction = constants.TurnAction;
  var PLAYER_COUNT = constants.PLAYER_COUNT;

  /* Pile positions (must match PileDisplay) */
  var DRAW_PILE_X = 410;
  var DRAW_PILE_Y = 320;
  var DISCARD_PILE_X = 550;
  var DISCARD_PILE_Y = 320;

  /* Turn indicator from screens.md */
  var TURN_INDICATOR_X = 480;
  var TURN_INDICATOR_Y = 400;

  /* AI think delay in seconds */
  var AI_THINK_DELAY_SEC = 0.8;

  /* Player name prefix */
  var PLAYER_NAME_PREFIX = 'Player ';

  /* Background colors (felt table with vignette) */
  var BG_CENTER_COLOR = cc.color(45, 125, 55);
  var BG_EDGE_COLOR = cc.color(25, 75, 30);
  var BG_VIGNETTE_COLOR = cc.color(10, 40, 12, 80);

  /* Table felt insets — sized to clear player panel edges with ~10px gap.
   * Left/Right: panel inner edge at X=120/840, so 130px inset.
   * Bottom: panel top edge at Y=165, so 175px inset.
   * Top: panel bottom edge at Y≈521, so 640-515=125px inset. */
  var TABLE_INSET_LEFT = 130;
  var TABLE_INSET_RIGHT = 130;
  var TABLE_INSET_BOTTOM = 175;
  var TABLE_INSET_TOP = 125;

  /* Turn indicator colors */
  var TURN_TEXT_COLOR = cc.color(255, 255, 255);
  var TURN_BG_COLOR = cc.color(0, 0, 0, 100);
  var TURN_BORDER_COLOR = cc.color(255, 215, 0, 120);
  var TURN_HUMAN_BG_COLOR = cc.color(50, 40, 0, 140);

  /* Turn banner sizing */
  var TURN_BANNER_HW = 120;
  var TURN_BANNER_HH = 18;
  var TURN_BANNER_CORNER = 6;

  /* Human player index in AI mode */
  var HUMAN_PLAYER_INDEX = 0;

  /* Z-order for animated card above everything */
  var Z_ANIM = Display.Z_OVERLAY - 1;

  /* Turn indicator entrance animation */
  var TURN_ENTRANCE_OFFSET_Y = 40;
  var TURN_ENTRANCE_DURATION = 0.3;

  /* Thinking indicator offset below turn banner (clears pile badge) */
  var THINKING_OFFSET_Y = -65;

  /* Post-play delay before pile refresh (seconds) */
  var POST_PLAY_DELAY = 0.1;

  var GameplayScene = cc.Scene.extend({
    _game: null,
    _round: null,
    _layer: null,
    _turnLabel: null,
    _playerPanels: null,
    _pileDisplay: null,
    _actionButtons: null,
    _overlay: null,
    _thinkingIndicator: null,
    _isProcessing: false,
    _pulsingCards: null,

    /** Initialize with a new game in the given mode */
    initWithMode: function (gameMode) {
      var Game = window.LAMA.Game;
      this._game = new Game(gameMode);
    },

    /** Initialize with an existing game (for continuing rounds) */
    initWithGame: function (game) {
      this._game = game;
    },

    onEnter: function () {
      this._super();
      this._pulsingCards = [];
      this._layer = new cc.Layer();
      this.addChild(this._layer);
      this._startRound();
    },

    /* ---- Round Lifecycle ---- */

    /** Start a new round and rebuild all UI */
    _startRound: function () {
      this._round = this._game.startNewRound();
      this._isProcessing = false;
      window.LAMA.PileDisplay.resetScatter();
      this._rebuildUI();
      this._beginTurn();
    },

    /* ---- UI Construction ---- */

    /** Remove all children and rebuild the full UI */
    _rebuildUI: function () {
      this._stopAllPulses();
      this._layer.removeAllChildren();
      this._thinkingIndicator = null;
      this._addBackground();
      this._addTurnIndicator();
      this._addPileDisplay();
      this._addPlayerPanels();
      this._addActionButtons();
      this._startPlayablePulse();
    },

    _addBackground: function () {
      var bg = new cc.DrawNode();
      var w = Display.CANVAS_WIDTH;
      var h = Display.CANVAS_HEIGHT;
      /* Base dark edge */
      bg.drawPoly(
        [cc.p(0, 0), cc.p(w, 0), cc.p(w, h), cc.p(0, h)],
        BG_EDGE_COLOR, 0, BG_EDGE_COLOR
      );
      /* Center lighter area for felt effect — clears all player panels */
      bg.drawPoly(
        [cc.p(TABLE_INSET_LEFT, TABLE_INSET_BOTTOM),
         cc.p(w - TABLE_INSET_RIGHT, TABLE_INSET_BOTTOM),
         cc.p(w - TABLE_INSET_RIGHT, h - TABLE_INSET_TOP),
         cc.p(TABLE_INSET_LEFT, h - TABLE_INSET_TOP)],
        BG_CENTER_COLOR, 0, BG_CENTER_COLOR
      );
      /* Subtle vignette corners */
      _addVignetteCorners(bg, w, h);
      this._layer.addChild(bg, Display.Z_BACKGROUND);
    },

    _addTurnIndicator: function () {
      var container = new cc.Node();
      var startY = TURN_INDICATOR_Y + TURN_ENTRANCE_OFFSET_Y;
      container.setPosition(TURN_INDICATOR_X, startY);

      var isHuman = this._isHumanTurn();
      var bgColor = isHuman ? TURN_HUMAN_BG_COLOR : TURN_BG_COLOR;
      var borderColor = isHuman ? TURN_BORDER_COLOR : cc.color(255, 255, 255, 40);

      var bg = new cc.DrawNode();
      var verts = _chamferedVerts(TURN_BANNER_HW, TURN_BANNER_HH, TURN_BANNER_CORNER);
      bg.drawPoly(verts, bgColor, 1, borderColor);
      container.addChild(bg, 0);

      var text = this._getTurnText();
      this._turnLabel = new cc.LabelTTF(text, 'Arial', Display.FONT_SIZE_BODY);
      this._turnLabel.setColor(TURN_TEXT_COLOR);
      this._turnLabel.setPosition(0, 0);
      container.addChild(this._turnLabel, 1);

      this._layer.addChild(container, Display.Z_UI);
      var slide = cc.moveTo(TURN_ENTRANCE_DURATION, TURN_INDICATOR_X, TURN_INDICATOR_Y)
        .easing(cc.easeSineOut());
      container.runAction(slide);
    },

    _getTurnText: function () {
      var idx = this._round.getCurrentPlayerIndex();
      return PLAYER_NAME_PREFIX + (idx + 1) + "'s Turn";
    },

    _addPileDisplay: function () {
      var PileDisplayModule = window.LAMA.PileDisplay;
      this._pileDisplay = PileDisplayModule.create({
        drawCount: this._round.getDeck().remaining(),
        topCard: this._round.getTopCard()
      });
      this._layer.addChild(this._pileDisplay, Display.Z_CARDS);
    },

    /** Create 4 player panels positioned per screens.md */
    _addPlayerPanels: function () {
      this._playerPanels = [];
      var players = this._game.getPlayers();
      var self = this;
      for (var i = 0; i < PLAYER_COUNT; i++) {
        var panel = this._createPlayerPanel(players[i], self);
        this._layer.addChild(panel);
        this._playerPanels.push(panel);
      }
    },

    /** Build one player panel with correct face-up/down logic */
    _createPlayerPanel: function (player, self) {
      var idx = player.getIndex();
      var isCurrentTurn = (idx === this._round.getCurrentPlayerIndex());
      var faceUp = this._shouldShowFaceUp(idx);
      var onCardTap = null;
      if (faceUp && isCurrentTurn && this._isHumanTurn()) {
        onCardTap = function (card) { self._onCardTapped(card); };
      }
      var PlayerPanelModule = window.LAMA.PlayerPanel;
      return PlayerPanelModule.create({
        playerIndex: idx,
        playerName: PLAYER_NAME_PREFIX + (idx + 1),
        cards: player.getHand(),
        faceUp: faceUp,
        blackTokens: player.getBlackTokens(),
        whiteTokens: player.getWhiteTokens(),
        isActive: player.isActive(),
        isCurrent: isCurrentTurn,
        topCard: this._round.getTopCard(),
        onCardTap: onCardTap
      });
    },

    /** Determine if a player's cards should be shown face-up */
    _shouldShowFaceUp: function (playerIndex) {
      var mode = this._game.getGameMode();
      if (mode === GameMode.LOCAL) {
        return (playerIndex === this._round.getCurrentPlayerIndex());
      }
      return (playerIndex === HUMAN_PLAYER_INDEX);
    },

    _addActionButtons: function () {
      var self = this;
      var ActionButtonsModule = window.LAMA.ActionButtons;
      var currentPlayer = this._round.getCurrentPlayer();
      this._actionButtons = ActionButtonsModule.create({
        drawEnabled: this._round.canDraw(currentPlayer),
        onDraw: function () { self._onDrawPressed(); },
        onQuit: function () { self._onQuitPressed(); }
      });
      var visible = this._isHumanTurn();
      ActionButtonsModule.setVisible(this._actionButtons, visible);
      this._layer.addChild(this._actionButtons, Display.Z_UI);
    },

    /* ---- Turn Logic ---- */

    /** Begin the current player's turn */
    _beginTurn: function () {
      if (this._round.isRoundOver()) {
        this._endRound();
        return;
      }
      var mode = this._game.getGameMode();
      if (mode === GameMode.LOCAL) {
        this._showTurnOverlay();
      } else if (this._isHumanTurn()) {
        this._enableHumanInput();
      } else {
        this._scheduleAiTurn();
      }
    },

    /** Check if current turn belongs to a human player */
    _isHumanTurn: function () {
      var mode = this._game.getGameMode();
      if (mode === GameMode.LOCAL) return true;
      return (this._round.getCurrentPlayerIndex() === HUMAN_PLAYER_INDEX);
    },

    /** Show local multiplayer hand-off overlay */
    _showTurnOverlay: function () {
      var self = this;
      var TurnOverlayModule = window.LAMA.TurnOverlay;
      var idx = this._round.getCurrentPlayerIndex();
      this._overlay = TurnOverlayModule.create({
        playerName: PLAYER_NAME_PREFIX + (idx + 1),
        onReady: function () { self._dismissOverlay(); }
      });
      this._layer.addChild(this._overlay, Display.Z_OVERLAY);
    },

    /** Dismiss overlay and allow human to act */
    _dismissOverlay: function () {
      if (this._overlay) {
        this._layer.removeChild(this._overlay);
        this._overlay = null;
      }
      this._rebuildUI();
      this._enableHumanInput();
    },

    /** Enable human player interaction */
    _enableHumanInput: function () {
      this._isProcessing = false;
    },

    /* ---- AI Turn with Thinking Indicator (Anim #4) ---- */

    /** Show thinking indicator, wait, then execute AI decision */
    _scheduleAiTurn: function () {
      var self = this;
      this._isProcessing = true;
      this._showThinkingIndicator();
      this._layer.scheduleOnce(function () {
        self._hideThinkingIndicator();
        self._executeAiTurn();
      }, AI_THINK_DELAY_SEC);
    },

    /** Create and show the animated "Thinking..." dots */
    _showThinkingIndicator: function () {
      var Anim = window.LAMA.AnimationHelper;
      this._thinkingIndicator = Anim.createThinkingIndicator(
        TURN_INDICATOR_X, TURN_INDICATOR_Y + THINKING_OFFSET_Y
      );
      this._layer.addChild(this._thinkingIndicator, Display.Z_UI);
      Anim.startThinking(this._thinkingIndicator);
    },

    /** Remove the thinking indicator */
    _hideThinkingIndicator: function () {
      if (this._thinkingIndicator) {
        var Anim = window.LAMA.AnimationHelper;
        Anim.stopThinking(this._thinkingIndicator);
        this._layer.removeChild(this._thinkingIndicator);
        this._thinkingIndicator = null;
      }
    },

    /** Execute the AI's chosen action */
    _executeAiTurn: function () {
      var AiPlayerModule = window.LAMA.AiPlayer;
      var player = this._round.getCurrentPlayer();
      var decision = AiPlayerModule.decideAction(player, this._round);
      this._executeAction(decision.action, decision.card);
    },

    /* ---- Action Handlers ---- */

    /** Handle a card tap from human player; shakes card if not playable */
    _onCardTapped: function (card) {
      if (this._isProcessing) return;
      if (!card.canPlayOn(this._round.getTopCard())) {
        this._shakeInvalidCard(card);
        return;
      }
      this._isProcessing = true;
      this._executeAction(TurnAction.PLAY_CARD, card);
    },

    /** Shake a card sprite when it cannot be played */
    _shakeInvalidCard: function (card) {
      var idx = this._round.getCurrentPlayerIndex();
      var panel = this._playerPanels[idx];
      if (!panel || !panel._hand || !panel._hand._sprites) return;
      var sprites = panel._hand._sprites;
      var player = this._round.getCurrentPlayer();
      var hand = player.getHand();
      for (var i = 0; i < hand.length; i++) {
        if (hand[i] === card && sprites[i]) {
          window.LAMA.AnimationHelper.shake(sprites[i]);
          break;
        }
      }
    },

    /** Handle Draw button press */
    _onDrawPressed: function () {
      if (this._isProcessing) return;
      this._isProcessing = true;
      this._executeAction(TurnAction.DRAW_CARD, null);
    },

    /** Handle Quit button press */
    _onQuitPressed: function () {
      if (this._isProcessing) return;
      this._isProcessing = true;
      this._executeAction(TurnAction.QUIT, null);
    },

    /**
     * Execute a turn action with animation, then advance.
     * @param {string} action - TurnAction value
     * @param {Card|null} card - Card to play (if PLAY_CARD)
     */
    _executeAction: function (action, card) {
      var player = this._round.getCurrentPlayer();
      var playerIdx = player.getIndex();
      var self = this;

      if (action === TurnAction.PLAY_CARD) {
        this._round.playCard(player, card);
        this._animatePlayCard(playerIdx, card, function () {
          self._afterAction();
        });
      } else if (action === TurnAction.DRAW_CARD) {
        var drawnCard = this._round.drawCard(player);
        this._animateDrawCard(playerIdx, drawnCard, function () {
          self._afterAction();
        });
      } else {
        this._round.quitRound(player);
        this._animateQuit(playerIdx, function () {
          self._afterAction();
        });
      }
    },

    /** Post-action: check round end or advance turn */
    _afterAction: function () {
      if (this._round.isRoundOver()) {
        this._endRound();
        return;
      }
      var prevIdx = this._round.getCurrentPlayerIndex();
      this._round.advanceTurn();
      this._animateTurnTransition(prevIdx, function () {});
      this._rebuildUI();
      this._beginTurn();
    },

    /* ---- Animation #1: Card Play (hand -> discard) ---- */

    /**
     * Animate a card sliding from its actual hand position to discard pile.
     * Finds the played card's sprite position before rebuilding UI.
     */
    _animatePlayCard: function (playerIdx, card, onComplete) {
      var Anim = window.LAMA.AnimationHelper;
      var CardSpriteModule = window.LAMA.CardSprite;
      var PileDisplayModule = window.LAMA.PileDisplay;
      var startPos = this._findCardPosition(playerIdx, card);
      var scatter = PileDisplayModule.advanceScatter();

      var tempCard = CardSpriteModule.create(card, true, null);
      tempCard.setPosition(startPos.x, startPos.y);
      this._layer.addChild(tempCard, Z_ANIM);

      /* Single spawned action: move + scale + rotate all in sync */
      var dur = Anim.SLIDE_DURATION;
      var targetX = DISCARD_PILE_X + scatter.ox;
      var targetY = DISCARD_PILE_Y + scatter.oy;
      var move = cc.moveTo(dur, targetX, targetY).easing(cc.easeSineOut());
      var scaleUp = cc.scaleTo(dur / 2, 1.2);
      var scaleDown = cc.scaleTo(dur / 2, 1.0);
      var rotate = cc.rotateTo(dur, scatter.rot).easing(cc.easeSineOut());
      var combined = cc.spawn(move, cc.sequence(scaleUp, scaleDown), rotate);

      var self = this;
      tempCard.runAction(cc.sequence(combined, cc.callFunc(function () {
        self._refreshPileDisplay();
        self._layer.removeChild(tempCard);
        onComplete();
      })));
    },

    /* ---- Animation #2: Card Draw (draw pile -> hand) ---- */

    /**
     * Animate a card sliding from draw pile to hand, then flip face-up.
     * Face-down sprite slides to hand, then flips to reveal the drawn card.
     */
    _animateDrawCard: function (playerIdx, drawnCard, onComplete) {
      if (!drawnCard) {
        this._refreshDrawCount();
        onComplete();
        return;
      }
      var Anim = window.LAMA.AnimationHelper;
      var CardSpriteModule = window.LAMA.CardSprite;
      var handPos = this._getHandPosition(playerIdx);
      var showFaceUp = this._shouldShowFaceUp(playerIdx);

      var tempCard = CardSpriteModule.create(null, false, null);
      tempCard.setPosition(DRAW_PILE_X, DRAW_PILE_Y);
      this._layer.addChild(tempCard, Z_ANIM);

      var self = this;
      Anim.slideTo(tempCard, handPos.x, handPos.y, function () {
        if (showFaceUp) {
          Anim.flip(tempCard, function () {
            CardSpriteModule.swapFace(tempCard, drawnCard, true);
          }, function () {
            self._layer.removeChild(tempCard);
            self._refreshDrawCount();
            onComplete();
          });
        } else {
          self._layer.removeChild(tempCard);
          self._refreshDrawCount();
          onComplete();
        }
      });
    },

    /* ---- Animation #3: Quit Round ---- */

    /**
     * Animate quit: cascade flip cards face-down, then show status.
     * Uses AnimationHelper.cascadeFlip for staggered card flips.
     */
    _animateQuit: function (playerIdx, onComplete) {
      var panel = this._playerPanels[playerIdx];
      if (!panel || !panel._hand || !panel._hand._sprites) {
        onComplete();
        return;
      }
      var sprites = panel._hand._sprites;
      var CardSpriteModule = window.LAMA.CardSprite;
      var Anim = window.LAMA.AnimationHelper;

      Anim.cascadeFlip(sprites, function () {
        return function () {
          /* No-op midpoint; visual already face-up, we darken */
        };
      }, function () {
        _showQuitLabel(panel);
        onComplete();
      });
    },

    /* ---- Animation #6: Turn Transition ---- */

    /**
     * Pulse the new current player's name, fade out previous highlight.
     * Non-blocking; runs alongside the UI rebuild.
     */
    _animateTurnTransition: function (prevIdx) {
      var Anim = window.LAMA.AnimationHelper;
      var prevPanel = this._playerPanels[prevIdx];
      if (prevPanel && prevPanel._nameLabel) {
        Anim.fadeOut(prevPanel._nameLabel);
      }
    },

    /* ---- Animation #7: Playable Card Pulse ---- */

    /** Start pulsing playable card highlights in the current player's hand */
    _startPlayablePulse: function () {
      this._stopAllPulses();
      var idx = this._round.getCurrentPlayerIndex();
      if (!this._shouldShowFaceUp(idx)) return;
      var panel = this._playerPanels[idx];
      if (!panel || !panel._hand || !panel._hand._sprites) return;

      var Anim = window.LAMA.AnimationHelper;
      var sprites = panel._hand._sprites;
      var topCard = this._round.getTopCard();
      var player = this._round.getCurrentPlayer();
      var hand = player.getHand();

      for (var i = 0; i < hand.length; i++) {
        if (hand[i].canPlayOn(topCard) && sprites[i]) {
          Anim.startPulse(sprites[i]);
          this._pulsingCards.push(sprites[i]);
        }
      }
    },

    /** Stop all active pulse animations */
    _stopAllPulses: function () {
      if (!this._pulsingCards) return;
      for (var i = 0; i < this._pulsingCards.length; i++) {
        this._pulsingCards[i].stopAllActions();
        this._pulsingCards[i].setScale(1.0);
      }
      this._pulsingCards = [];
    },

    /* ---- Position Helpers ---- */

    /** Get the center position of a player's hand area */
    _getHandPosition: function (playerIdx) {
      var layouts = window.LAMA.PlayerPanel.PLAYER_LAYOUTS;
      var layout = layouts[playerIdx];
      return { x: layout.handX, y: layout.handY };
    },

    /**
     * Find the actual layer-space position of a card sprite in a player's hand.
     * Falls back to hand center if the sprite cannot be found.
     */
    _findCardPosition: function (playerIdx, card) {
      var panel = this._playerPanels[playerIdx];
      if (!panel || !panel._hand || !panel._hand._sprites) {
        return this._getHandPosition(playerIdx);
      }
      var handNode = panel._hand;
      var sprites = handNode._sprites;
      for (var i = 0; i < sprites.length; i++) {
        if (sprites[i]._cardRef === card) {
          return {
            x: handNode.getPositionX() + sprites[i].getPositionX(),
            y: handNode.getPositionY() + sprites[i].getPositionY()
          };
        }
      }
      return this._getHandPosition(playerIdx);
    },

    /* ---- Pile Updates ---- */

    /** Update discard pile display after a card is played */
    _refreshPileDisplay: function () {
      var PileDisplayModule = window.LAMA.PileDisplay;
      PileDisplayModule.updateDiscardTop(this._pileDisplay, this._round.getTopCard());
      PileDisplayModule.updateDrawCount(
        this._pileDisplay, this._round.getDeck().remaining()
      );
    },

    /** Update draw pile count after a card is drawn */
    _refreshDrawCount: function () {
      var PileDisplayModule = window.LAMA.PileDisplay;
      PileDisplayModule.updateDrawCount(
        this._pileDisplay, this._round.getDeck().remaining()
      );
    },

    /** End the round and transition to results */
    _endRound: function () {
      this._stopAllPulses();
      var summary = this._game.scoreRound();
      var SceneMgr = window.LAMA.SceneManager;
      var TransType = window.LAMA.TransitionType;
      var scene = new window.LAMA.RoundResultScene();
      scene.initWithData(this._game, summary);
      SceneMgr.transitionTo(scene, TransType.SLIDE_UP);
    }
  });

  /** Add subtle vignette at the corners of the background */
  function _addVignetteCorners(draw, w, h) {
    var cs = 80;
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

  /** Build chamfered rectangle vertices for turn indicator banner */
  function _chamferedVerts(hw, hh, c) {
    return [
      cc.p(-hw + c, -hh), cc.p(hw - c, -hh),
      cc.p(hw, -hh + c), cc.p(hw, hh - c),
      cc.p(hw - c, hh), cc.p(-hw + c, hh),
      cc.p(-hw, hh - c), cc.p(-hw, -hh + c)
    ];
  }

  /** Show a "Quit" label fading in on a player panel */
  function _showQuitLabel(panel) {
    if (!panel._statusLabel) return;
    var Anim = window.LAMA.AnimationHelper;
    panel._statusLabel.setString('Quit');
    panel._statusLabel.setColor(cc.color(255, 80, 80));
    Anim.fadeIn(panel._statusLabel);
  }

  exports.GameplayScene = GameplayScene;

})(typeof module !== 'undefined' ? module.exports : (window.LAMA = window.LAMA || {}));
