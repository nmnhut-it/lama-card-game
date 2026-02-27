# L.A.M.A. - Task Breakdown

## Task Legend
- **Role**: coder-1 (core logic), coder-2 (AI + UI), tester (tests), reviewer (review)
- **Status**: pending | in-progress | done
- **Deps**: Task IDs that must complete first

---

## Phase 1: Foundation

### T-101: Create shared constants module
- **Role**: coder-1
- **Files**: `src/constants.js`
- **Deps**: None (first task, no dependencies)
- **Description**: Define all game constants, enums, and display constants used across the project. Includes card values, token values, player count, thresholds, canvas dimensions, sprite sizes, z-orders, and enums for GameMode, TurnAction, PlayerStatus, CardValue, and TokenType.
- **Acceptance Criteria**:
  - All constants from GDD and screens.md are defined
  - No magic numbers or strings remain
  - Enums cover all game states
  - File exports all values for use by other modules

### T-102: Create Card model
- **Role**: coder-1
- **Files**: `src/game/Card.js`
- **Deps**: T-101
- **Description**: Implement the Card class representing a single card. Stores a value from the CardValue enum. Provides methods for play validation (canPlayOn checks same value or +1 with 6->Llama->1 wrap) and penalty calculation.
- **Acceptance Criteria**:
  - Card stores a CardValue
  - `canPlayOn(topCard)` correctly validates including wrap (6->Llama->1)
  - `getPenaltyValue()` returns face value for 1-6, LLAMA_PENALTY for Llama
  - `getValue()` returns the CardValue
  - Immutable after construction

### T-103: Create Deck model
- **Role**: coder-1
- **Files**: `src/game/Deck.js`
- **Deps**: T-102
- **Description**: Implement the Deck class managing the draw pile. Creates 56 cards (COPIES_PER_VALUE of each CardValue). Supports Fisher-Yates shuffle, dealing N cards as an array, drawing a single card, and checking remaining count.
- **Acceptance Criteria**:
  - Constructor creates exactly TOTAL_CARDS cards
  - `shuffle()` randomizes card order
  - `deal(count)` removes and returns top N cards
  - `draw()` removes and returns top card, returns null if empty
  - `isEmpty()` and `remaining()` report state correctly

### T-104: Create Player model
- **Role**: coder-1
- **Files**: `src/game/Player.js`
- **Deps**: T-102
- **Description**: Implement the Player class. Tracks hand (array of Cards), token counts (white, black), active/quit status, and player index. Provides hand management and penalty calculation with the duplicate-counts-once rule.
- **Acceptance Criteria**:
  - Stores hand as array of Card instances
  - `addCard(card)` and `removeCard(card)` manage hand
  - `hasPlayableCard(topCard)` checks if any card canPlayOn top
  - `quit()` sets status to QUIT, `isActive()` checks status
  - `getHandPenalty()` applies duplicate-once rule correctly
  - `totalPoints()` sums white * WHITE_TOKEN_VALUE + black * BLACK_TOKEN_VALUE

### T-105: Create TokenBank model
- **Role**: coder-1
- **Files**: `src/game/TokenBank.js`
- **Deps**: T-104
- **Description**: Implement the TokenBank class managing the shared token supply. Distributes penalty tokens to players (preferring black for amounts >= BLACK_TOKEN_VALUE), handles token return for empty-hand bonus, and supports black/white exchange.
- **Acceptance Criteria**:
  - Initializes with WHITE_TOKEN_COUNT white and BLACK_TOKEN_COUNT black tokens
  - `distributeTokens(player, points)` gives correct token combination
  - `returnToken(player, tokenType)` moves one token back to supply
  - `exchange(player, fromType, toType)` swaps 1 black for 10 white or vice versa
  - Never goes negative in supply

### T-106: Create Round logic
- **Role**: coder-1
- **Files**: `src/game/Round.js`
- **Deps**: T-103, T-104
- **Description**: Implement the Round class managing a single round. Initializes with a dealt deck and discard pile top card. Tracks current player index, validates and executes play/draw/quit actions, advances turns (skipping quit players), detects round-end conditions.
- **Acceptance Criteria**:
  - `playCard(player, card)` validates via canPlayOn, removes from hand, updates discard top
  - `drawCard(player)` draws from deck, adds to hand
  - `quitRound(player)` sets player to quit
  - `canDraw(player)` returns false if deck empty or player is last active
  - `isRoundOver()` detects hand-empty or all-quit
  - `advanceTurn()` skips quit players, wraps around
  - `getCurrentPlayer()` returns active player

### T-107: Create Game orchestrator
- **Role**: coder-1
- **Files**: `src/game/Game.js`
- **Deps**: T-105, T-106
- **Description**: Implement the Game class coordinating multiple rounds. Creates players, manages the TokenBank, starts new rounds (advancing starting player), scores rounds (penalty + token distribution + empty-hand return), checks game-over condition.
- **Acceptance Criteria**:
  - Constructor creates PLAYER_COUNT players and a TokenBank
  - `startNewRound()` creates Deck, shuffles, deals, creates Round
  - `scoreRound()` calculates penalties with duplicate-once rule, distributes tokens
  - Empty-hand player can return one token
  - `isGameOver()` checks if any player >= GAME_OVER_THRESHOLD
  - `getWinner()` returns player with lowest totalPoints
  - Starting player advances each round

---

## Phase 2: AI Logic

### T-201: Create AI decision logic
- **Role**: coder-2
- **Files**: `src/ai/AiPlayer.js`
- **Deps**: T-106 (needs Round and Player interfaces)
- **Description**: Implement AiPlayer class with decision logic for computer opponents. Evaluates current hand, top discard card, draw pile state, and own penalty to choose the best action (play, draw, quit).
- **Acceptance Criteria**:
  - `decideAction(player, round)` returns a TurnAction (PLAY_CARD, DRAW_CARD, QUIT)
  - If returning PLAY_CARD, also returns which card to play
  - Prefers playing high-penalty cards first (Llama > 6 > 5 > ...)
  - Draws when no playable card and penalty is high
  - Quits when penalty is low and no playable card
  - Never attempts invalid actions (draw when not allowed, play invalid card)

---

## Phase 3: UI / Rendering

### T-301: Create project entry files
- **Role**: coder-2
- **Files**: `index.html`, `main.js`
- **Deps**: T-101
- **Description**: Create the HTML page that loads Cocos2d-x JS engine and the game scripts. Create main.js that configures the Cocos2d-x application (resolution CANVAS_WIDTH x CANVAS_HEIGHT, landscape), loads resources, and runs TitleScene.
- **Acceptance Criteria**:
  - index.html loads cocos2d-js engine and all src files in correct order
  - main.js sets design resolution to CANVAS_WIDTH x CANVAS_HEIGHT
  - Application starts and shows TitleScene
  - No console errors on load

### T-302: Create SceneManager utility
- **Role**: coder-2
- **Files**: `src/ui/SceneManager.js`
- **Deps**: T-301
- **Description**: Utility wrapping cc.director.runScene() with transition effects. Supports fade and slide transitions with configurable duration.
- **Acceptance Criteria**:
  - `transitionTo(scene, transitionType, duration)` works for fade and slide
  - Handles scene replacement cleanly

### T-303: Create TitleScene
- **Role**: coder-2
- **Files**: `src/ui/scenes/TitleScene.js`
- **Deps**: T-302
- **Description**: Title screen with game name, subtitle, and Start button. Positions per screens.md.
- **Acceptance Criteria**:
  - Displays "L.A.M.A." title and subtitle
  - Start button transitions to ModeSelectScene
  - All positions match screens.md spec

### T-304: Create ModeSelectScene
- **Role**: coder-2
- **Files**: `src/ui/scenes/ModeSelectScene.js`
- **Deps**: T-302
- **Description**: Mode selection with Local Multiplayer and Solo vs AI buttons, plus Back button. Stores selected mode in GameConfig.
- **Acceptance Criteria**:
  - Two mode buttons with descriptions
  - Back button returns to TitleScene
  - Selection sets GameConfig.gameMode and transitions to GameplayScene

### T-305: Create CardSprite component
- **Role**: coder-2
- **Files**: `src/ui/components/CardSprite.js`
- **Deps**: T-102, T-301
- **Description**: Visual component for a single card. Renders card value text on a card background. Supports face-up and face-down states. Handles tap/click events.
- **Acceptance Criteria**:
  - Renders card value (1-6 or Llama icon/text) at CARD_WIDTH x CARD_HEIGHT
  - Face-down mode shows card back
  - Touch/click callback fires with card reference
  - Highlight state for playable cards

### T-306: Create HandDisplay component
- **Role**: coder-2
- **Files**: `src/ui/components/HandDisplay.js`
- **Deps**: T-305
- **Description**: Renders a player's hand as a row of CardSprites. Calculates horizontal spread centered on a given position. Supports both face-up and face-down display.
- **Acceptance Criteria**:
  - Cards spread with CARD_SPACING between them
  - Centered on provided position
  - Updates when cards are added/removed
  - Supports horizontal and vertical layouts (for side players)

### T-307: Create PileDisplay component
- **Role**: coder-2
- **Files**: `src/ui/components/PileDisplay.js`
- **Deps**: T-305
- **Description**: Renders draw pile (face-down with count label) and discard pile (top card face-up).
- **Acceptance Criteria**:
  - Draw pile shows card back with remaining count
  - Discard pile shows top card face-up
  - Updates when top card changes

### T-308: Create TokenDisplay component
- **Role**: coder-2
- **Files**: `src/ui/components/TokenDisplay.js`
- **Deps**: T-301
- **Description**: Shows a player's token counts (black and white) with icons and numbers.
- **Acceptance Criteria**:
  - Displays black token count and white token count
  - Updates dynamically when tokens change
  - Compact layout fitting player panel area

### T-309: Create PlayerPanel component
- **Role**: coder-2
- **Files**: `src/ui/components/PlayerPanel.js`
- **Deps**: T-306, T-308
- **Description**: Composite component for one player's area. Combines player name label, HandDisplay, TokenDisplay, and status indicator (Active/Quit).
- **Acceptance Criteria**:
  - Positions sub-components per screens.md for each player position (bottom, left, top, right)
  - Shows player name and status
  - Current player has visual highlight

### T-310: Create ActionButtons component
- **Role**: coder-2
- **Files**: `src/ui/components/ActionButtons.js`
- **Deps**: T-301
- **Description**: Draw Card and Quit Round buttons for the active player. Draw button disables when not allowed.
- **Acceptance Criteria**:
  - Draw and Quit buttons at positions per screens.md
  - Draw button disabled state when draw pile empty or last player
  - Buttons fire callbacks to GameplayScene
  - Only visible during human player turns

### T-311: Create TurnOverlay component
- **Role**: coder-2
- **Files**: `src/ui/components/TurnOverlay.js`
- **Deps**: T-301
- **Description**: Semi-transparent overlay for local multiplayer turn transitions. Shows "Pass to Player N" and Ready button to hide previous player's hand.
- **Acceptance Criteria**:
  - Covers entire screen at Z_OVERLAY
  - Shows next player's name
  - Ready button dismisses overlay and reveals next player's hand
  - Only appears in LOCAL game mode

### T-312: Create GameplayScene
- **Role**: coder-2
- **Files**: `src/ui/scenes/GameplayScene.js`
- **Deps**: T-107, T-201, T-307, T-309, T-310, T-311
- **Description**: Main gameplay scene. Creates Game instance, renders four PlayerPanels, central PileDisplay, ActionButtons. Handles human input (card tap, draw, quit), AI turns (with delay), turn transitions, and round-end detection. Transitions to RoundResultScene when round ends.
- **Acceptance Criteria**:
  - All four players rendered at correct positions
  - Human player can tap cards to play, use Draw/Quit buttons
  - AI players take turns with visible delay
  - Turn indicator shows current player
  - Local mode: turn overlay between human players
  - AI mode: only bottom player is interactive
  - Transitions to RoundResultScene on round end

### T-313: Create RoundResultScene
- **Role**: coder-2
- **Files**: `src/ui/scenes/RoundResultScene.js`
- **Deps**: T-302
- **Description**: Displays round scoring table. Shows each player's remaining cards, round penalty, and cumulative total. Continue button leads to next round or final results.
- **Acceptance Criteria**:
  - Table with 4 player rows showing cards left, round points, total points
  - Indicates who emptied hand or if all quit
  - Token return info displayed
  - Continue button text changes based on game-over state
  - Correct transition to GameplayScene or FinalScoreScene

### T-314: Create FinalScoreScene
- **Role**: coder-2
- **Files**: `src/ui/scenes/FinalScoreScene.js`
- **Deps**: T-302
- **Description**: Final scoreboard. Sorted player rankings, winner highlight, Play Again and Main Menu buttons.
- **Acceptance Criteria**:
  - Players sorted by points ascending
  - Winner banner with player name
  - Play Again starts new game in same mode
  - Main Menu returns to TitleScene
  - Tie handling (shared victory display)

---

## Phase 4: Testing

### T-401: Write Card tests
- **Role**: tester
- **Files**: `tests/CardTest.js`
- **Deps**: T-102
- **Description**: Unit tests for Card model. Cover construction, canPlayOn for all valid/invalid combinations including wrap, and getPenaltyValue.
- **Acceptance Criteria**:
  - Tests card creation for each CardValue
  - Tests canPlayOn: same value (pass), +1 (pass), +2 (fail), 6->Llama (pass), Llama->1 (pass), Llama->2 (fail)
  - Tests getPenaltyValue for all values
  - All tests pass

### T-402: Write Deck tests
- **Role**: tester
- **Files**: `tests/DeckTest.js`
- **Deps**: T-103
- **Description**: Unit tests for Deck model. Cover creation count, shuffle changes order, deal removes cards, draw behavior, empty state.
- **Acceptance Criteria**:
  - New deck has TOTAL_CARDS cards
  - After deal(HAND_SIZE_INITIAL * PLAYER_COUNT + 1), remaining is correct
  - draw() returns card and decrements count
  - draw() on empty returns null
  - isEmpty() correct at boundaries

### T-403: Write Player tests
- **Role**: tester
- **Files**: `tests/PlayerTest.js`
- **Deps**: T-104
- **Description**: Unit tests for Player model. Cover hand management, quit status, playable card check, penalty calculation with duplicates.
- **Acceptance Criteria**:
  - addCard/removeCard manage hand correctly
  - hasPlayableCard checks all cards against top
  - quit() and isActive() state transitions
  - getHandPenalty() with no duplicates
  - getHandPenalty() with duplicates (counts value once)
  - getHandPenalty() with multiple Llamas (counts 10 once)
  - totalPoints() sums tokens correctly

### T-404: Write Round tests
- **Role**: tester
- **Files**: `tests/RoundTest.js`
- **Deps**: T-106
- **Description**: Unit tests for Round logic. Cover play validation, draw restrictions, quit behavior, turn advancement, round end detection.
- **Acceptance Criteria**:
  - playCard succeeds for valid card, fails for invalid
  - drawCard adds to hand, fails when deck empty
  - canDraw returns false for last active player
  - quitRound sets player status
  - advanceTurn skips quit players
  - isRoundOver detects empty hand
  - isRoundOver detects all quit

### T-405: Write Game tests
- **Role**: tester
- **Files**: `tests/GameTest.js`
- **Deps**: T-107
- **Description**: Unit tests for Game orchestrator. Cover round lifecycle, scoring, token distribution, empty-hand bonus, game-over detection, winner selection.
- **Acceptance Criteria**:
  - startNewRound creates valid round
  - scoreRound calculates penalties correctly
  - Token distribution uses correct denominations
  - Empty-hand player can return one token
  - isGameOver triggers at GAME_OVER_THRESHOLD
  - getWinner returns lowest-scoring player
  - Tie-breaking works

### T-406: Write TokenBank tests
- **Role**: tester
- **Files**: `tests/TokenBankTest.js`
- **Deps**: T-105
- **Description**: Unit tests for TokenBank. Cover distribution, return, exchange, supply limits.
- **Acceptance Criteria**:
  - distributeTokens gives correct black/white split
  - returnToken moves token back to supply
  - exchange swaps at correct rate
  - Supply never goes negative

### T-407: Write AiPlayer tests
- **Role**: tester
- **Files**: `tests/AiPlayerTest.js`
- **Deps**: T-201
- **Description**: Unit tests for AI decision logic. Test action selection under various game states.
- **Acceptance Criteria**:
  - AI plays a card when valid play exists
  - AI prefers high-penalty cards
  - AI draws when no play available and penalty is high
  - AI quits when no play and penalty is low
  - AI never returns invalid action
  - AI handles empty draw pile correctly

### T-408: Create test runner
- **Role**: tester
- **Files**: `tests/testRunner.html`
- **Deps**: T-401
- **Description**: HTML page that loads all test files and runs them. Outputs results to console and page.
- **Acceptance Criteria**:
  - Loads all test files
  - Runs all tests and reports pass/fail
  - Summary of total/passed/failed

---

## Phase 5: Review

### T-501: Code review - core game logic
- **Role**: reviewer
- **Files**: `src/game/*`, `src/constants.js`
- **Deps**: T-107, T-401 through T-406
- **Description**: Review all core game files for correctness, code quality, naming conventions, no magic numbers, methods under 30 lines, proper separation of concerns.
- **Acceptance Criteria**:
  - No hard-coded strings or numbers
  - All methods under 30 lines
  - Logic matches GDD rules exactly
  - Clean separation: no UI code in game modules
  - Consistent naming conventions

### T-502: Code review - AI and UI
- **Role**: reviewer
- **Files**: `src/ai/*`, `src/ui/*`, `main.js`, `index.html`
- **Deps**: T-314, T-407
- **Description**: Review AI logic and all UI files. Check visual layout matches screens.md, scene transitions match scene-flow.md, proper use of Cocos2d-x APIs.
- **Acceptance Criteria**:
  - AI logic is sound and never produces invalid actions
  - UI positions match screens.md specifications
  - Scene transitions match scene-flow.md
  - Proper Cocos2d-x 3.1x API usage
  - No game logic in UI layer (only calls into game modules)
  - Components are reusable and clean

### T-503: Code review - tests
- **Role**: reviewer
- **Files**: `tests/*`
- **Deps**: T-408
- **Description**: Review all test files for coverage, correctness, and quality. Ensure edge cases are tested.
- **Acceptance Criteria**:
  - All game rules have corresponding tests
  - Edge cases covered (empty deck, all quit, wrap plays, duplicate scoring)
  - Tests are independent and deterministic
  - No false positives

---

## Task Dependency Graph

```
T-101 (constants)
  |
  +---> T-102 (Card) ---> T-103 (Deck)
  |       |                  |
  |       +---> T-104 (Player)
  |       |       |
  |       |       +---> T-105 (TokenBank)
  |       |       |       |
  |       +-------+---> T-106 (Round)
  |                       |       |
  |                       |       +---> T-201 (AI) ---> T-407 (AI tests)
  |                       |
  |               T-105 --+---> T-107 (Game)
  |                               |
  |                               +---> T-405 (Game tests)
  |
  +---> T-301 (entry files) ---> T-302 (SceneManager)
          |                        |
          +---> T-305 (CardSprite) +---> T-303 (TitleScene)
                  |                +---> T-304 (ModeSelectScene)
                  +---> T-306 (HandDisplay)
                  |       |
                  +---> T-307 (PileDisplay)
                          |
                  T-308 (TokenDisplay)
                    |
                    +---> T-309 (PlayerPanel)
                            |
                  T-310 (ActionButtons)
                    |
                  T-311 (TurnOverlay)
                    |
                    +---> T-312 (GameplayScene)
                            |
                    T-313 (RoundResultScene)
                    T-314 (FinalScoreScene)

  T-102 ---> T-401 (Card tests)
  T-103 ---> T-402 (Deck tests)
  T-104 ---> T-403 (Player tests)
  T-106 ---> T-404 (Round tests)
  T-105 ---> T-406 (TokenBank tests)

  Tests ---> T-408 (test runner)
  T-107 + tests ---> T-501 (review core)
  T-314 + T-407 ---> T-502 (review AI + UI)
  T-408 ---> T-503 (review tests)
```

## Parallel Work Streams

The following tasks can proceed in parallel without file conflicts:

| Stream | Owner | Tasks (in order) |
|---|---|---|
| Core Logic | coder-1 | T-101 -> T-102 -> T-103 -> T-104 -> T-105 -> T-106 -> T-107 |
| AI + UI | coder-2 | T-201 (after T-106), T-301 -> T-302 -> T-303/T-304 -> T-305 -> T-306/T-307/T-308 -> T-309/T-310/T-311 -> T-312 -> T-313/T-314 |
| Testing | tester | T-401 (after T-102), T-402 (after T-103), T-403 (after T-104), T-404 (after T-106), T-405 (after T-107), T-406 (after T-105), T-407 (after T-201), T-408 |
| Review | reviewer | T-501 (after core + tests), T-502 (after UI + AI tests), T-503 (after test runner) |
