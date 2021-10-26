/* global describe, it, beforeEach, afterEach */

const fs = require('fs');
const exec = require('child_process').execFileSync;
const assert = require('assert');

const CONFIG_NAME = `${__dirname}/config.js`;

const CONFIG_TEMPLATE = fs.readFileSync(`${__dirname}/config.template`, { encoding: 'utf8' });

describe('Runner', () => {
  beforeEach(removeConfig);
  afterEach(removeConfig);

  it('runs tests sequentially', () => {
    createConfig(1, 'return Promise.resolve();');
    const output = runTests();
    const index1 = output.indexOf('test1.js     ✔ test1');
    const index2 = output.indexOf('test2.js     ✔ test2');
    assert.notStrictEqual(index1, -1);
    assert.notStrictEqual(index2, -1);
    assert.strictEqual(index2 > index1, true);
  });

  it('runs tests in parallel', () => {
    createConfig(2, 'return Promise.resolve();');
    const output = runTests();
    const index1 = output.indexOf('test1.js     ✔ test1');
    const index2 = output.indexOf('test2.js     ✔ test2');
    assert.notStrictEqual(index1, -1);
    assert.notStrictEqual(index2, -1);
    assert.strictEqual(index1 > index2, true);
  });

  it('waits for the project build', () => {
    createConfig(2, 'console.log("build finished"); return Promise.resolve();');
    const output = runTests();
    const index = output.indexOf('build finished');
    assert.notStrictEqual(index, -1);
  });

  it('filter tests files', () => {
    createConfig(2, 'return Promise.resolve();', "files => files.filter(file => file.includes('test1.js'))");
    const output = runTests();
    const index1 = output.indexOf('test1.js     ✔ test1');
    const index2 = output.indexOf('test2.js     ✔ test2');
    assert.notStrictEqual(index1, -1);
    assert.strictEqual(index2, -1);
  });
});

function runTests() {
  return exec('node', [`${__dirname}/run.js`, CONFIG_NAME]).toString();
}

function createConfig(parallelTestsCount, build, filterTestsFiles = 'files => files') {
  const config = CONFIG_TEMPLATE
    .replace('__PARALLEL_TESTS__COUNT__', parallelTestsCount)
    .replace('__BUILD__', build)
    .replace('__FILTER_TESTS__', filterTestsFiles);

  fs.writeFileSync(CONFIG_NAME, config);
}

function removeConfig() {
  try {
    fs.unlinkSync(CONFIG_NAME);
  } catch (e) {
    // silently ignore the possible errors
  }
}
