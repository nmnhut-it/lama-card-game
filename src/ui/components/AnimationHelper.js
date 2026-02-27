/**
 * AnimationHelper - Shared animation patterns for card game UI.
 * Provides slide, flip, pulse, and fade helpers using Cocos2d actions.
 * All durations and easing functions are centralized here.
 * Depends on: constants (Display).
 */
'use strict';

(function (exports) {

  var constants = typeof require !== 'undefined'
    ? require('../../constants')
    : window.LAMA;

  var Display = constants.Display;

  /* ---- Timing Constants ---- */
  var SLIDE_DURATION = 0.3;
  var FLIP_HALF_DURATION = 0.12;
  var PULSE_DURATION = 0.4;
  var FADE_DURATION = 0.25;
  var CASCADE_DELAY = 0.1;
  var PLAY_SCALE_PEAK = 1.2;
  var PULSE_SCALE_PEAK = 1.12;
  var TOKEN_SLIDE_DURATION = 0.4;
  var HIGHLIGHT_FADE_DURATION = 0.3;
  var THINKING_DOT_INTERVAL = 0.45;

  /* Thinking indicator ribbon */
  var THINKING_BG_COLOR = cc.color(0, 0, 0, 140);
  var THINKING_BORDER_COLOR = cc.color(200, 200, 200, 60);
  var THINKING_DOT_COLOR = cc.color(180, 220, 180);
  var THINKING_RIBBON_HW = 75;
  var THINKING_RIBBON_HH = 16;
  var THINKING_RIBBON_CORNER = 8;

  /* Shake animation constants */
  var SHAKE_OFFSET = 5;
  var SHAKE_STEP_DURATION = 0.05;

  /* PopIn animation constants */
  var POP_IN_DURATION = 0.2;

  /**
   * Slide a node from its current position to a target with easing.
   * @param {cc.Node} node - Node to move
   * @param {number} toX - Target X
   * @param {number} toY - Target Y
   * @param {Function} [onComplete] - Callback after animation
   */
  function slideTo(node, toX, toY, onComplete) {
    var move = cc.moveTo(SLIDE_DURATION, toX, toY)
      .easing(cc.easeSineOut());
    var actions = [move];
    if (onComplete) {
      actions.push(cc.callFunc(onComplete));
    }
    node.runAction(cc.sequence(actions));
  }

  /**
   * Slide + scale-up during transit, then scale back to 1.0 on arrival.
   * Used for card play animation (hand to discard pile).
   * @param {cc.Node} node - Card node
   * @param {number} toX - Discard pile X
   * @param {number} toY - Discard pile Y
   * @param {Function} [onComplete] - Callback after animation
   */
  function slideWithBump(node, toX, toY, onComplete) {
    var move = cc.moveTo(SLIDE_DURATION, toX, toY)
      .easing(cc.easeSineOut());
    var scaleUp = cc.scaleTo(SLIDE_DURATION / 2, PLAY_SCALE_PEAK);
    var scaleDown = cc.scaleTo(SLIDE_DURATION / 2, 1.0);
    var scaleSeq = cc.sequence(scaleUp, scaleDown);
    var combined = cc.spawn(move, scaleSeq);
    var actions = [combined];
    if (onComplete) {
      actions.push(cc.callFunc(onComplete));
    }
    node.runAction(cc.sequence(actions));
  }

  /**
   * Card flip effect: scale X to 0 then back to 1.
   * Calls midCallback at the halfway point (to swap face texture).
   * @param {cc.Node} node - Card node
   * @param {Function} midCallback - Called at the flip midpoint
   * @param {Function} [onComplete] - Callback after full flip
   */
  function flip(node, midCallback, onComplete) {
    var shrink = cc.scaleTo(FLIP_HALF_DURATION, 0, 1);
    var mid = cc.callFunc(midCallback);
    var grow = cc.scaleTo(FLIP_HALF_DURATION, 1, 1);
    var actions = [shrink, mid, grow];
    if (onComplete) {
      actions.push(cc.callFunc(onComplete));
    }
    node.runAction(cc.sequence(actions));
  }

  /**
   * Continuous pulse animation on a node (repeating scale oscillation).
   * Returns the action so the caller can stop it.
   * @param {cc.Node} node - Node to pulse
   * @returns {cc.Action} The repeating action (for stopAction later)
   */
  function startPulse(node) {
    var up = cc.scaleTo(PULSE_DURATION, PULSE_SCALE_PEAK)
      .easing(cc.easeSineInOut());
    var down = cc.scaleTo(PULSE_DURATION, 1.0)
      .easing(cc.easeSineInOut());
    var pulseSeq = cc.sequence(up, down);
    var repeat = cc.repeatForever(pulseSeq);
    node.runAction(repeat);
    return repeat;
  }

  /**
   * Flash/pulse a node once (scale up briefly then back).
   * @param {cc.Node} node - Node to flash
   * @param {Function} [onComplete] - Callback after flash
   */
  function flashOnce(node, onComplete) {
    var up = cc.scaleTo(PULSE_DURATION / 2, PLAY_SCALE_PEAK)
      .easing(cc.easeSineOut());
    var down = cc.scaleTo(PULSE_DURATION / 2, 1.0)
      .easing(cc.easeSineIn());
    var actions = [up, down];
    if (onComplete) {
      actions.push(cc.callFunc(onComplete));
    }
    node.runAction(cc.sequence(actions));
  }

  /**
   * Fade a node in from invisible.
   * @param {cc.Node} node - Node to fade in
   * @param {Function} [onComplete] - Callback after fade
   */
  function fadeIn(node, onComplete) {
    node.setOpacity(0);
    var fade = cc.fadeIn(FADE_DURATION);
    var actions = [fade];
    if (onComplete) {
      actions.push(cc.callFunc(onComplete));
    }
    node.runAction(cc.sequence(actions));
  }

  /**
   * Fade a node out to invisible.
   * @param {cc.Node} node - Node to fade out
   * @param {Function} [onComplete] - Callback after fade
   */
  function fadeOut(node, onComplete) {
    var fade = cc.fadeOut(FADE_DURATION);
    var actions = [fade];
    if (onComplete) {
      actions.push(cc.callFunc(onComplete));
    }
    node.runAction(cc.sequence(actions));
  }

  /**
   * Cascade flip: flip multiple cards one by one with staggered delay.
   * @param {cc.Node[]} cardNodes - Array of card sprites
   * @param {Function} midCallbackFactory - (index) => midCallback for each flip
   * @param {Function} [onAllComplete] - Called after all flips finish
   */
  function cascadeFlip(cardNodes, midCallbackFactory, onAllComplete) {
    var remaining = cardNodes.length;
    if (remaining === 0 && onAllComplete) {
      onAllComplete();
      return;
    }
    for (var i = 0; i < cardNodes.length; i++) {
      _scheduleCascadeItem(cardNodes[i], i, midCallbackFactory, function () {
        remaining--;
        if (remaining === 0 && onAllComplete) {
          onAllComplete();
        }
      });
    }
  }

  /** Schedule one item in a cascade with index-based delay */
  function _scheduleCascadeItem(node, index, midFactory, onDone) {
    var delay = cc.delayTime(index * CASCADE_DELAY);
    var flipAction = _createFlipSequence(midFactory(index), onDone);
    node.runAction(cc.sequence(delay, flipAction));
  }

  /** Build the shrink-swap-grow sequence for one flip */
  function _createFlipSequence(midCallback, onDone) {
    var shrink = cc.scaleTo(FLIP_HALF_DURATION, 0, 1);
    var mid = cc.callFunc(midCallback);
    var grow = cc.scaleTo(FLIP_HALF_DURATION, 1, 1);
    var done = cc.callFunc(onDone);
    return cc.sequence(shrink, mid, grow, done);
  }

  /**
   * Create a simple "thinking" dots label that animates.
   * @param {number} x - X position
   * @param {number} y - Y position
   * @returns {cc.Node} The thinking indicator node
   */
  function createThinkingIndicator(x, y) {
    var node = new cc.Node();
    node.setPosition(x, y);
    var bg = new cc.DrawNode();
    bg.drawPoly(
      _thinkingRibbonVerts(THINKING_RIBBON_HW, THINKING_RIBBON_HH,
        THINKING_RIBBON_CORNER),
      THINKING_BG_COLOR, 1, THINKING_BORDER_COLOR
    );
    node.addChild(bg, Display.Z_UI - 1);
    var dot = new cc.DrawNode();
    dot.drawDot(cc.p(-THINKING_RIBBON_HW + 14, 0), 4, THINKING_DOT_COLOR);
    node.addChild(dot, Display.Z_UI);
    var label = new cc.LabelTTF('', 'Arial', Display.FONT_SIZE_BODY);
    label.setColor(cc.color(255, 255, 255));
    label.setPosition(8, 0);
    node.addChild(label, Display.Z_UI);
    node._label = label;
    node._dotCount = 0;
    return node;
  }

  /** Build chamfered rect vertices for thinking ribbon */
  function _thinkingRibbonVerts(hw, hh, c) {
    return [
      cc.p(-hw + c, -hh), cc.p(hw - c, -hh),
      cc.p(hw, -hh + c), cc.p(hw, hh - c),
      cc.p(hw - c, hh), cc.p(-hw + c, hh),
      cc.p(-hw, hh - c), cc.p(-hw, -hh + c)
    ];
  }

  /**
   * Start the thinking dots animation on an indicator node.
   * @param {cc.Node} indicator - Node from createThinkingIndicator
   */
  function startThinking(indicator) {
    var self = indicator;
    var update = function () {
      self._dotCount = (self._dotCount % 3) + 1;
      var dots = '';
      for (var i = 0; i < self._dotCount; i++) { dots += '.'; }
      self._label.setString('Thinking' + dots);
    };
    update();
    self.schedule(update, THINKING_DOT_INTERVAL);
  }

  /** Stop the thinking animation. */
  function stopThinking(indicator) {
    indicator.unscheduleAllCallbacks();
  }

  /**
   * Shake a node left-right for invalid action feedback.
   * @param {cc.Node} node - Node to shake
   */
  function shake(node) {
    var left = cc.moveBy(SHAKE_STEP_DURATION, -SHAKE_OFFSET, 0);
    var right = cc.moveBy(SHAKE_STEP_DURATION, SHAKE_OFFSET * 2, 0);
    var center = cc.moveBy(SHAKE_STEP_DURATION, -SHAKE_OFFSET, 0);
    node.runAction(cc.sequence(left, right, center));
  }

  /**
   * Pop-in entrance: scale from 0 to 1 with easeBackOut.
   * @param {cc.Node} node - Node to animate
   * @param {Function} [onComplete] - Callback after animation
   */
  function popIn(node, onComplete) {
    node.setScale(0);
    var scale = cc.scaleTo(POP_IN_DURATION, 1.0).easing(cc.easeBackOut());
    var actions = [scale];
    if (onComplete) {
      actions.push(cc.callFunc(onComplete));
    }
    node.runAction(cc.sequence(actions));
  }

  exports.AnimationHelper = {
    slideTo: slideTo,
    slideWithBump: slideWithBump,
    flip: flip,
    startPulse: startPulse,
    flashOnce: flashOnce,
    fadeIn: fadeIn,
    fadeOut: fadeOut,
    cascadeFlip: cascadeFlip,
    createThinkingIndicator: createThinkingIndicator,
    startThinking: startThinking,
    stopThinking: stopThinking,
    shake: shake,
    popIn: popIn,
    SLIDE_DURATION: SLIDE_DURATION,
    CASCADE_DELAY: CASCADE_DELAY,
    TOKEN_SLIDE_DURATION: TOKEN_SLIDE_DURATION,
    HIGHLIGHT_FADE_DURATION: HIGHLIGHT_FADE_DURATION
  };

})(typeof module !== 'undefined' ? module.exports : (window.LAMA = window.LAMA || {}));
