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

* `parallelTestsCount` — a number of files with tests running in parallel.
* `live` — run tests in live mode (enabling watching for files changes).
* `separatedLogs` — write logs for each test file separately.
* `logDir` — directory name for `separatedLogs`; optional, default: `test-logs`.
* `testFiles` — glob with tests files, e.g. `tests/\*.js`.
* `mocha.timeout` — test timeout threshold (in milliseconds).
* `mocha.retries` — retry failed tests this many times.
* `mocha.noColors` — disable color output.
* `mocha.args` – additional args object for Mocha.

Example of passing arguments for Mocha:

```javascript
module.exports = {
  mocha: {
    timeout: 120000,
    retries: 0,
    noColors: true,
    args: {
      // '--compilers': 'js:babel-register',
      '--require': [
        '@babel/register',
        'babel-polyfill',
      ],
    },
  },
}
```

[![Sponsored by FunBox](https://funbox.ru/badges/sponsored_by_funbox_centered.svg)](https://funbox.ru)
