/**
 * Lightweight test runner for L.A.M.A. card game.
 * Supports describe/it blocks, assertions, and file-based output.
 * Run: node tests/test-runner.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const RESULTS_FILE = path.join(__dirname, 'test-results.txt');

/** Test state tracking */
const state = {
  suites: [],
  currentSuite: null,
  totalPassed: 0,
  totalFailed: 0,
  output: []
};

/** Log to both console and output buffer */
function log(message) {
  console.log(message);
  state.output.push(message);
}

/** Define a test suite */
function describe(name, fn) {
  const suite = { name, tests: [], passed: 0, failed: 0 };
  state.suites.push(suite);
  state.currentSuite = suite;
  log(`\n  Suite: ${name}`);
  fn();
  state.currentSuite = null;
}

/** Define a test case */
function it(name, fn) {
  const suite = state.currentSuite;
  if (!suite) {
    throw new Error('it() must be called inside describe()');
  }
  try {
    fn();
    suite.passed++;
    state.totalPassed++;
    log(`    PASS: ${name}`);
  } catch (err) {
    suite.failed++;
    state.totalFailed++;
    log(`    FAIL: ${name}`);
    log(`      Error: ${err.message}`);
  }
}

/** Assertion helpers */
const assert = {
  equal(actual, expected, msg) {
    if (actual !== expected) {
      throw new Error(
        msg || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
      );
    }
  },

  deepEqual(actual, expected, msg) {
    const a = JSON.stringify(actual);
    const b = JSON.stringify(expected);
    if (a !== b) {
      throw new Error(msg || `Expected ${b}, got ${a}`);
    }
  },

  ok(value, msg) {
    if (!value) {
      throw new Error(msg || `Expected truthy value, got ${JSON.stringify(value)}`);
    }
  },

  notOk(value, msg) {
    if (value) {
      throw new Error(msg || `Expected falsy value, got ${JSON.stringify(value)}`);
    }
  },

  throws(fn, msg) {
    let threw = false;
    try {
      fn();
    } catch (_e) {
      threw = true;
    }
    if (!threw) {
      throw new Error(msg || 'Expected function to throw');
    }
  },

  greaterThan(actual, expected, msg) {
    if (actual <= expected) {
      throw new Error(
        msg || `Expected ${actual} to be greater than ${expected}`
      );
    }
  },

  lessThanOrEqual(actual, expected, msg) {
    if (actual > expected) {
      throw new Error(
        msg || `Expected ${actual} to be <= ${expected}`
      );
    }
  },

  includes(array, item, msg) {
    if (!Array.isArray(array) || !array.includes(item)) {
      throw new Error(
        msg || `Expected array to include ${JSON.stringify(item)}`
      );
    }
  },

  notIncludes(array, item, msg) {
    if (Array.isArray(array) && array.includes(item)) {
      throw new Error(
        msg || `Expected array NOT to include ${JSON.stringify(item)}`
      );
    }
  },

  doesNotThrow(fn, msg) {
    try {
      fn();
    } catch (e) {
      throw new Error(msg || `Expected no throw, but got: ${e.message}`);
    }
  },

  instanceOf(obj, cls, msg) {
    if (!(obj instanceof cls)) {
      throw new Error(msg || `Expected instance of ${cls.name}`);
    }
  }
};

/** Print summary and write results to file */
function printSummary() {
  const total = state.totalPassed + state.totalFailed;
  log('\n========================================');
  log('  TEST SUMMARY');
  log('========================================');
  log(`  Total:  ${total}`);
  log(`  Passed: ${state.totalPassed}`);
  log(`  Failed: ${state.totalFailed}`);
  log('========================================');

  if (state.totalFailed > 0) {
    log('  RESULT: SOME TESTS FAILED');
  } else {
    log('  RESULT: ALL TESTS PASSED');
  }
  log('========================================\n');

  fs.writeFileSync(RESULTS_FILE, state.output.join('\n'), 'utf8');
  log(`Results written to ${RESULTS_FILE}`);
}

/** Load and run all test files in order */
function runAllTests() {
  log('L.A.M.A. Test Suite');
  log('==================');

  const testFiles = [
    'CardTest.js',
    'DeckTest.js',
    'PlayerTest.js',
    'TokenBankTest.js',
    'RoundTest.js',
    'GameTest.js',
    'AiPlayerTest.js'
  ];

  for (const file of testFiles) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      log(`\nRunning: ${file}`);
      require(filePath);
    } else {
      log(`\nSkipped (not found): ${file}`);
    }
  }

  printSummary();
  return state.totalFailed === 0;
}

/** Export for use by test files */
module.exports = { describe, it, assert };

/** Run when executed directly */
if (require.main === module) {
  const success = runAllTests();
  process.exit(success ? 0 : 1);
}
