/**
 * Unit tests for TokenBank model (T-406).
 * Covers distribution, return, exchange, and supply limits.
 */
'use strict';

const { describe, it, assert } = require('./test-runner');
const { GAME_CONSTANTS } = require('./test-helpers');

let TokenBank, Player, TokenType;
try {
  TokenBank = require('../src/game/TokenBank').TokenBank;
  Player = require('../src/game/Player').Player;
  const constants = require('../src/constants');
  TokenType = constants.TokenType;
} catch (e) {
  console.log('  SKIP: TokenBank/Player/constants not yet available - ' + e.message);
  module.exports = { skipped: true };
  return;
}

const {
  WHITE_TOKEN_COUNT, BLACK_TOKEN_COUNT, WHITE_TOKEN_VALUE,
  BLACK_TOKEN_VALUE
} = GAME_CONSTANTS;

const WHITE = TokenType ? TokenType.WHITE : 'white';
const BLACK = TokenType ? TokenType.BLACK : 'black';

/* --- Initialization --- */

describe('TokenBank - Initialization', () => {
  it('should start with WHITE_TOKEN_COUNT white tokens', () => {
    const bank = new TokenBank();
    assert.equal(bank.getWhiteSupply(), WHITE_TOKEN_COUNT);
  });

  it('should start with BLACK_TOKEN_COUNT black tokens', () => {
    const bank = new TokenBank();
    assert.equal(bank.getBlackSupply(), BLACK_TOKEN_COUNT);
  });
});

/* --- distributeTokens --- */

describe('TokenBank - Distribute Tokens', () => {
  it('should give only white tokens for penalty < BLACK_TOKEN_VALUE', () => {
    const bank = new TokenBank();
    const player = new Player(0);
    bank.distributeTokens(player, 7);
    assert.equal(player.getWhiteTokens(), 7);
    assert.equal(player.getBlackTokens(), 0);
  });

  it('should use black tokens for penalties >= BLACK_TOKEN_VALUE', () => {
    const bank = new TokenBank();
    const player = new Player(0);
    bank.distributeTokens(player, BLACK_TOKEN_VALUE);
    assert.equal(player.getBlackTokens(), 1);
    assert.equal(player.getWhiteTokens(), 0);
  });

  it('should split correctly for 23 points (2 black + 3 white)', () => {
    const bank = new TokenBank();
    const player = new Player(0);
    const penalty = 23;
    bank.distributeTokens(player, penalty);
    const expectedBlack = Math.floor(penalty / BLACK_TOKEN_VALUE);
    const expectedWhite = penalty % BLACK_TOKEN_VALUE;
    assert.equal(player.getBlackTokens(), expectedBlack);
    assert.equal(player.getWhiteTokens(), expectedWhite);
  });

  it('should give zero tokens for zero penalty', () => {
    const bank = new TokenBank();
    const player = new Player(0);
    bank.distributeTokens(player, 0);
    assert.equal(player.getWhiteTokens(), 0);
    assert.equal(player.getBlackTokens(), 0);
  });

  it('should deduct from supply when distributing', () => {
    const bank = new TokenBank();
    const player = new Player(0);
    bank.distributeTokens(player, 13);
    assert.equal(bank.getBlackSupply(), BLACK_TOKEN_COUNT - 1);
    assert.equal(bank.getWhiteSupply(), WHITE_TOKEN_COUNT - 3);
  });

  it('should accumulate tokens across multiple distributions', () => {
    const bank = new TokenBank();
    const player = new Player(0);
    bank.distributeTokens(player, 5);
    bank.distributeTokens(player, 12);
    assert.equal(player.getWhiteTokens(), 7);
    assert.equal(player.getBlackTokens(), 1);
  });
});

/* --- returnToken --- */

describe('TokenBank - Return Token (Empty Hand Bonus)', () => {
  it('should allow returning 1 black token', () => {
    const bank = new TokenBank();
    const player = new Player(0);
    bank.distributeTokens(player, BLACK_TOKEN_VALUE);
    const beforeBlack = player.getBlackTokens();
    bank.returnToken(player, BLACK);
    assert.equal(player.getBlackTokens(), beforeBlack - 1);
    assert.equal(bank.getBlackSupply(), BLACK_TOKEN_COUNT);
  });

  it('should allow returning 1 white token', () => {
    const bank = new TokenBank();
    const player = new Player(0);
    bank.distributeTokens(player, 3);
    const beforeWhite = player.getWhiteTokens();
    bank.returnToken(player, WHITE);
    assert.equal(player.getWhiteTokens(), beforeWhite - 1);
    const distributed = 3;
    const returned = 1;
    assert.equal(bank.getWhiteSupply(), WHITE_TOKEN_COUNT - distributed + returned);
  });

  it('should not return token when player has zero of that type', () => {
    const bank = new TokenBank();
    const player = new Player(0);
    bank.returnToken(player, BLACK);
    assert.equal(player.getBlackTokens(), 0);
    assert.equal(bank.getBlackSupply(), BLACK_TOKEN_COUNT);
  });
});

/* --- Exchange --- */

describe('TokenBank - Exchange', () => {
  it('should exchange 1 black for BLACK_TOKEN_VALUE white tokens', () => {
    const bank = new TokenBank();
    const player = new Player(0);
    bank.distributeTokens(player, BLACK_TOKEN_VALUE);
    bank.exchange(player, BLACK);
    assert.equal(player.getBlackTokens(), 0);
    assert.equal(player.getWhiteTokens(), BLACK_TOKEN_VALUE);
  });

  it('should exchange BLACK_TOKEN_VALUE white for 1 black token', () => {
    const bank = new TokenBank();
    const player = new Player(0);
    bank.distributeTokens(player, BLACK_TOKEN_VALUE);
    bank.exchange(player, BLACK);
    bank.exchange(player, WHITE);
    assert.equal(player.getWhiteTokens(), 0);
    assert.equal(player.getBlackTokens(), 1);
  });

  it('should not exchange when player has insufficient tokens', () => {
    const bank = new TokenBank();
    const player = new Player(0);
    bank.distributeTokens(player, 5);
    const beforeWhite = player.getWhiteTokens();
    const beforeBlack = player.getBlackTokens();
    bank.exchange(player, WHITE);
    assert.equal(player.getWhiteTokens(), beforeWhite);
    assert.equal(player.getBlackTokens(), beforeBlack);
  });
});

/* --- Supply Limits --- */

describe('TokenBank - Supply Limits', () => {
  it('should never let supply go negative', () => {
    const bank = new TokenBank();
    for (let i = 0; i < GAME_CONSTANTS.PLAYER_COUNT; i++) {
      const player = new Player(i);
      bank.distributeTokens(player, GAME_CONSTANTS.GAME_OVER_THRESHOLD);
    }
    assert.ok(bank.getWhiteSupply() >= 0, 'White supply must not be negative');
    assert.ok(bank.getBlackSupply() >= 0, 'Black supply must not be negative');
  });
});

/* --- returnBestToken with exchange --- */

describe('TokenBank - returnBestToken exchange optimization', () => {
  it('should return black token when player has black tokens', () => {
    const bank = new TokenBank();
    const player = new Player(0);
    bank.distributeTokens(player, BLACK_TOKEN_VALUE);
    assert.equal(player.getBlackTokens(), 1);
    const returned = bank.returnBestToken(player);
    assert.equal(returned, BLACK);
    assert.equal(player.getBlackTokens(), 0);
    assert.equal(player.totalPoints(), 0);
  });

  it('should exchange 10 white to 1 black before returning when no black tokens', () => {
    const bank = new TokenBank();
    const player = new Player(0);
    /* Give 15 white tokens (simulate prior rounds with small penalties) */
    bank.distributeTokens(player, 5);
    bank.distributeTokens(player, 5);
    bank.distributeTokens(player, 5);
    assert.equal(player.getWhiteTokens(), 15);
    assert.equal(player.getBlackTokens(), 0);
    assert.equal(player.totalPoints(), 15);

    const returned = bank.returnBestToken(player);
    assert.equal(returned, BLACK, 'Should exchange white->black then return black');
    assert.equal(player.totalPoints(), 5, 'Should save 10 pts (15 - 10)');
  });

  it('should exchange and return when player has exactly 10 white tokens', () => {
    const bank = new TokenBank();
    const player = new Player(0);
    bank.distributeTokens(player, BLACK_TOKEN_VALUE);
    /* Exchange black to white so player has 10 white, 0 black */
    bank.exchange(player, BLACK);
    assert.equal(player.getWhiteTokens(), BLACK_TOKEN_VALUE);
    assert.equal(player.getBlackTokens(), 0);

    const returned = bank.returnBestToken(player);
    assert.equal(returned, BLACK, 'Should exchange 10 white->1 black then return');
    assert.equal(player.totalPoints(), 0, 'Should save all 10 pts');
  });

  it('should return white when player has < 10 white and 0 black', () => {
    const bank = new TokenBank();
    const player = new Player(0);
    bank.distributeTokens(player, 3);
    assert.equal(player.getWhiteTokens(), 3);
    assert.equal(player.getBlackTokens(), 0);

    const returned = bank.returnBestToken(player);
    assert.equal(returned, WHITE, 'Not enough white to exchange, return 1 white');
    assert.equal(player.totalPoints(), 2);
  });

  it('should return null when player has no tokens at all', () => {
    const bank = new TokenBank();
    const player = new Player(0);
    const returned = bank.returnBestToken(player);
    assert.equal(returned, null);
    assert.equal(player.totalPoints(), 0);
  });
});

/* --- Total Points via Tokens --- */

describe('TokenBank - Player Total Points', () => {
  it('should calculate correct total from mixed tokens', () => {
    const bank = new TokenBank();
    const player = new Player(0);
    bank.distributeTokens(player, 23);
    const expected = (player.getBlackTokens() * BLACK_TOKEN_VALUE)
      + (player.getWhiteTokens() * WHITE_TOKEN_VALUE);
    assert.equal(player.totalPoints(), expected);
    assert.equal(player.totalPoints(), 23);
  });
});

/* --- Scoring integration: penalty 10 → 1 black token --- */

describe('TokenBank - Llama penalty (10 pts) scenarios', () => {
  it('should give exactly 1 black token for penalty of 10', () => {
    const bank = new TokenBank();
    const player = new Player(0);
    bank.distributeTokens(player, BLACK_TOKEN_VALUE);
    assert.equal(player.getBlackTokens(), 1);
    assert.equal(player.getWhiteTokens(), 0);
    assert.equal(player.totalPoints(), BLACK_TOKEN_VALUE);
  });

  it('should give 1 black + 1 white for penalty of 11', () => {
    const bank = new TokenBank();
    const player = new Player(0);
    bank.distributeTokens(player, 11);
    assert.equal(player.getBlackTokens(), 1);
    assert.equal(player.getWhiteTokens(), 1);
    assert.equal(player.totalPoints(), 11);
  });

  it('should fall back to white tokens when black supply empty', () => {
    const bank = new TokenBank();
    const players = [];
    /* Exhaust all black tokens (20 black = 200 pts worth) */
    for (let i = 0; i < BLACK_TOKEN_COUNT; i++) {
      const p = new Player(i % GAME_CONSTANTS.PLAYER_COUNT);
      bank.distributeTokens(p, BLACK_TOKEN_VALUE);
      players.push(p);
    }
    assert.equal(bank.getBlackSupply(), 0);

    const newPlayer = new Player(0);
    bank.distributeTokens(newPlayer, BLACK_TOKEN_VALUE);
    assert.equal(newPlayer.getBlackTokens(), 0, 'No black tokens available');
    assert.equal(newPlayer.getWhiteTokens(), BLACK_TOKEN_VALUE, 'Falls back to white');
    assert.equal(newPlayer.totalPoints(), BLACK_TOKEN_VALUE);
  });
});

module.exports = {};
