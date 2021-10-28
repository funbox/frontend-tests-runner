# @funboxteam/frontend-tests-runner

[![npm](https://img.shields.io/npm/v/@funboxteam/frontend-tests-runner.svg)](https://www.npmjs.com/package/@funboxteam/frontend-tests-runner)

A library for running Mocha tests in parallel and watching files changes in live mode.

[По-русски](./README.ru.md)

## Installation

```bash
npm install --save-dev @funboxteam/frontend-tests-runner
```

## Usage

Example of usage:

```javascript
const config = {
  parallelTestsCount: 2,
  testFiles: './src/tests/e2e/*.js',
  project: {
    build() {
      // Build project function. Must return Promise.
    },
    addListener(event) {
      // Even subscription function. There're two possible events
      //   buildStart — the project building has started;
      //   buildFinish — the project building has finished;
      // Helpful for live testing.
    }
  }
};

const Runner = require('@funboxteam/frontend-tests-runner');
const runner = new Runner(config);
runner.start();
```

For more check [examples](./examples) directory.

### Configuration

Example of all configuration options and their defaults:

```javascript
module.exports = {
  // A number of files with tests running in parallel.
  // Optional.
  parallelTestsCount: 1,

  // Run tests in live mode (enabling watching for files changes).
  // Optional.
  live: false,

  // Write logs for each test file separately.
  // Optional.
  separatedLogs: false,

  // Directory name for `separatedLogs`.
  // Optional.
  logDir: 'test-logs',

  // Glob with tests files, for exampe: `tests/\*.js`.
  // Required.
  testFiles: undefined,

  // Return test files for run. Function can be async.
  // Optional.
  filterTestsFiles: (files, isFilteredByOnly) => {
    // e.g.:
    // if (isFilteredByOnly) return files;

    // const testsFilesDependencies = getTestsFilesDependencies(files);
    // const changedFiles = getChangedFiles();

    // return getAffectedTestsFiles(testsFilesDependencies, changedFiles);
  },

  project: {
    build() {
      // Build project function. Must return Promise.
    },
    addListener(event) {
      // Event subscription function. There're two possible events:
      //   buildStart — the project building has started;
      //   buildFinish — the project building has finished.
      // Helpful for live testing.
    }
  },

  // Mocha config https://mochajs.org/#command-line-usage.
  // Optional.
  mocha: {
    // Test timeout threshold (in milliseconds).
    // https://mochajs.org/#-timeout-ms-t-ms
    // Optional.
    timeout: 30000,

    // Retry failed tests this many times.
    // https://mochajs.org/#-retries-n
    // Optional.
    retries: 0,

    // Disable color output.
    // https://mochajs.org/#-color-c-colors
    // Optional.
    noColors: false,

    // Additional args object for Mocha.
    // Optional.
    args: {
      // e.g.:
      // '--full-trace': 'true',
      // '--require': [
      //   '@babel/register',
      //   'babel-polyfill',
      // ],
    },
  },
}
```

[![Sponsored by FunBox](https://funbox.ru/badges/sponsored_by_funbox_centered.svg)](https://funbox.ru)
