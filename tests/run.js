const Runner = require('../SupervisedTestsRunner.js');

const runner = new Runner(require(process.argv[2]));
runner.start();
