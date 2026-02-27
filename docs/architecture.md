# L.A.M.A. - Architecture Guide

## Three-Layer Architecture

```
+--------------------------------------------------+
|                   UI / Rendering                  |
|  scenes/   TitleScene, ModeSelectScene,           |
|            GameplayScene, RoundResultScene,        |
|            FinalScoreScene                        |
|  components/ CardSprite, HandDisplay, PileDisplay, |
|              TokenDisplay, PlayerPanel,            |
|              ActionButtons, TurnOverlay,           |
|              ButtonHelper                         |
|  SceneManager                                     |
+-------------------+------------------------------+
                    | reads state, calls actions
+-------------------v------------------------------+
|                   AI Layer                        |
|  AiPlayer.decideAction(player, round)             |
|  Consumes game state, returns {action, card}      |
+-------------------+------------------------------+
                    | uses game API
+-------------------v------------------------------+
|                Game Logic Layer                   |
|  Card, Deck, Player, TokenBank, Round, Game       |
|  constants.js (enums, rules, display values)      |
+--------------------------------------------------+
```

**Key rule**: Each layer only depends on the layer below it. Game logic has zero UI or AI awareness.

## Module Dependency Graph

```
constants.js
  |
  +---> Card.js
  |       |
  |       +---> Deck.js
  |       +---> Player.js
  |                |
  |                +---> TokenBank.js
  |
  +---> Round.js  (uses Card, Deck, Player, constants)
  |
  +---> Game.js   (uses Player, Deck, Round, TokenBank, constants)
  |
  +---> AiPlayer.js  (uses constants; reads Player and Round)
  |
  +---> SceneManager.js
  +---> ButtonHelper.js
  +---> All scenes and components (use constants + game modules)
```

## Key Design Patterns

### UMD Modules
Every file uses a self-executing function with conditional exports. Modules work in both browser (`window.LAMA` namespace) and Node.js (`module.exports`). This enables running tests with Node.js while the game runs in a browser.

### Event-Driven UI
GameplayScene listens for card taps and button clicks, then calls game logic methods (`round.playCard()`, `round.drawCard()`, `round.quitRound()`). The UI reads updated state and re-renders. No observer/pub-sub -- the scene polls state after each action.

### Strategy Pattern (AI)
`AiPlayer.decideAction()` evaluates game state and returns a decision object `{action, card}`. The GameplayScene executes the decision through the same game API as human actions. Swapping AI strategies requires changing only `AiPlayer.js`.

### Immutable Cards
`Card` instances are frozen after construction. Card identity is by reference, not value, which simplifies hand management.

## How to Add Features

### New card type or rule change
1. Add the value to `CardValue` and `ALL_CARD_VALUES` in `constants.js`
2. Update `NEXT_VALUE` and `PENALTY_VALUES` maps
3. Update `COPIES_PER_VALUE` or add a separate count if needed
4. Add tests for the new value in `CardTest.js`

### New AI strategy
1. Create a new function or module alongside `AiPlayer.js`
2. Implement `decideAction(player, round)` returning `{action, card}`
3. Wire it into `GameplayScene.js` where AI turns are processed

### New scene
1. Create the scene file in `src/ui/scenes/`
2. Use `ButtonHelper.createButton()` for interactive buttons
3. Use `SceneManager.transitionTo()` for navigation
4. Add the script tag to `index.html`

### New game constant
1. Add to `constants.js` with a descriptive name
2. Export it at the bottom of the file
3. Import from constants in consuming modules -- never hard-code
