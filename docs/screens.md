# L.A.M.A. - Screen Layout Documentation

## Display Constants

| Constant | Value | Description |
|---|---|---|
| CANVAS_WIDTH | 960 | Game canvas width in pixels |
| CANVAS_HEIGHT | 640 | Game canvas height in pixels |
| CARD_WIDTH | 70 | Card sprite width |
| CARD_HEIGHT | 100 | Card sprite height |
| CARD_SPACING | 12 | Horizontal gap between cards in hand |
| TOKEN_SIZE | 30 | Token sprite diameter |
| TOKEN_SPACING | 8 | Gap between token indicators |
| FONT_SIZE_TITLE | 48 | Title text size |
| FONT_SIZE_HEADING | 32 | Heading/name text size |
| FONT_SIZE_BODY | 24 | Body/score text size |
| FONT_SIZE_SMALL | 18 | Small label text size |
| BUTTON_WIDTH | 200 | Standard button width |
| BUTTON_HEIGHT | 60 | Standard button height |
| BUTTON_SPACING | 20 | Gap between buttons |
| Z_BACKGROUND | 0 | Background layer z-order |
| Z_CARDS | 10 | Card sprites z-order |
| Z_TOKENS | 15 | Token display z-order |
| Z_UI | 20 | UI elements z-order |
| Z_OVERLAY | 30 | Overlay/modal z-order |
| Z_POPUP | 40 | Popup/dialog z-order |

---

## Screen 1: Title Screen

**Purpose**: Game entry point with title and start button.

### Layout

| Element | X | Y | Width | Height | Z | Anchor | Notes |
|---|---|---|---|---|---|---|---|
| Background | 480 | 320 | 960 | 640 | Z_BACKGROUND | center | Solid color or image |
| Game Title "L.A.M.A." | 480 | 420 | - | - | Z_UI | center | FONT_SIZE_TITLE, centered |
| Subtitle | 480 | 360 | - | - | Z_UI | center | FONT_SIZE_BODY, "Drop All Your Minus Points" |
| Start Button | 480 | 240 | BUTTON_WIDTH | BUTTON_HEIGHT | Z_UI | center | Label: "START" |
| Version Label | 480 | 40 | - | - | Z_UI | center | FONT_SIZE_SMALL |

### Transitions
- **Start Button** -> Mode Select Screen

---

## Screen 2: Mode Select Screen

**Purpose**: Choose between Local Multiplayer and Solo vs AI.

### Layout

| Element | X | Y | Width | Height | Z | Anchor | Notes |
|---|---|---|---|---|---|---|---|
| Background | 480 | 320 | 960 | 640 | Z_BACKGROUND | center | |
| Header "Select Mode" | 480 | 520 | - | - | Z_UI | center | FONT_SIZE_HEADING |
| Local Multiplayer Button | 480 | 370 | 300 | BUTTON_HEIGHT | Z_UI | center | "Local Multiplayer" |
| Mode Desc (Local) | 480 | 330 | - | - | Z_UI | center | FONT_SIZE_SMALL, "4 players, same device" |
| Solo vs AI Button | 480 | 240 | 300 | BUTTON_HEIGHT | Z_UI | center | "Solo vs AI" |
| Mode Desc (AI) | 480 | 200 | - | - | Z_UI | center | FONT_SIZE_SMALL, "You vs 3 AI opponents" |
| Back Button | 100 | 40 | 140 | 50 | Z_UI | center | "Back" |

### Transitions
- **Local Multiplayer** -> Gameplay Screen (mode=LOCAL)
- **Solo vs AI** -> Gameplay Screen (mode=AI)
- **Back** -> Title Screen

---

## Screen 3: Gameplay Screen

**Purpose**: Main game interface where rounds are played.

### Layout Regions

The screen is divided into regions for each player and the central play area.

#### Central Play Area

| Element | X | Y | Width | Height | Z | Anchor | Notes |
|---|---|---|---|---|---|---|---|
| Draw Pile | 410 | 320 | CARD_WIDTH | CARD_HEIGHT | Z_CARDS | center | Face-down card stack |
| Draw Pile Count | 410 | 258 | - | - | Z_UI | center | FONT_SIZE_SMALL, remaining count |
| Discard Pile | 550 | 320 | CARD_WIDTH | CARD_HEIGHT | Z_CARDS | center | Top card face-up |
| Turn Indicator | 480 | 400 | - | - | Z_UI | center | "Player N's Turn" |

#### Player 0 (Bottom - Current/Human Player in AI mode)

| Element | X | Y | Width | Height | Z | Anchor | Notes |
|---|---|---|---|---|---|---|---|
| Player Name | 480 | 148 | - | - | Z_UI | center | FONT_SIZE_BODY |
| Hand Cards | centered at 480 | 80 | dynamic | CARD_HEIGHT | Z_CARDS | center | Face-up, spread horizontally. Total width = N * CARD_WIDTH + (N-1) * CARD_SPACING. Start X = 480 - totalWidth/2 + CARD_WIDTH/2 |
| Token Display | 800 | 80 | - | - | Z_TOKENS | center | Black + White token counts |
| Status Label | 480 | 20 | - | - | Z_UI | center | FONT_SIZE_SMALL, "Active" / "Quit" |

#### Player 1 (Left)

| Element | X | Y | Width | Height | Z | Anchor | Notes |
|---|---|---|---|---|---|---|---|
| Player Name | 80 | 450 | - | - | Z_UI | center | FONT_SIZE_BODY, rotated 90deg |
| Hand Cards | 60 | 320 | CARD_HEIGHT | dynamic | Z_CARDS | center | Face-down (or up in local mode). Spread vertically |
| Card Count | 60 | 220 | - | - | Z_UI | center | FONT_SIZE_SMALL, "N cards" |
| Token Display | 80 | 550 | - | - | Z_TOKENS | center | |

#### Player 2 (Top)

| Element | X | Y | Width | Height | Z | Anchor | Notes |
|---|---|---|---|---|---|---|---|
| Player Name | 480 | 600 | - | - | Z_UI | center | FONT_SIZE_BODY |
| Hand Cards | centered at 480 | 560 | dynamic | CARD_HEIGHT | Z_CARDS | center | Face-down (or up in local mode). Spread horizontally |
| Card Count | 680 | 560 | - | - | Z_UI | center | FONT_SIZE_SMALL |
| Token Display | 800 | 560 | - | - | Z_TOKENS | center | |

#### Player 3 (Right)

| Element | X | Y | Width | Height | Z | Anchor | Notes |
|---|---|---|---|---|---|---|---|
| Player Name | 880 | 450 | - | - | Z_UI | center | FONT_SIZE_BODY, rotated -90deg |
| Hand Cards | 900 | 320 | CARD_HEIGHT | dynamic | Z_CARDS | center | Face-down (or up in local mode). Spread vertically |
| Card Count | 900 | 220 | - | - | Z_UI | center | FONT_SIZE_SMALL |
| Token Display | 880 | 550 | - | - | Z_TOKENS | center | |

#### Action Buttons (visible on active player's turn)

| Element | X | Y | Width | Height | Z | Anchor | Notes |
|---|---|---|---|---|---|---|---|
| Draw Button | 310 | 200 | 140 | 50 | Z_UI | center | "Draw Card" |
| Quit Button | 650 | 200 | 140 | 50 | Z_UI | center | "Quit Round" |

- **Play action**: Player taps/clicks a valid card in their hand
- **Draw Button**: Disabled when draw pile empty or last player standing
- **Quit Button**: Always available for active players

#### Local Multiplayer Turn Transition Overlay

| Element | X | Y | Width | Height | Z | Anchor | Notes |
|---|---|---|---|---|---|---|---|
| Overlay BG | 480 | 320 | 960 | 640 | Z_OVERLAY | center | Semi-transparent black |
| Prompt Text | 480 | 360 | - | - | Z_POPUP | center | "Pass to Player N" |
| Ready Button | 480 | 280 | BUTTON_WIDTH | BUTTON_HEIGHT | Z_POPUP | center | "Ready" |

---

## Screen 4: Round Results Screen

**Purpose**: Show scores after each round ends.

### Layout

| Element | X | Y | Width | Height | Z | Anchor | Notes |
|---|---|---|---|---|---|---|---|
| Background | 480 | 320 | 960 | 640 | Z_BACKGROUND | center | |
| Header "Round Results" | 480 | 570 | - | - | Z_UI | center | FONT_SIZE_HEADING |
| Results Table | 480 | 380 | 700 | 280 | Z_UI | center | 4 rows, columns: Player, Cards Left, Round Pts, Total Pts |
| Table Header Row | 480 | 490 | - | - | Z_UI | center | Column headers |
| Player 0 Row | 480 | 440 | - | - | Z_UI | center | |
| Player 1 Row | 480 | 390 | - | - | Z_UI | center | |
| Player 2 Row | 480 | 340 | - | - | Z_UI | center | |
| Player 3 Row | 480 | 290 | - | - | Z_UI | center | |
| Winner Label | 480 | 220 | - | - | Z_UI | center | "Player N emptied hand! Returns 1 token." or "All players quit." |
| Continue Button | 480 | 100 | BUTTON_WIDTH | BUTTON_HEIGHT | Z_UI | center | "Next Round" or "Final Results" |

### Transitions
- **Continue (not game over)** -> Gameplay Screen (next round)
- **Continue (game over)** -> Final Scoreboard Screen

---

## Screen 5: Final Scoreboard Screen

**Purpose**: Display final results and winner.

### Layout

| Element | X | Y | Width | Height | Z | Anchor | Notes |
|---|---|---|---|---|---|---|---|
| Background | 480 | 320 | 960 | 640 | Z_BACKGROUND | center | |
| Header "Game Over" | 480 | 570 | - | - | Z_UI | center | FONT_SIZE_TITLE |
| Winner Banner | 480 | 500 | 600 | 60 | Z_UI | center | "Player N Wins!" FONT_SIZE_HEADING |
| Final Scores Table | 480 | 350 | 700 | 200 | Z_UI | center | Sorted by points ascending |
| Rank Column | - | - | - | - | Z_UI | - | 1st, 2nd, 3rd, 4th |
| Player Column | - | - | - | - | Z_UI | - | Player names |
| Points Column | - | - | - | - | Z_UI | - | Final point totals |
| Play Again Button | 340 | 100 | BUTTON_WIDTH | BUTTON_HEIGHT | Z_UI | center | "Play Again" |
| Main Menu Button | 620 | 100 | BUTTON_WIDTH | BUTTON_HEIGHT | Z_UI | center | "Main Menu" |

### Transitions
- **Play Again** -> Gameplay Screen (same mode, new game)
- **Main Menu** -> Title Screen
