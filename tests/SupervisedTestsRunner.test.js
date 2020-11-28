/* global describe, it, beforeEach, afterEach */

const fs = require('fs');
const exec = require('child_process').execFileSync;
const assert = require('assert');
const path = require('path');

const VIEW_APP_PATH = `${__dirname}/app`;
const CONFIG_NAME = `${__dirname}/config.js`;

const CONFIG_TEMPLATE = fs.readFileSync(`${__dirname}/config.template`, { encoding: 'utf8' });
const CURRENT_BRANCH = process.env.GITHUB_HEAD_REF || require('child_process').execSync('git rev-parse --abbrev-ref HEAD').toString().trim();

const BASE_BRANCH = 'master';

describe('Runner', () => {
  beforeEach(removeConfig);
  afterEach(removeConfig);

  it('runs tests sequentially', () => {
    createConfig();
    const output = runTests();
    const index1 = output.indexOf('test1.js     ✓ test1');
    const index2 = output.indexOf('test2.js     ✓ test2');
    assert.notStrictEqual(index1, -1);
    assert.notStrictEqual(index2, -1);
    assert.strictEqual(index2 > index1, true);
  });

  it('runs tests in parallel', () => {
    createConfig({ parallelTestsCount: 2 });
    const output = runTests();
    const index1 = output.indexOf('test1.js     ✓ test1');
    const index2 = output.indexOf('test2.js     ✓ test2');
    assert.notStrictEqual(index1, -1);
    assert.notStrictEqual(index2, -1);
    assert.strictEqual(index1 > index2, true);
  });

  it('waits for the project build', () => {
    createConfig({ build: 'console.log("build finished"); return Promise.resolve();' });
    const output = runTests();
    const index = output.indexOf('build finished');
    assert.notStrictEqual(index, -1);
  });

  it('current branch is ignored', () => {
    createConfig({ ignoredBranch: CURRENT_BRANCH });
    const output = runTests();
    const index = output.indexOf('Current branch is ignored');
    assert.notStrictEqual(index, -1);
    assert.notStrictEqual(index, -1);
  });

  try {
    require('child_process').execSync(`git diff --name-only origin/${CURRENT_BRANCH}`);

    it('no files changed', () => {
      createConfig({ baseBranch: BASE_BRANCH });
      const output = runTests();
      const index = output.indexOf('No files changed');
      assert.notStrictEqual(index, -1);
      assert.notStrictEqual(index, -1);
    });

    it('found changed files without target, run all tests', () => {
      createConfig({ ignoredFiles: '!tests/app/view*.js', baseBranch: BASE_BRANCH });
      newView();
      const output = runTests();
      const index = output.indexOf('Found changed files without target, run all tests');
      newView(true);
      assert.notStrictEqual(index, -1);
      assert.notStrictEqual(index, -1);
    });

    it('run tests affected by change', () => {
      createConfig({ ignoredFiles: '!tests/app/view*.js', baseBranch: BASE_BRANCH });
      changeView("What i've done");
      const output = runTests();
      const index = output.indexOf('Run tests affected by change');
      changeView('');
      assert.notStrictEqual(index, -1);
    });
  } catch (e) {
    console.log(e)
  }
});

function runTests() {
  return exec('node', [`${__dirname}/run.js`, CONFIG_NAME]).toString();
}

function createConfig(configParams = {}) {
  const {
    parallelTestsCount = 1,
    build = 'return Promise.resolve();',
    baseBranch = '',
    ignoredBranch = '',
    ignoredFiles = '*',
  } = configParams;

  const config = CONFIG_TEMPLATE
    .replace('__PARALLEL_TESTS__COUNT__', parallelTestsCount)
    .replace('__BUILD__', build)
    .replace('__BASE_BRANCH__', baseBranch)
    .replace('__IGNORED_BRANCH__', ignoredBranch)
    .replace('__IGNORED_FILES__', ignoredFiles);

  fs.writeFileSync(CONFIG_NAME, config);
}

function changeView(draft) {
  fs.writeFileSync(path.resolve(VIEW_APP_PATH, 'view2.js'), draft);
}

function newView(isRemove) {
  const viewPath = path.resolve(VIEW_APP_PATH, 'view3.js');

  if (isRemove) {
    fs.unlinkSync(viewPath);
  } else {
    fs.writeFileSync(viewPath, '');
  }

  require('child_process').execSync(`git add ${viewPath}`);
}

function removeConfig() {
  try {
    fs.unlinkSync(CONFIG_NAME);
  } catch (e) {
    // silently ignore the possible errors
  }
}
