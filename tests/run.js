const Runner = require('../SupervisedTestsRunner.js');

// eslint-disable-next-line import/no-dynamic-require
const runner = new Runner(require(process.argv[2]));
runner.start();
