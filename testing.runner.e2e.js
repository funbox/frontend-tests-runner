const spawn = require('child_process').spawn;
const fork = require('child_process').fork;
const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const Mocha = require('mocha');
const E2E_TESTS_START_TIMESTAMP = Date.now();

function filterTests(tests) {
  const methodNames = ['before', 'beforeEach', 'after', 'afterEach', 'it', 'xit', 'describe'];
  const savedMethods = {};
  methodNames.forEach((m) => {
    if (m in global) {
      savedMethods[m] = global[m];
    }
  });

  const emptyFn = () => {};
  global['before'] = emptyFn;
  global['beforeEach'] = emptyFn;
  global['after'] = emptyFn;
  global['afterEach'] = emptyFn;
  global['it'] = emptyFn;
  global['it'].skip = emptyFn;
  global['xit'] = emptyFn;
  global['describe'] = (name, fn) => fn();
  global['describe'].skip = emptyFn;

  let filterEnabled = false;
  const filteredTests = [];

  tests.forEach((test) => {
    let filter = false;

    global['describe'].only = (name, fn) => {
      filter = true;
      fn();
    }

    global['it'].only = () => {
      filter = true;
    }

    try {
      require(test);
    } catch (e) {
      console.log(e.stack || e);
    }

    if (filter) {
      filterEnabled = true;
      filteredTests.push(test);
    }
  });

  methodNames.forEach((m) => {
    delete global[m];

    if (m in savedMethods) {
      global[m] = savedMethods[m];
    }
  });

  return filterEnabled ? filteredTests : tests;
}

function runTest(test, options, browserArgs, done) {
  console.log(`Запуск теста ${test}`);

  const baseUrl = 'http://localhost:' + options.devServerPort;

  const env = _.defaults({
    BASE_URL: baseUrl,
    BROWSER_ARGS: JSON.stringify(browserArgs),
    E2E_TESTS_START_TIMESTAMP,
  }, process.env);
  const timeout = browserArgs.timeout || 30000;
  const retries = browserArgs.retries || 0;

  let args = [];
  args.push('--retries', retries);
  args.push('--timeout', timeout);
  args.push('--colors');
  args.push(test);

  const p = spawn(path.resolve('node_modules/.bin/mocha'), args, {env: env});

  let passing = 0;
  let pending = 0;
  let failing = 0;

  const parts = test.split('/');
  const prefix = parts[parts.length - 1];

  let logs = '';

  const logData = (data) => {
    const str = data.toString('utf8');
    logs += str;

    const passingRe = /(\d+) passing/;
    const pendingRe = /(\d+) pending/;
    const failingRe = /(\d+) failing/;

    let res;
    if (res = passingRe.exec(str)) {
      passing = Number(res[1]);
    }

    if (res = pendingRe.exec(str)) {
      pending = Number(res[1]);
    }

    if (res = failingRe.exec(str)) {
      failing = Number(res[1]);
    }

    process.stdout.write(`${prefix} ${str}`);
  }
  p.stdout.on('data', logData);
  p.stderr.on('data', logData);

  p.on('close', (code) => {
    if (process.env.SEPARATED_LOGS) {
      try {
        fs.mkdirSync('test-logs');
      } catch (e) {}

      fs.writeFileSync('test-logs/' + prefix + '.log', logs);
    }

    console.log(`child process exited with code ${code}`);
    done(code, passing, pending, failing);
  });

}

function formatTime(time) {
  let hours = Math.floor(time / 3600);
  let mins = Math.floor(time % 3600 / 60);
  let secs = Math.floor(time % 60);

  let result = '';

  if (hours > 0) result = result + `${hours} ч.`;
  if (mins > 0)  result = result + ` ${mins} мин.`;
  if (secs > 0)  result = result + ` ${secs} сек.`;

  return result;
}

function runTests(options, done) {
  console.log('E2E тесты');

  let tests = [];

  if (options.test) {
    tests.push(options.test);
  } else {
    const dir = path.join(options.projectBasePath, 'src/tests/e2e');
    fs.readdirSync(dir).forEach((f) => {
      if (/\.e2e\.test\.js$/.exec(f)) {
        tests.push(path.join(dir, f));
      }
    });
  }

  tests = filterTests(tests);

  const configFilePath = path.join(options.projectBasePath, _.get(options, 'e2e.configFile', 'config/e2e.conf.js'));
  const projectConfig = require(configFilePath);

  const parallelTestsCount = projectConfig.parallelTestsCount || 1;
  let testsCount = 1;

  const startTime = Date.now();
  let result = 0;
  let totalPassing = 0;
  let totalPending = 0;
  let totalFailing = 0;
  const filesWithFailures = [];
  const runNextTest = (currentFile, code, passing, pending, failing) => {
    testsCount--;

    totalPassing += passing;
    totalPending += pending;
    totalFailing += failing;

    if (code) {
      result = code;
      filesWithFailures.push({name: currentFile, failing});
    }

    if (tests.length == 0) {
      if (testsCount !== 0) return;

      console.log('E2E тесты завершились за ' + formatTime(Math.floor(Date.now() - startTime) / 1000));

      if (filesWithFailures.length) {
        console.log();
        console.log('Проблемные файлы:');
        filesWithFailures.forEach((f, index) => {
          console.log(`${index + 1}. ${f.name} (провалено тестов: ${f.failing})`);
        });
      }

      console.log();
      console.log(`${totalPassing} passing`);
      console.log(`${totalPending} pending`);
      console.log(`${totalFailing} failing`);

      done(result == 0);
    } else {
      while (testsCount < parallelTestsCount && tests.length > 0) {
        testsCount++;
        const nextFile = tests.shift();
        runTest(nextFile, options, projectConfig.browserArgs, runNextTest.bind(this, nextFile));
      }
    }
  }

  if (process.env.E2E_TESTS_SLOW_INTERNET) {
    const proxyPort = projectConfig.slowProxyPort || 8090;
    const proxySpeed = projectConfig.slowProxySpeed || 20000;
    const proxyPath = path.resolve('node_modules/crapify/bin/crapify.js');
    const proxyArgs = ['start', `--port=${proxyPort}`, `--speed=${proxySpeed}`, '--concurrency=1000'];

    projectConfig.browserArgs = projectConfig.browserArgs || [];
    projectConfig.browserArgs.push(`--proxy=127.0.0.1:${proxyPort}`);

    const proxyProcess = spawn(proxyPath, proxyArgs);

    let firstOutput = true;
    proxyProcess.stdout.on('data', (data) => {
      if (firstOutput) {
        firstOutput = false;
        if (data.toString('utf8').indexOf('proxy serving on') > -1) {
          console.log(`Эмуляция интернета со скоростью ${proxySpeed} байт/сек`);
          process.stdout.write(data);
        } else {
          console.log('Ошибка при запуске прокси!');
          process.stdout.write(data);
          done(false);
        }
      } else if (projectConfig.slowProxyDebugOutput) {
        process.stdout.write(data);
      }
    });

    proxyProcess.stderr.on('data', (data) => {
      process.stdout.write(data);
    });

    proxyProcess.on('close', (code) => {
      console.log(`proxy process exited with code ${code}`);
    });
  }

  runNextTest(undefined, 0, 0, 0, 0);
}

module.exports = {
  runTests: runTests
};
