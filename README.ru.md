# @funboxteam/frontend-tests-runner

[![npm](https://img.shields.io/npm/v/@funboxteam/frontend-tests-runner.svg)](https://www.npmjs.com/package/@funboxteam/frontend-tests-runner)

Библиотека для запуска Mocha-тесты в несколько потоков и отслеживания изменений файлов в live-режиме.

## Установка

```bash
npm install --save-dev @funboxteam/frontend-tests-runner
```

## Подключение в проект

Пример подключения:

```javascript
const config = {
  parallelTestsCount: 2,
  testFiles: './src/tests/e2e/*.js',
  project: {
    build() {
      // Функция для сборки проекта. Должна возвращать Promise.
    },
    addListener(event) {
      // Функция подписки на два возможных события:
      //   buildStart — проект начал собираться;
      //   buildFinish — проект закончил собираться.
      // Нужна для live-тестов.
    }
  }
};

const Runner = require('@funboxteam/frontend-tests-runner');
const runner = new Runner(config);
runner.start();
```

Больше примеров см. в папке [examples](./examples).

### Конфигурация

Пример всех параметров конфигурации и их значений по умолчанию:

```javascript
module.exports = {
  // Количество файлов с тестами, запускающихся одновременно.
  // Не обязательный.
  parallelTestsCount: 1,

  // Запуск тестов в live-режиме (слежение за изменениями файлов тестов и файлов проекта).
  // Не обязательный.
  live: false,

  // Запись отдельного лога по каждому тест-файлу.
  // Не обязательный.
  separatedLogs: false,

  // Имя директории, в которую будет записан лог, при включенном `separatedLogs`.
  // Не обязательный.
  logDir: 'test-logs',

  // Glob файлов с тестами, например: `tests/\*.js`.
  // Обязательный.
  testFiles: undefined,

  project: {
    build() {
      // Функция для сборки проекта. Должна возвращать Promise.
    },
    addListener(event) {
      // Функция подписки на два возможных события:
      //   buildStart — проект начал собираться;
      //   buildFinish — проект закончил собираться.
      // Нужна для live-тестов.
    }
  },

  // Конфигурация Mocha.
  // Не обязательный.
  mocha: {
    // Лимит времени выполнения теста (в миллисекундах).
    // https://mochajs.org/#-timeout-ms-t-ms
    // Не обязательный.
    timeout: 30000,

    // Количество попыток перезапуска тестов при падении.
    // https://mochajs.org/#-retries-n
    // Не обязательный.
    retries: 0,

    // Отключение вывода цветов в терминал.
    // https://mochajs.org/#-color-c-colors
    // Не обязательный.
    noColors: false,

    // Объект с дополнительными аргументами для запуска Mocha.
    // Не обязательный.
    args: {
      // например:
      // '--compilers': 'js:babel-register',
      // '--require': [
      //   '@babel/register',
      //   'babel-polyfill',
      // ],
    },
  },
}
```

[![Sponsored by FunBox](https://funbox.ru/badges/sponsored_by_funbox_centered.svg)](https://funbox.ru)
