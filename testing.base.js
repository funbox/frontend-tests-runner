var _ = require('lodash');

function runTests(options, done) {
  if (options.test) {
    var runner = require('./testing.runner.' + options.type);
    runner.runTests(options, function (success) {
      done(success);
    });
  }
  else {
    var i = 0;
    function executeNextRunner(success) {
      var runnerName = options.runners[i++];
      if (runnerName) {
        var runner = require('./testing.runner.' + runnerName);
        runner.runTests(options, function (result) {
          executeNextRunner(success && result);
        });
      } else {
        done(success);
      }
    }

    executeNextRunner(true);
  }
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

