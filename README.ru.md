# @funboxteam/frontend-tests-runner

## Описание

**@funboxteam/frontend-tests-runner** — библиотека, позволяющая запускать Mocha-тесты в несколько потоков, а также следить за изменениями файлов тестов и файлов проекта в live-режиме.

Библиотека создана на основе скриптов запуска тестов, выделенных из рабочего окружения funbox-frontend-env-webpack. Отдельная библиотека позволяет разработчикам запускать тесты привычным образом, но без привязки к фреймворку или средству сборки, что увеличивает гибкость разработки проектов.

## Подключение библиотеки в проект

Подключение библиотеки в проект:

```javascript
const config = {
  parallelTestsCount: 2,
  testFiles: './src/tests/e2e/*.js',
  project: {
    build() {
      // функция билда проекта, должна возвращать Promise
    },
    addListener(event) {
      // функция подписки на два возможных события: buildStart — проект начал собираться, buildFinish — проект закончил собираться; нужно для live-тестов
    }
  }
}

const Runner = require('@funboxteam/frontend-tests-runner');
const runner = new Runner(config);
runner.start();
```

Примеры подключения библиотеки для проектов с рабочим окружением находятся в [examples](./examples).

### Конфигурация библиотеки

* `parallelTestsCount` — количество файлов с тестами, запускающихся одновременно;
* `live`  — запуск тестов в live-режиме (слежение за изменениями файлов тестов и файлов проекта);
* `separatedLogs` — запись отдельного лога по каждому тест-файлу после выполнения теста в папку `test-logs` или указанную в параметре `logDir`;
* `logDir` — имя папки, в которую будет записан лог, при включенном `separatedLogs`; необязательная опция. По умолчанию логи записываются в `test-logs`.
* `testFiles` — glob файлов с тестами, например, `tests/\*.js`;
* `mocha.timeout` — опция `timeout` для Mocha;
* `mocha.retries` — опция `retries` для Mocha (количество попыток перезапуска тестов при падении).
* `mocha.noColors` — опция `noColors` для Mocha (отмена вывода цветов в терминал).
* `mocha.args` – объект с дополнительными аргументами для запуска Mocha:

```javascript
{
  mocha: {
    timeout: 120000,
    retries: 0,
    noColors: true,
    args: {
      // '--compilers': 'js:babel-register',
      '--require': [
        '@babel/register',
        'babel-polyfill',
      ],
    },
  },
}
```
**Deprecated**

Свойства `timeout`, `retries`, `noColors` были перенесены в объект `mocha`.
