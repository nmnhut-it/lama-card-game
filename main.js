/**
 * main.js - Cocos2d-x JS application bootstrap.
 * Configures canvas resolution (960x640 landscape), loads resources,
 * and launches TitleScene as the initial scene.
 */
'use strict';

cc.game.onStart = function () {
  var constants = window.LAMA;
  var Display = constants.Display;

  /* Configure Cocos2d-x canvas view */
  cc.view.adjustViewPort(true);
  cc.view.setDesignResolutionSize(
    Display.CANVAS_WIDTH,
    Display.CANVAS_HEIGHT,
    cc.ResolutionPolicy.SHOW_ALL
  );
  cc.view.resizeWithBrowserSize(true);

  /* Launch the title scene */
  var SceneMgr = constants.SceneManager;
  SceneMgr.runInitial(new constants.TitleScene());
};

cc.game.run("gameCanvas");
