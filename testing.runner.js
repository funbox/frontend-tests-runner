var _ = require('lodash');
var path = require('path');
var fs = require('fs');
var frontendEnv = require('funbox-frontend-env-webpack');
var webpack = frontendEnv.webpack;
var WebpackDevServer = frontendEnv.webpackDevServer;
var rebuildInProgressFile = frontendEnv.rebuildInProgressFile;
var config = getConfigFromFile(process.argv[3]);
var devServerPort = config.devServer.port;
var child = require('child_process');
var filewatcher = require('filewatcher');
var glob = require('glob');
var q = require('q');

var childProcess;

if (getConfig().runners.indexOf('e2e') >= 0) {
  defineMode();
}
else {
  initializeWatching();
  startTests();
}

function getConfigFromFile(relativePathToConfig) {
  var fullPathToConfig = path.join(process.cwd(), relativePathToConfig);
  return require(fullPathToConfig);
}

function getArgs(names) {
  var result = {};
  names.forEach(function(n) {
    process.argv.forEach(function(a) {
      var argStartToken = '--' + n;
      if (_.startsWith(a, argStartToken)) {
        result[n] = a.split('=')[1];
      }
    });
  });
  return result;
}

function getConfigFromCommandLine() {
  var config = {};
  var raw = getArgs(['runners', 'no-selenium', 'mode']);
  raw['runners'] && (config.runners = raw['runners'].split(','));
  raw['mode'] && (config.mode = raw['mode']);
  config.noSelenium = !_.isUndefined(raw['no-selenium']);
  return config;
}

function getConfig() {
  return _.defaults(getConfigFromCommandLine(), getConfigFromFile(process.argv[2]));
}

function startTests(test, type, stopProcess) {
  childProcess = child.fork(__dirname + '/testing.base', process.argv.slice(2), {
    cwd: process.cwd()
  });

  var config = getConfig();
  config.test = test;
  config.type = type;
  config.devServerPort = devServerPort;

  childProcess.send({
    config: config,
    command: 'run'
  });

  var deferred = q.defer();
  childProcess.on('exit', function(code) {
    deferred.resolve(code);
  });
  return deferred.promise;
}

function hookStream(stream, data, cb) {
  var oldWrite = stream.write;

  var clearHook = function() {
    stream.write = oldWrite;
  };

  stream.write = function() {
    oldWrite.apply(stream, arguments);

    if (arguments[0] === data) {
      clearHook();
      cb();
    }
  };
}

function defineMode() {
  if (getConfig().mode !== 'live') {
    findFreePort(config.devServer.port)
      .then((freePort) => {
        config.devServer.port = devServerPort = freePort;
        return runServerWithTests();
      })
      .then((code) => {
        process.exit(code);
      });
  }
  else {
    checkPort();
  }
}

function isPortFree(port) {
  return q.Promise((resolve, reject) => {
    const net = require('net');
    const server = net.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        throw err;
      }
    });
    server.once('listening', () => {
      server.once('close', () => {
        resolve(true);
      });
      server.close();
    });
    server.listen(port, '0.0.0.0');
  });
}

function findFreePort(port) {
  return isPortFree(port).then((isFree) => {
    if (isFree) {
      return port;
    }
    return findFreePort(port + 1);
  });
}

function checkPort() {
  isPortFree(config.devServer.port).then((isFree) => {
    if (!isFree) {
      initializeWatching();
      startTests();
    }
    else {
      runServerWithTests();
    }
  });
}

function runServerWithTests() {
  var deferred = q.defer();

  new WebpackDevServer(webpack(config), config.devServer).listen(config.devServer.port, 'localhost', function(err) {
    if (err) {
      console.log('Ошибка сборки: ' + err);
      process.exit(1);
    }

    hookStream( process.stdout, 'webpack: Compiled successfully.\n', function() {
      initializeWatching();
      startTests().then(function(code) {
        deferred.resolve(code);
      });
    });
  });

  return deferred.promise;
}

function watchFiles(watcher, files) {
  files.forEach(function(file) {
    watcher.add(file);
  });  
}

function initializeWatching() {
  var config = getConfig();

  if (config.mode !== 'live') {
    return;
  }

  fs.watch(path.dirname(rebuildInProgressFile), (eventType, filename) => {
    if (eventType === 'rename' && filename === path.basename(rebuildInProgressFile)) {
      if (fs.existsSync(rebuildInProgressFile)) {
        if (childProcess && childProcess.connected) {
          console.log('ОСТАНОВКА ТЕСТИРОВАНИЯ');
          process.kill(childProcess.pid);
        }
        console.log('Ожидаем окончания пересборки проекта...');
      } else {
        console.log('Пересборка проекта окончена, перезапускаем тесты');
        startTests();
      }
    }
  });

  // Отслеживание изменений файлов тестов
  var testsFileWatcher = filewatcher();

  glob(getConfig().projectBasePath + '/src/**/*.test.js', function(err, files) {
    watchFiles(testsFileWatcher, files);
  });

  testsFileWatcher.on('change', (file, stat) => {
    var testType = file.indexOf('.e2e.') !== -1 ? 'e2e' : 'unit';

    if (config.runners.indexOf(testType) === -1) {
      return;
    }

    if (childProcess && childProcess.connected) {
      console.log('ОСТАНОВКА ТЕСТИРОВАНИЯ');
      process.kill(childProcess.pid);
    }

    startTests(file, testType);
  });
}
