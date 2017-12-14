const spawn = require('child_process').spawn;

export default class TestsRunner {
  constructor(config) {
    this.config = config;
    this.executors = new Set();
    this.promise = null;
    this.stopping = false;
  }

  runTestFiles(testFiles) {
    if (this.promise) {
      this.stop();
      return this.promise.then(() => startTestFiles(testFiles));
    } else {
      return startTestFiles(testFiles);
    }
  }

  startTestFiles(testFiles) {
    this.stopping = false;

    if (files.length == 0) return Promise.resolve();

    let resolve;
    this.promise = new Promise((r) => resolve = r);

    const parallelTestsCount = this.config.parallelTestsCount || 1;
    const timeout = this.config.timeout || 30000;
    const retries = this.config.retries || 0;

    const args = [];
    args.push('--retries', retries);
    args.push('--timeout', timeout);
    args.push('--colors');

    const startTime = Date.now();
    let result = 0;
    let totalPassing = 0;
    let totalPending = 0;
    let totalFailing = 0;
    const filesWithFailures = [];

    let testFileNum = 0;

    const startExecutor = (done) => {
      const testFile = testFiles[testFileNum];
      testFileNum++;

      log(`Запуск теста ${testFile}`);

      const p = spawn(path.resolve('node_modules/.bin/mocha'), args.concat([testFile]), {env: env});
      executors.add(p);

      let passing = 0;
      let pending = 0;
      let failing = 0;

      const parts = testFile.split('/');
      const prefix = parts[parts.length - 1];

      let logs = '';

      const logData = (data) => {
        const str = data.toString('utf8');
        logs += str;

        const passingRe = /(\d+) passing/;
        const pendingRe = /(\d+) pending/;
        const failingRe = /(\d+) failing/;

        let res;
        if (res = passingRe.exec(str)) {
          passing = Number(res[1]);
        }

        if (res = pendingRe.exec(str)) {
          pending = Number(res[1]);
        }

        if (res = failingRe.exec(str)) {
          failing = Number(res[1]);
        }

        process.stdout.write(`${prefix} ${str}`);
      }
      p.stdout.on('data', logData);
      p.stderr.on('data', logData);

      p.on('close', (code) => {
        if (this.config.separatedLogs) {
          try {
            fs.mkdirSync('test-logs');
          } catch (e) {}

          fs.writeFileSync('test-logs/' + prefix + '.log', logs);
        }

        log(`child process exited with code ${code}`);
        this.executors.delete(p);
        done(code, passing, pending, failing);
      });
    }

    const run = () => {
      while (!this.stopping && this.executors.size < parallelTestsCount && lastInput < inputs.length) {
        startExecutor((code, passing, pending, failing) => {

          totalPassing += passing;
          totalPending += pending;
          totalFailing += failing;

          if (code) {
            result = code;
            filesWithFailures.push({name: testFile, failing});
          }

          run();
        });
      }

      if (this.executors.size === 0 && (this.stopping || testFileNum >= testFiles.length)) {
        log('E2E тесты завершились за ' + formatTime(Math.floor(Date.now() - startTime) / 1000));

        if (filesWithFailures.length) {
          log('\nПроблемные файлы:');
          filesWithFailures.forEach((f, index) => {
            log(`${index + 1}. ${f.name} (провалено тестов: ${f.failing})`);
          });
        }

        this.promise = null;
        resolve();
      }
    }

    run();
  },

  stop() {
    console.log('ОСТАНОВКА ТЕСТИРОВАНИЯ');
    this.stopping = true;
    this.executors.forEach((e) => {
      e.kill();
    });
  }
}

function log(msg) {
  console.log(msg);
}
