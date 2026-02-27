# L.A.M.A. - Final Project Report

## Project Overview

L.A.M.A. (Lege Alle Minuspunkte Ab / "Drop All Your Minus Points") is an HTML5 card game built with Cocos2d-JS v3.13. Players minimize penalty points across rounds by playing cards, drawing, or quitting. The game ends when any player reaches 40 points; lowest score wins.

- **Live**: https://nmnhut-it.github.io/lama-card-game/
- **Repo**: https://github.com/nmnhut-it/lama-card-game

## Development Workflow

```
 ┌─────────┐    ┌─────────────┐    ┌──────────┐    ┌─────────────────┐
 │  Human   │───>│ Claude Code  │───>│    PM    │───>│  Coders (x2)    │
 │ instruct │    │ creates team │    │writes docs│   │implement parallel│
 └─────────┘    └─────────────┘    └──────────┘    └────────┬────────┘
                                                            │
                  ┌──────────┐    ┌──────────┐    ┌────────v────────┐
                  │  Human   │<───│ Reviewer │<───│     Tester      │
                  │visual QA │    │  audits  │    │  writes tests   │
                  └────┬─────┘    └─────┬────┘    └─────────────────┘
                       │                │
                       v                v
                  ┌──────────┐    ┌──────────┐    ┌─────────────────┐
                  │  Polish  │    │Fix agents│    │     Deploy      │
                  │  team    │───>│ resolve  │───>│ to GitHub Pages │
                  └──────────┘    └──────────┘    └─────────────────┘
```

## Key Metrics

| Metric               | Value                                  |
|-----------------------|----------------------------------------|
| Total time            | ~6 hours (zero to deployed game)       |
| Total tokens          | ~254M (906K output)                    |
| Agents spawned        | 135 subagents across 3 teams           |
| Human interventions   | ~15                                    |
| Source lines           | ~4,500 (src/) + ~2,200 (tests/)       |
| Test count            | 132 tests, all passing                 |
| Model                 | Claude Opus 4.6 via Claude Code v2.1.62|

## Game Modes

- **Local Multiplayer**: 4 human players on the same device with turn transition overlays
- **Solo vs AI**: 1 human player against 3 AI opponents

## LLM-Assisted Development Methodology

### Tool: Claude Code CLI with Agent Teams

The entire project was built using **Claude Code** (Anthropic's CLI tool, v2.1.62) powered by **Claude Opus 4.6**. The key feature used was **Agent Teams** — an experimental capability where multiple specialized AI agents collaborate on a shared codebase with coordinated task management.

### Team Structure

The human developer acted as project director, providing high-level instructions and approving plans. Claude Code orchestrated three separate agent teams across the development lifecycle:

#### Team 1: Core Build (5 agents)

| Role | Agent Name | Responsibility |
|---|---|---|
| Project Manager | `pm` | Created GDD, task breakdown, file map, screen specs, scene flow |
| Coder 1 | `coder-1` | Core game logic (7 modules: constants, Card, Deck, Player, TokenBank, Round, Game) |
| Coder 2 | `coder-2` | AI logic + UI rendering (15 modules: AiPlayer, 5 scenes, 8 components, entry files) |
| Tester | `tester` | Unit tests (7 suites, 132 tests) |
| Reviewer | `reviewer` | Code review across 3 review phases (T-501, T-502, T-503) |

#### Team 2: UI Polish (3 agents)

| Role | Agent Name | Responsibility |
|---|---|---|
| Animation | `ui-animation` | Card dealing, playing, drawing animations using cc.Action system |
| Visual Polish | `ui-visuals` | Color schemes, gradients, shadows, button styling, layout refinement |
| Tester | `tester` | Playwright-based visual testing with screenshots |

#### Team 3: Production Polish (4 agents)

| Role | Agent Name | Responsibility |
|---|---|---|
| Visual Auditor | `visual-auditor` | Identified visual design gaps vs production standards |
| UX Auditor | `ux-auditor` | Reviewed user experience flow and interaction patterns |
| Code Auditor | `code-auditor` | Found 5 critical + 5 high-priority code issues |
| Bug Fixer | `bugfixer` | Fixed all critical bugs identified by auditors |

Additionally, a `docs-writer` agent was spawned to produce architecture, API reference, and report documentation.

### Workflow: How It Worked

1. **Human gives high-level instruction** (e.g., "create a team of 5 to build the L.A.M.A. card game")
2. **Claude Code creates the team** via `TeamCreate`, spawns agents with `Task` tool
3. **PM agent writes all design docs** (GDD, task breakdown with dependency graph, file map, screen specs)
4. **Agents submit plans for approval** — each agent enters plan mode, writes implementation plan, waits for human or lead approval before writing any code
5. **Parallel execution** — coder-1 and coder-2 work simultaneously on different file sets; tester writes tests as modules become available
6. **Reviewer agent audits** all code in 3 phases, files issues with severity ratings (critical/major/minor)
7. **Fix agents are re-spawned** to address review findings
8. **Human intervenes** for visual judgment calls (alignment, overlaps, UX polish)

### Human Interventions

The human developer made **~15 substantive interventions** across the session:

| # | Intervention | Purpose |
|---|---|---|
| 1 | "create a team of 5 to build L.A.M.A." | Kicked off the project |
| 2 | "create docs teammate too" | Added documentation agent |
| 3 | "spawn the server" | Started local dev server |
| 4 | Provided Cocos2d-JS zip path | Supplied engine framework file |
| 5 | "do you know how sizing and anchor point work in cocos?" | Triggered Cocos2d knowledge sharing |
| 6 | "UI is not good, no animation. create a team for UI" | Launched UI polish team |
| 7 | "start button looks mis-aligned" | Visual feedback |
| 8 | "embrace the art of UI alignment, capture screenshots and see" | Encouraged visual testing workflow |
| 9 | Corrected anchor point misconception | Domain expertise injection |
| 10 | "fix overlapping text, player 4 overlaps tokens" | Specific bug reports |
| 11 | "give me a card fan" | Requested card layout improvement |
| 12 | "draw me the render tree" | Requested architecture analysis |
| 13 | "spawn a team to polish for production" | Launched audit team |
| 14 | "what about the text? do they overlap?" | Directed final text polish pass |
| 15 | "deploy to GitHub Pages" | Triggered deployment |

### Key Observations

- **Plan-before-code discipline**: All agents required plan approval before writing code, preventing wasted work
- **Parallel task execution**: Coder-1 and coder-2 worked on non-overlapping file sets simultaneously
- **Review caught real bugs**: The reviewer agent identified 3 critical issues (scoring logic, invalid AI actions, scene data flow) that would have caused runtime failures
- **Human expertise still essential**: Cocos2d anchor point behavior required human correction; visual alignment required human eye
- **Multiple context continuations**: The main session hit context limits 4 times and was automatically continued with conversation summaries

## Session Metrics

### Time

| Session | Duration | Description |
|---|---|---|
| Initial Setup | 2 min | Enabled agent team feature |
| Main Development | 337 min (~5.6 hrs) | Full build: design, code, test, review, UI polish |
| Deployment | 21 min | GitHub repo creation + Pages deployment |
| **Total** | **~6 hours** | **From zero to deployed game** |

### Token Usage

| Session | Input | Output | Cache Create | Cache Read | Total |
|---|---|---|---|---|---|
| Main (lead) | 2,581 | 235,169 | 2,112,786 | 92,286,545 | 94,637,081 |
| Main (132 subagents) | 9,918 | 650,008 | 7,375,732 | 147,998,246 | 156,033,904 |
| Deploy (lead) | 76 | 8,598 | 231,585 | 1,757,301 | 1,997,560 |
| Deploy (3 subagents) | 243 | 11,611 | 318,882 | 1,006,340 | 1,337,076 |
| Setup | 47 | 450 | 77,357 | 102,501 | 180,355 |
| **Grand Total** | **12,865** | **905,836** | **10,116,342** | **243,150,933** | **~254M tokens** |

**Output tokens** (actual generated code/text): **~906K tokens**
**Cache read tokens** dominate (~96%) — this is the context window being re-read across turns, not new generation.

### Tool Usage (Main Session)

| Tool | Calls | Purpose |
|---|---|---|
| SendMessage | 67 | Inter-agent team communication |
| Playwright (evaluate) | 58 | Browser-based UI testing |
| Read | 56 | Reading source files |
| Edit | 48 | Modifying existing code |
| Playwright (wait) | 48 | Waiting for UI state changes |
| Playwright (screenshot) | 45 | Visual verification captures |
| TaskUpdate | 39 | Task status tracking |
| Bash | 36 | Shell commands (server, git, etc.) |
| Task (spawn agent) | 27 | Launching subagents/teammates |
| TaskCreate | 14 | Creating work items |
| Grep | 10 | Code search |
| Write | 5 | Creating new files |
| TeamCreate | 3 | Creating 3 separate agent teams |

### Agents Spawned

- **132 subagents** in the main development session
- **3 subagents** in the deployment session
- **3 agent teams** created and dissolved

## Architecture

Three-layer design with zero cross-layer dependencies:

1. **Game Logic** (`src/game/`): Rules, state, scoring — no UI dependencies
2. **AI** (`src/ai/`): Decision logic consuming game state, producing actions
3. **UI/Rendering** (`src/ui/`): Cocos2d-JS scenes and components — no game logic

## Project Size

| Category | Count |
|---|---|
| Source files (src/) | 23 |
| Test files (tests/) | 10 |
| Documentation files (docs/) | 8 |
| Source lines (src/) | ~4,500 |
| Test lines (tests/) | ~2,200 |
| Total JS lines | ~6,700 |

## Code Quality

- 0 methods exceeding 30 lines
- 0 hard-coded strings or magic numbers (all in `src/constants.js`)
- 0 DRY violations (shared ButtonHelper, constants, enums)
- UMD module pattern for browser/Node.js dual compatibility
- 132 unit tests, all passing

## Test Coverage

132 tests across 7 suites:

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
- **4 major**: Improved method naming, added missing validations, tightened type checks

### T-502: AI and UI Review
- **2 critical**: Fixed AI never returning invalid actions, corrected scene transition data flow
- **4 major**: Standardized button creation (ButtonHelper), fixed z-order consistency

### T-503: Test Review
- RoundTest rewritten with comprehensive coverage
- GameTest scoring test fixed to use proper `scoreRound()` API

### Production Audit (Team 3)
- **5 critical bugs** fixed (null guards, boundary checks)
- **5 high-priority** visual issues resolved (overlaps, alignment, text sizing)

## Known Issues / Future Work

- Art assets: all visuals use programmatic drawing (DrawNode) rather than image sprites
- No sound effects or music
- No save/load game state
- No online multiplayer
- No difficulty levels for AI (single strategy)

## How to Run

### Play Online
Visit https://nmnhut-it.github.io/lama-card-game/

### Run Locally
```
npx serve .
```
Then open http://localhost:3000

### Run Tests
```
node tests/test-runner.js
```
