/* global describe, it, beforeEach, afterEach */

const fs = require('fs');
const exec = require('child_process').execFileSync;
const assert = require('assert');

const CONFIG_NAME = `${__dirname}/config.js`;

const CONFIG_TEMPLATE = fs.readFileSync(`${__dirname}/config.template`, { encoding: 'utf8' });

describe('Runner', () => {
  beforeEach(removeConfig);
  afterEach(removeConfig);

  it('Запускает тесты последовательно', () => {
    createConfig(1, 'return Promise.resolve();');
    const output = runTests();
    const index1 = output.indexOf('test1.js     ✓ test1');
    const index2 = output.indexOf('test2.js     ✓ test2');
    assert.notEqual(index1, -1);
    assert.notEqual(index2, -1);
    assert.equal(index2 > index1, true);
  });

  it('Запускает тесты параллельно', () => {
    createConfig(2, 'return Promise.resolve();');
    const output = runTests();
    const index1 = output.indexOf('test1.js     ✓ test1');
    const index2 = output.indexOf('test2.js     ✓ test2');
    assert.notEqual(index1, -1);
    assert.notEqual(index2, -1);
    assert.equal(index1 > index2, true);
  });

  it('Ждет билда проекта', () => {
    createConfig(2, 'console.log("build finished"); return Promise.resolve();');
    const output = runTests();
    const index = output.indexOf('build finished');
    assert.notEqual(index, -1);
  });
});

function runTests() {
  return exec('node', [`${__dirname}/run.js`, CONFIG_NAME]).toString();
}

function createConfig(parallelTestsCount, build) {
  const config = CONFIG_TEMPLATE
    .replace('__PARALLEL_TESTS__COUNT__', parallelTestsCount)
    .replace('__BUILD__', build);

  fs.writeFileSync(CONFIG_NAME, config);
}

function removeConfig() {
  try {
    fs.unlinkSync(CONFIG_NAME);
  } catch (e) {
    // ничего не делаем если файл не существует
  }
}
