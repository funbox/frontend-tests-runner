var Mocha = require('mocha');
var path = require('path');
var fs = require('fs');
var glob = require('glob');
var _ = require('lodash');
var jade = require('jade');

function compile(module, filename) {
  var source = fs.readFileSync(filename);
  var bemtoPathAbs = require.resolve('bemto.jade');
  var bemtoPathRel = path.relative(path.dirname(filename), bemtoPathAbs);
  var bemtoInclude = 'include ' + bemtoPathRel + '\n';
  source = bemtoInclude + source;

  var template = jade.compile(source, {
    filename: filename,
    pretty: true
  });

  module.exports = template;
}

if (require.extensions) {
  require.extensions['.jade'] = compile;
}

require('babel-core/register')({});

function runTests(options, done) {
  console.log('Unit тесты');
  var mocha = new Mocha({ timeout: 10000 });
  var testDir = options.projectBasePath;

  var files;
  if (options.test) {
    files = [options.test];
  }
  else {
    files = glob.sync(testDir + '/src/app/**/*.test.js', {
      matchBase: true
    });
  }

  _.each(files, function (file) {
    mocha.addFile(file);
  });

  mocha.run(function (failures) {
    done(failures == 0);
  });
}

module.exports = {
  runTests: runTests
};
