# L.A.M.A. - API Reference

## constants.js

Shared enums, rule constants, and display values. All modules import from here.

**Enums**: `CardValue`, `GameMode`, `TurnAction`, `PlayerStatus`, `TokenType`, `RoundEndReason`
**Rule constants**: `COPIES_PER_VALUE`, `TOTAL_CARDS`, `PLAYER_COUNT`, `HAND_SIZE_INITIAL`, `WHITE_TOKEN_VALUE`, `BLACK_TOKEN_VALUE`, `WHITE_TOKEN_COUNT`, `BLACK_TOKEN_COUNT`, `GAME_OVER_THRESHOLD`, `LLAMA_PENALTY`
**Lookup maps**: `ALL_CARD_VALUES`, `NEXT_VALUE`, `PENALTY_VALUES`
**Display**: `Display` object with canvas, card, token, font, button, and z-order values

---

## Card (`src/game/Card.js`)

Immutable card with a value from `CardValue`. Frozen after construction.

| Method | Signature | Returns | Description |
|---|---|---|---|
| constructor | `Card(cardValue)` | Card | Throws if value is not in `ALL_CARD_VALUES` |
| getValue | `getValue()` | number or string | The card's value (1-6 or 'Llama') |
| canPlayOn | `canPlayOn(topCard)` | boolean | True if same value or exactly one step higher (wraps: Llama follows 6, 1 follows Llama) |
| getPenaltyValue | `getPenaltyValue()` | number | Penalty points (face value for 1-6, 10 for Llama) |
| toString | `toString()` | string | Debug string like `Card(3)` |

---

## Deck (`src/game/Deck.js`)

56-card draw pile. Cards drawn from the top (end of internal array).

| Method | Signature | Returns | Description |
|---|---|---|---|
| constructor | `Deck()` | Deck | Creates 8 copies of each of 7 card values |
| shuffle | `shuffle()` | Deck | Fisher-Yates in-place shuffle; returns self for chaining |
| deal | `deal(count)` | Card[] | Removes and returns top N cards; throws if not enough |
| draw | `draw()` | Card or null | Removes and returns top card, or null if empty |
| peek | `peek()` | Card or null | Returns top card without removing it |
| isEmpty | `isEmpty()` | boolean | True when no cards remain |
| remaining | `remaining()` | number | Count of cards left |

---

## Player (`src/game/Player.js`)

Player state: hand of cards, token counts, active/quit status. Penalty uses the duplicate-counts-once rule.

| Method | Signature | Returns | Description |
|---|---|---|---|
| constructor | `Player(index)` | Player | Seat index 0-3, empty hand, zero tokens, active |
| getIndex | `getIndex()` | number | Player seat index |
| addCard | `addCard(card)` | void | Adds one card to hand |
| addCards | `addCards(cards)` | void | Adds an array of cards to hand |
| removeCard | `removeCard(card)` | void | Removes card by reference; throws if not found |
| getHand | `getHand()` | Card[] | Shallow copy of hand |
| getHandSize | `getHandSize()` | number | Number of cards in hand |
| hasEmptyHand | `hasEmptyHand()` | boolean | True if hand is empty |
| hasPlayableCard | `hasPlayableCard(topCard)` | boolean | True if any card can play on topCard |
| getPlayableCards | `getPlayableCards(topCard)` | Card[] | All cards that can play on topCard |
| quit | `quit()` | void | Sets status to QUIT |
| isActive | `isActive()` | boolean | True if status is ACTIVE |
| getStatus | `getStatus()` | string | PlayerStatus value |
| resetForRound | `resetForRound()` | void | Clears hand, resets to ACTIVE |
| getHandPenalty | `getHandPenalty()` | number | Sum of penalty for distinct card values in hand |
| totalPoints | `totalPoints()` | number | White tokens + black tokens * 10 |
| getWhiteTokens | `getWhiteTokens()` | number | White token count |
| getBlackTokens | `getBlackTokens()` | number | Black token count |
| addWhiteTokens | `addWhiteTokens(n)` | void | Add (or subtract with negative) white tokens |
| addBlackTokens | `addBlackTokens(n)` | void | Add (or subtract with negative) black tokens |

---

## TokenBank (`src/game/TokenBank.js`)

Shared token supply. White = 1 point, Black = 10 points.

| Method | Signature | Returns | Description |
|---|---|---|---|
| constructor | `TokenBank()` | TokenBank | 50 white, 20 black tokens |
| getWhiteSupply | `getWhiteSupply()` | number | White tokens remaining in supply |
| getBlackSupply | `getBlackSupply()` | number | Black tokens remaining in supply |
| distributeTokens | `distributeTokens(player, points)` | {black, white} | Gives player tokens totaling points; prefers black, respects supply limits |
| returnToken | `returnToken(player, tokenType)` | boolean | Player returns one token to supply; false if player has none |
| returnBestToken | `returnBestToken(player)` | string or null | Returns best token (black first); used for empty-hand bonus |
| exchange | `exchange(player, fromType)` | boolean | Swaps 1 black for 10 white or vice versa; false if insufficient |

---

## Round (`src/game/Round.js`)

Single round: deals cards, manages turns, validates actions, detects round end.

| Method | Signature | Returns | Description |
|---|---|---|---|
| constructor | `Round(players, deck, startingPlayerIndex)` | Round | Deals 6 cards each, flips top card to start discard |
| getTopCard | `getTopCard()` | Card | Current discard pile top card |
| getCurrentPlayerIndex | `getCurrentPlayerIndex()` | number | Index of current player |
| getCurrentPlayer | `getCurrentPlayer()` | Player | The player whose turn it is |
| getDeck | `getDeck()` | Deck | The draw pile |
| getPlayers | `getPlayers()` | Player[] | All players in the round |
| isRoundOver | `isRoundOver()` | boolean | True if round has ended |
| getRoundEndReason | `getRoundEndReason()` | string or null | RoundEndReason value |
| getHandEmptyPlayer | `getHandEmptyPlayer()` | Player or null | Player who emptied their hand |
| getActivePlayerCount | `getActivePlayerCount()` | number | Count of non-quit players |
| getValidActions | `getValidActions(player)` | string[] | Available TurnAction values for this player |
| playCard | `playCard(player, card)` | Card | Validates and plays card; throws on invalid |
| drawCard | `drawCard(player)` | Card | Draws from deck; throws if cannot draw |
| quitRound | `quitRound(player)` | void | Player quits; checks round end |
| canDraw | `canDraw(player)` | boolean | False if deck empty or last active player |
| advanceTurn | `advanceTurn()` | number | Moves to next active player, skipping quit; returns new index |

---

## Game (`src/game/Game.js`)

Multi-round orchestrator: rounds, scoring, token tracking, game-over detection.

| Method | Signature | Returns | Description |
|---|---|---|---|
| constructor | `Game(gameMode)` | Game | Creates 4 players, a TokenBank, random starting player |
| getPlayers | `getPlayers()` | Player[] | All 4 players |
| getTokenBank | `getTokenBank()` | TokenBank | The shared token supply |
| getCurrentRound | `getCurrentRound()` | Round or null | Active round |
| getRoundNumber | `getRoundNumber()` | number | Current round count |
| getGameMode | `getGameMode()` | string | GameMode value |
| getStartingPlayerIndex | `getStartingPlayerIndex()` | number | Who starts the next round |
| startNewRound | `startNewRound()` | Round | Resets players, creates shuffled deck, deals, returns new Round |
| scoreRound | `scoreRound()` | object | Calculates penalties, distributes tokens, handles empty-hand bonus, advances starting player. Returns summary with per-player data |
| isGameOver | `isGameOver()` | boolean | True if any player has >= 40 points |
| getWinners | `getWinners()` | Player[] | Player(s) with lowest total points (handles ties) |
| getStandings | `getStandings()` | Player[] | All players sorted by points ascending |

---

## AiPlayer (`src/ai/AiPlayer.js`)

AI decision logic for computer opponents.

| Method | Signature | Returns | Description |
|---|---|---|---|
| decideAction | `AiPlayer.decideAction(player, round)` | {action, card} | Returns best action: plays highest-penalty card if available, draws if penalty > 5 and draw allowed, otherwise quits. `card` is null for draw/quit actions |
