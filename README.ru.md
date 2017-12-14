# funbox-frontend-tests-runner

funbox-frontend-tests-runner — это библиотека, позволяющая запускать mocha-тесты в несколько потоков и с поддержкой live-режима.

Скрипты запуска тестов были выделены из окружения для проектов на Angular 1 в отдельную библиотеку для более гибкого подхода к тестированию. Это позволяет разработчикам иметь возможность запускать тесты привычным им образом без привязки к фреймворку или средству сборки. Библиотека в свою очередь не знает какого типа тесты она запускает (unit- или e2e-тесты), не знает как запустить проект и на каком порту проект будет работать, что позволяет абстрагироваться от системы сборки (webpack/gulp и т.п.).

Библиотека подключается в проект следующим образом:

```javascript
// tests.config.js
module.exports = {
  parallelTestsCount: 2,
  live: false,
  separatedLogs: true,
}

// tests.live.config.js
module.exports = {
  parallelTestsCount: 2,
  live: true,
  separatedLogs: true,
}

// tests.runner.js

const Runner = require('funbox-frontend-tests-runner');
// Предполагаем что в проекте используется окружение funbox-frontend-env-webpack
const webpackConfig = require('webpack.app.test.js');

const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const EventEmitter = require('events');
const fs = require('fs');

if (process.argv !== 3) {
  console.log("Usage: tests.runner.js <config>");
  process.exit(1);
}

const config = require(process.argv[2]);

const project = new EventEmitter();

project.build = () => {
  return new Promise((resolve, reject) => {
    // В данном примере в качестве средства сборки в проекте используется webpack
    new WebpackDevServer(webpack(webpackConfig), webpackConfig.devServer).listen(webpackConfig.devServer.port, 'localhost', (err) => {
      if (err) {
        console.log('Ошибка сборки: ' + err);
        process.exit(1);
      }

      let started = false;
      process.stdout.on('data', (data) => {
        if (!started && data.indexOf('webpack: Compiled successfully.') > -1) {
          started = true;
          resolve();
        }
      });
    });
  });
}

// В данном примере для реализации работы live-режима использует плагин funbox-rebuild-in-progress-webpack-plugin
const rebuildInProgressFile = 'node_modules/.rebuildInProgress';

fs.watch(path.dirname(rebuildInProgressFile), (eventType, filename) => {
  if (eventType === 'rename' && filename === path.basename(rebuildInProgressFile)) {
    if (fs.existsSync(rebuildInProgressFile)) {
      project.emit('buildStart');
    } else {
      project.emit('buildFinish');
    }
  }
});

config.project = project;

const runner = new Runner(config);
runner.start();
```
