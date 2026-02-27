# L.A.M.A. - Final Project Report

## Project Overview

L.A.M.A. (Lege Alle Minuspunkte Ab / "Drop All Your Minus Points") is an HTML5 card game built with Cocos2d-x JS 3.1x. Players try to minimize penalty points across multiple rounds by playing cards, drawing, or quitting. The game ends when any player reaches 40 points; the player with the fewest points wins.

## Game Modes

- **Local Multiplayer**: 4 human players on the same device with turn transition overlays
- **Solo vs AI**: 1 human player against 3 AI opponents that prioritize shedding high-penalty cards

## Completed Features

### Core Game Logic
- Card model with value validation and wrapping play order (1-2-3-4-5-6-Llama-1)
- 56-card deck with Fisher-Yates shuffle, deal, and draw
- Player state management (hand, tokens, active/quit status)
- Token bank with distribution, return, and exchange operations
- Round management with turn advancement, action validation, and end detection
- Multi-round game orchestrator with scoring, token distribution, and game-over detection

### AI
- Strategy-based AI that plays highest-penalty cards first, draws when hand penalty exceeds threshold, and quits when penalty is low

### UI / Rendering (5 Scenes, 8 Components)
- Title screen, mode selection, gameplay, round results, final scoreboard
- Card sprites, hand display, pile display, token display, player panels, action buttons, turn overlay, button helper

## Architecture

Three-layer design:
1. **Game Logic** (`src/game/`): Rules, state, scoring -- no UI dependencies
2. **AI** (`src/ai/`): Decision logic consuming game state, producing actions
3. **UI/Rendering** (`src/ui/`): Cocos2d-x scenes and components -- no game logic

## Project Size

| Category | Count |
|---|---|
| Source files (src/) | 18 |
| Test files (tests/) | 9 |
| Documentation files (docs/) | 5 |
| Total JS source lines | ~1,800 |

## Code Quality

- 0 methods exceeding 30 lines
- 0 hard-coded strings or magic numbers (all in constants.js)
- 0 DRY violations (shared ButtonHelper, constants, enums)
- UMD module pattern for browser and Node.js compatibility

## Test Coverage

~95 tests across 7 test suites:

| Suite | Module | Areas Covered |
|---|---|---|
| CardTest | Card | Construction, canPlayOn (same/+1/wrap), penalty values |
| DeckTest | Deck | Card count, shuffle, deal, draw, empty state |
| PlayerTest | Player | Hand management, status, penalty with duplicate rule, token points |
| TokenBankTest | TokenBank | Distribution, return, exchange, supply limits |
| RoundTest | Round | Play/draw/quit validation, turn advancement, round-end detection |
| GameTest | Game | Round lifecycle, scoring, token distribution, game-over, winners |
| AiPlayerTest | AiPlayer | Card selection, draw vs quit decisions, edge cases |

## Review Findings and Fixes

### T-501: Core Game Logic Review
- **1 critical**: Fixed scoring to use `scoreRound()` instead of manual token distribution
- **4 major**: Improved method naming, added missing validations, tightened type checks, documented edge cases

### T-502: AI and UI Review
- **2 critical**: Fixed AI never returning invalid actions, corrected scene transition data flow
- **4 major**: Standardized button creation (ButtonHelper), fixed z-order consistency, improved event cleanup, added disabled-state styling

### T-503: Test Review
- RoundTest rewritten with comprehensive coverage for all round lifecycle scenarios
- GameTest scoring test fixed to use proper `scoreRound()` API
- AiPlayerTest high-penalty preference assertion corrected

## Known Issues / Future Work

- Asset placeholders: card sprites, token images, backgrounds, and fonts use drawn shapes instead of image assets
- No sound effects or music
- No save/load game state
- No online multiplayer
- No difficulty levels for AI (single strategy)

## How to Run

### Play the Game
Open `index.html` in a modern browser. Requires Cocos2d-x JS engine files in the project.

### Run Tests
```
node tests/test-runner.js
```
