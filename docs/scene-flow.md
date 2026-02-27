# L.A.M.A. - Scene Flow Diagram

## Scene Registry

| Scene ID | Class Name | Description |
|---|---|---|
| SCENE_TITLE | TitleScene | Entry point, game branding |
| SCENE_MODE_SELECT | ModeSelectScene | Choose game mode |
| SCENE_GAMEPLAY | GameplayScene | Main round play |
| SCENE_ROUND_RESULT | RoundResultScene | End-of-round scoring |
| SCENE_FINAL_SCORE | FinalScoreScene | Game over, final standings |

## Transition Diagram

```
+----------------+
|  SCENE_TITLE   |
|  (TitleScene)  |
+-------+--------+
        |
        | [Start Button pressed]
        v
+-------------------+
| SCENE_MODE_SELECT |
| (ModeSelectScene) |
+-------+-----------+
        |
        +---> [Back Button] ---> SCENE_TITLE
        |
        | [Local Multiplayer OR Solo vs AI selected]
        | (sets GameConfig.gameMode = LOCAL or AI)
        v
+------------------+
| SCENE_GAMEPLAY   |<------------------------------------------+
| (GameplayScene)  |                                           |
+-------+----------+                                           |
        |                                                      |
        | [Round ends: hand emptied OR all quit]               |
        v                                                      |
+---------------------+                                       |
| SCENE_ROUND_RESULT  |                                       |
| (RoundResultScene)  |                                       |
+-------+-------------+                                       |
        |                                                      |
        +---> [No player >= GAME_OVER_THRESHOLD] -------------+
        |     [Continue Button -> next round]
        |
        | [Any player >= GAME_OVER_THRESHOLD]
        | [Continue Button -> final results]
        v
+---------------------+
| SCENE_FINAL_SCORE   |
| (FinalScoreScene)   |
+-------+-------------+
        |
        +---> [Play Again Button] ---> SCENE_GAMEPLAY
        |     (same mode, reset all scores)
        |
        +---> [Main Menu Button] ---> SCENE_TITLE
```

## Transition Details

### SCENE_TITLE -> SCENE_MODE_SELECT
- **Trigger**: User presses "Start" button
- **Data passed**: None
- **Transition effect**: Slide left

### SCENE_MODE_SELECT -> SCENE_TITLE
- **Trigger**: User presses "Back" button
- **Data passed**: None
- **Transition effect**: Slide right

### SCENE_MODE_SELECT -> SCENE_GAMEPLAY
- **Trigger**: User selects "Local Multiplayer" or "Solo vs AI"
- **Data passed**: GameConfig { gameMode: LOCAL | AI }
- **Actions on enter**: Initialize new Game, deal first round
- **Transition effect**: Fade

### SCENE_GAMEPLAY -> SCENE_ROUND_RESULT
- **Trigger**: Round end condition met
- **Data passed**: RoundResult { playerHands, roundScores, totalScores, roundWinner, tokenChanges }
- **Transition effect**: Fade

### SCENE_ROUND_RESULT -> SCENE_GAMEPLAY
- **Trigger**: Continue button AND no player >= GAME_OVER_THRESHOLD
- **Data passed**: Game state (preserved from previous round)
- **Actions on enter**: Deal new round, advance starting player
- **Transition effect**: Fade

### SCENE_ROUND_RESULT -> SCENE_FINAL_SCORE
- **Trigger**: Continue button AND any player >= GAME_OVER_THRESHOLD
- **Data passed**: FinalResult { playerScores, winner }
- **Transition effect**: Fade

### SCENE_FINAL_SCORE -> SCENE_GAMEPLAY
- **Trigger**: "Play Again" button
- **Data passed**: GameConfig { gameMode: same as previous }
- **Actions on enter**: Full game reset, new Game, deal first round
- **Transition effect**: Fade

### SCENE_FINAL_SCORE -> SCENE_TITLE
- **Trigger**: "Main Menu" button
- **Data passed**: None
- **Actions on enter**: Full state cleanup
- **Transition effect**: Slide right

## Gameplay Scene Internal States

Within SCENE_GAMEPLAY, the following sub-states exist (managed by game logic, not separate scenes):

```
ROUND_START
    |
    v
PLAYER_TURN_START ---> [Show turn transition overlay in Local mode]
    |
    v
AWAITING_ACTION
    |
    +---> PLAY_CARD ---> [Animate card] ---> CHECK_ROUND_END
    +---> DRAW_CARD ---> [Animate draw] ---> NEXT_TURN
    +---> QUIT_ROUND ---> [Flip cards down] ---> CHECK_ROUND_END

CHECK_ROUND_END
    |
    +---> [Hand empty OR all quit] ---> ROUND_END ---> SCENE_ROUND_RESULT
    +---> [Round continues] ---> NEXT_TURN

NEXT_TURN
    |
    v
    [Advance to next active player] ---> PLAYER_TURN_START
```

### AI Turn Flow (Solo vs AI mode)
When the current player is AI-controlled:
1. PLAYER_TURN_START triggers AI decision logic
2. Brief delay (AI_THINK_DELAY_MS = 800) for visual feedback
3. AI action is executed and animated
4. Flow continues to CHECK_ROUND_END or NEXT_TURN
