var _ = require('lodash');

function runTests(options, done) {
  var runner = require('./testing.runner.e2e');
  runner.runTests(options, function (success) {
    done(success);
  });
}

module.exports = {
  runTests: runTests
};

process.on('message', (m) => {
  runTests(m.config, function(success) {
    console.log('Тестирование завершено');
    process.exit(success ? 0 : 1);
  });
})

