module.exports = {
  parallelTestsCount: 2,
  live: false,
  separatedLogs: true,
  testFiles: './src/tests/e2e/*.js',
  timeout: 120000, // timeout mocha
  retries: 0,
  browserArgs: {
    viewportWidth: 1440,
    viewportHeight: 900,
    waitTimeout: 60000, // timeout phantom.js
  }
};
