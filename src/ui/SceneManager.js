/**
 * SceneManager - Wraps cc.director scene transitions.
 * Supports fade and slide effects with configurable duration.
 */
'use strict';

(function (exports) {

  /** Transition type enum */
  var TransitionType = Object.freeze({
    FADE: 'fade',
    SLIDE_LEFT: 'slide_left',
    SLIDE_RIGHT: 'slide_right',
    SLIDE_UP: 'slide_up',
    SLIDE_DOWN: 'slide_down'
  });

  /** Default transition duration in seconds */
  var DEFAULT_TRANSITION_DURATION = 0.4;

  var SceneManager = {};

  /**
   * Transition to a new scene with the specified effect.
   * @param {cc.Scene} scene - Target scene
   * @param {string} transitionType - TransitionType value
   * @param {number} [duration] - Duration in seconds
   */
  SceneManager.transitionTo = function (scene, transitionType, duration) {
    var dur = duration || DEFAULT_TRANSITION_DURATION;
    var transition = SceneManager._createTransition(scene, transitionType, dur);
    cc.director.runScene(transition);
  };

  /**
   * Create the appropriate Cocos2d transition object.
   * @param {cc.Scene} scene - Target scene
   * @param {string} type - TransitionType value
   * @param {number} dur - Duration in seconds
   * @returns {cc.TransitionScene}
   */
  SceneManager._createTransition = function (scene, type, dur) {
    /* SLIDE_LEFT uses TransitionSlideInR because content slides left as new scene enters from the right */
    if (type === TransitionType.SLIDE_LEFT) {
      return new cc.TransitionSlideInR(dur, scene);
    }
    if (type === TransitionType.SLIDE_RIGHT) {
      return new cc.TransitionSlideInL(dur, scene);
    }
    if (type === TransitionType.SLIDE_UP) {
      return new cc.TransitionSlideInT(dur, scene);
    }
    if (type === TransitionType.SLIDE_DOWN) {
      return new cc.TransitionSlideInB(dur, scene);
    }
    return new cc.TransitionFade(dur, scene);
  };

  /**
   * Run a scene immediately without transition.
   * Used for initial scene launch.
   * @param {cc.Scene} scene - Scene to run
   */
  SceneManager.runInitial = function (scene) {
    cc.director.runScene(scene);
  };

  exports.TransitionType = TransitionType;
  exports.SceneManager = SceneManager;

})(typeof module !== 'undefined' ? module.exports : (window.LAMA = window.LAMA || {}));
