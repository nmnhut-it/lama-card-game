# L.A.M.A. - Game Design Document

## Overview
L.A.M.A. (Lege Alle Minuspunkte Ab / "Drop All Your Minus Points") is a card game where players try to minimize their penalty points across multiple rounds. The game ends when any player reaches the point threshold, and the player with the fewest points wins.

## Constants

| Constant | Value | Description |
|---|---|---|
| CARD_VALUES | 1, 2, 3, 4, 5, 6, Llama | Seven distinct card types |
| COPIES_PER_VALUE | 8 | Cards of each type in the deck |
| TOTAL_CARDS | 56 | 7 types x 8 copies |
| PLAYER_COUNT | 4 | Exactly 4 players per game |
| HAND_SIZE_INITIAL | 6 | Cards dealt to each player at round start |
| WHITE_TOKEN_VALUE | 1 | Point value of a white token |
| BLACK_TOKEN_VALUE | 10 | Point value of a black token |
| WHITE_TOKEN_COUNT | 50 | White tokens in the supply |
| BLACK_TOKEN_COUNT | 20 | Black tokens in the supply |
| TOTAL_TOKENS | 70 | Total tokens in the supply |
| GAME_OVER_THRESHOLD | 40 | Points that trigger game end |
| LLAMA_PENALTY | 10 | Penalty points for Llama cards |

## Card Composition
- **Number cards**: Values 1 through 6, with 8 copies each (48 cards)
- **Llama cards**: 8 copies (8 cards)
- **Total**: 56 cards

## Token System
- **White tokens**: Worth 1 point each, 50 in supply
- **Black tokens**: Worth 10 points each, 20 in supply
- Players receive tokens as penalty; fewer tokens = better
- Players may exchange 1 black token for 10 white tokens and vice versa at any time

## Game Modes
1. **Local Multiplayer**: 4 human players on the same device, taking turns
2. **Solo vs AI**: 1 human player + 3 AI-controlled opponents

## Setup (Per Round)
1. Shuffle all 56 cards into a draw pile
2. Deal HAND_SIZE_INITIAL (6) cards to each player
3. Flip the top card of the draw pile face-up to start the discard pile
4. The starting player is determined (first round: random; subsequent rounds: player left of previous round starter)

## Turn Actions
On their turn, an active (non-quit) player must choose exactly one action:

### 1. Play a Card
- Play a card from hand onto the discard pile
- **Valid plays**: The card must match the top discard value OR be exactly one value higher
- **Wrap rule**: 6 can be followed by Llama; Llama can be followed by 1
- **Value order**: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> Llama -> 1 (wraps)

### 2. Draw a Card
- Take the top card from the draw pile and add it to hand
- **Restriction**: Cannot draw if the draw pile is empty
- **Restriction**: Cannot draw if the player is the only active player remaining

### 3. Quit the Round
- Place all cards in hand face-down (they still count for scoring)
- The player takes no more turns this round
- A player who has quit cannot return to play

## Round End Conditions
A round ends when either:
1. **A player empties their hand** by playing their last card
2. **All players have quit** the round

### Last Player Standing Rule
If all other players have quit and only one player remains active, that player:
- Can still play cards
- **Cannot draw** from the draw pile
- Can quit (ending the round since all players would then have quit)

## Scoring (End of Round)
Each player scores penalty points based on cards remaining in their hand (including face-down cards from quitting):

| Card | Penalty Points |
|---|---|
| 1 | 1 |
| 2 | 2 |
| 3 | 3 |
| 4 | 4 |
| 5 | 5 |
| 6 | 6 |
| Llama | 10 |

### Duplicate Rule
If a player holds multiple copies of the same card value, **that value is only counted once**. For example, three 5s in hand = 5 penalty points (not 15).

### Token Assignment
- Penalty points are paid in tokens from the supply
- Use black tokens (10 pts) where possible, white tokens (1 pt) for remainder

### Token Return (Empty Hand Bonus)
If a player empties their hand (played their last card), they may **return one token of their choice** to the supply:
- Return 1 black token (saves 10 points), OR
- Return 1 white token (saves 1 point)
- This is optional only in the sense that a player with zero tokens has nothing to return

## Game End
1. After scoring a round, check if **any player has reached or exceeded GAME_OVER_THRESHOLD (40) points**
2. If yes, the game ends immediately
3. The player with the **fewest total points wins**
4. In case of a tie, tied players share the victory

## Turn Order
- Play proceeds clockwise (player indices 0 -> 1 -> 2 -> 3 -> 0)
- Players who have quit are skipped
- The round continues cycling through active players until a round end condition is met
