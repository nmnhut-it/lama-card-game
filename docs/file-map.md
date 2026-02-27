# L.A.M.A. - File & Module Map

## Directory Structure

```
D:/claude-llama/
├── index.html                  # HTML entry point, loads Cocos2d-x and main.js
├── main.js                     # Cocos2d-x bootstrap, sets resolution, loads first scene
├── src/
│   ├── constants.js            # Shared constants (card values, scoring, display, etc.)
│   ├── game/                   # Core game logic (Owner: coder-1)
│   │   ├── Card.js             # Card model (value, type checking, ordering)
│   │   ├── Deck.js             # Deck: shuffle, deal, draw operations
│   │   ├── Player.js           # Player model: hand, tokens, quit state
│   │   ├── Round.js            # Round logic: turns, play validation, round end
│   │   ├── Game.js             # Game orchestrator: rounds, scoring, game end
│   │   └── TokenBank.js        # Token supply: distribute, return, exchange
│   ├── ai/                     # AI logic (Owner: coder-2)
│   │   └── AiPlayer.js         # AI decision-making for Solo vs AI mode
│   └── ui/                     # UI/rendering layer (Owner: coder-2)
│       ├── scenes/
│       │   ├── TitleScene.js       # Title screen scene
│       │   ├── ModeSelectScene.js  # Mode selection scene
│       │   ├── GameplayScene.js    # Main gameplay scene
│       │   ├── RoundResultScene.js # Round results scene
│       │   └── FinalScoreScene.js  # Final scoreboard scene
│       ├── components/
│       │   ├── CardSprite.js       # Visual card component
│       │   ├── HandDisplay.js      # Renders a player's hand
│       │   ├── PileDisplay.js      # Renders draw/discard piles
│       │   ├── TokenDisplay.js     # Renders token counts
│       │   ├── PlayerPanel.js      # Composite: name + hand + tokens for one player
│       │   ├── ActionButtons.js    # Draw / Quit action buttons
│       │   └── TurnOverlay.js      # Local multiplayer turn transition overlay
│       └── SceneManager.js     # Scene transition helper
├── tests/                      # Unit tests (Owner: tester)
│   ├── testRunner.html         # HTML test runner page
│   ├── CardTest.js             # Tests for Card model
│   ├── DeckTest.js             # Tests for Deck operations
│   ├── PlayerTest.js           # Tests for Player model
│   ├── RoundTest.js            # Tests for Round logic
│   ├── GameTest.js             # Tests for Game orchestrator
│   ├── TokenBankTest.js        # Tests for TokenBank
│   └── AiPlayerTest.js        # Tests for AI decision logic
├── res/                        # Asset placeholders
│   ├── cards/                  # Card sprites (placeholder)
│   ├── tokens/                 # Token sprites (placeholder)
│   ├── bg/                     # Background images (placeholder)
│   └── fonts/                  # Font files (placeholder)
└── docs/                       # Documentation (Owner: pm)
    ├── gdd.md                  # Game Design Document
    ├── screens.md              # Screen layout specs
    ├── scene-flow.md           # Scene transition diagram
    ├── tasks.md                # Task breakdown
    └── file-map.md             # This file
```

## Module Descriptions

### `src/constants.js` (Shared)
All game and display constants. Referenced by every module. No logic, only exported constant values.

**Key exports**: CARD_VALUES, COPIES_PER_VALUE, TOTAL_CARDS, PLAYER_COUNT, HAND_SIZE_INITIAL, WHITE_TOKEN_VALUE, BLACK_TOKEN_VALUE, GAME_OVER_THRESHOLD, LLAMA_PENALTY, CANVAS_WIDTH, CANVAS_HEIGHT, CARD_WIDTH, CARD_HEIGHT, Z-order values, GameMode enum, TurnAction enum, PlayerStatus enum.

### `src/game/Card.js` (coder-1)
Immutable card model. Stores a card value (1-6 or LLAMA). Provides methods to check if a card can be played on another card (same value or +1 with wrapping).

**Key exports**: Card class with `canPlayOn(topCard)`, `getPenaltyValue()`, `getValue()`.

### `src/game/Deck.js` (coder-1)
Manages the draw pile. Supports creating a full 56-card deck, shuffling (Fisher-Yates), dealing N cards, drawing one card, and checking if empty.

**Key exports**: Deck class with `shuffle()`, `deal(count)`, `draw()`, `isEmpty()`, `remaining()`.

### `src/game/Player.js` (coder-1)
Player model. Tracks hand (array of Cards), tokens (white and black counts), active/quit status, and player index.

**Key exports**: Player class with `addCard(card)`, `removeCard(card)`, `hasPlayableCard(topCard)`, `quit()`, `isActive()`, `getHandPenalty()`, `totalPoints()`.

### `src/game/Round.js` (coder-1)
Manages one round of play. Tracks current player, discard pile top card, validates play actions, advances turns (skipping quit players), detects round end conditions.

**Key exports**: Round class with `playCard(player, card)`, `drawCard(player)`, `quitRound(player)`, `isRoundOver()`, `getCurrentPlayer()`, `getTopCard()`, `canDraw(player)`.

### `src/game/Game.js` (coder-1)
Top-level game orchestrator. Manages multiple rounds, cumulative scoring, token distribution, game-over detection.

**Key exports**: Game class with `startNewRound()`, `scoreRound()`, `isGameOver()`, `getWinner()`, `getScores()`.

### `src/game/TokenBank.js` (coder-1)
Token supply management. Distributes penalty tokens to players, handles token return for empty-hand bonus, supports black/white exchange.

**Key exports**: TokenBank class with `distributeTokens(player, points)`, `returnToken(player, tokenType)`, `exchange(player, fromType, toType)`.

### `src/ai/AiPlayer.js` (coder-2)
AI decision logic for computer-controlled players. Evaluates hand and game state to choose between play, draw, or quit. Uses a strategy based on playable cards and remaining hand penalty.

**Key exports**: AiPlayer class with `decideAction(player, round)` returning a TurnAction.

### `src/ui/scenes/TitleScene.js` (coder-2)
Title screen. Displays game name and start button. Transitions to ModeSelectScene.

### `src/ui/scenes/ModeSelectScene.js` (coder-2)
Mode selection. Two buttons for Local Multiplayer and Solo vs AI. Back button returns to title.

### `src/ui/scenes/GameplayScene.js` (coder-2)
Main gameplay interface. Renders all four player panels, central draw/discard piles, action buttons. Handles card tap events, AI turn scheduling, turn transition overlays in local mode.

### `src/ui/scenes/RoundResultScene.js` (coder-2)
Displays round scoring breakdown. Shows cards remaining, round penalties, cumulative totals. Continue button.

### `src/ui/scenes/FinalScoreScene.js` (coder-2)
Final game results. Sorted standings, winner highlight. Play Again and Main Menu buttons.

### `src/ui/components/` (coder-2)
Reusable visual components. Each renders a specific UI element using Cocos2d-x sprites, labels, and event listeners. Components receive data; they do not own game logic.

### `src/ui/SceneManager.js` (coder-2)
Utility for scene transitions. Wraps `cc.director.runScene()` with transition effects (fade, slide).

## File Ownership Summary

| Owner | Directories/Files |
|---|---|
| coder-1 | `src/game/*`, `src/constants.js` |
| coder-2 | `src/ai/*`, `src/ui/*`, `main.js`, `index.html` |
| tester | `tests/*` |
| pm | `docs/*` |
| reviewer | Reviews all files, owns none |

## Dependency Graph (imports)

```
constants.js <--- Card.js <--- Deck.js
                    ^            ^
                    |            |
constants.js <--- Player.js     |
                    ^            |
                    |            |
constants.js <--- Round.js -----+
                    ^
                    |
constants.js <--- Game.js <--- TokenBank.js
                    ^
                    |
                AiPlayer.js (imports Round, Player, Card, constants)
                    ^
                    |
              GameplayScene.js (imports Game, Round, AiPlayer, all components)
```
