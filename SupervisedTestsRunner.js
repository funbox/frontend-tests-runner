const childProcess = require('child_process');
const filewatcher = require('filewatcher');
const fastGlobSync = require('fast-glob').sync;
const TestsRunner = require('./TestsRunner');

class SupervisedTestsRunner {
  constructor(config) {
    this.config = config;
    this.testsRunner = new TestsRunner(config);
  }

  start() {
    let result = this.config.project.build().then(() => this.startAllTests());
    if (this.config.live) {
      this.config.project.addListener('buildStart', () => {
        this.testsRunner.stop();
      });
      this.config.project.addListener('buildFinish', () => {
        this.startAllTests();
      });
      this.trackFileChanges();
    } else {
      result = result.then(code => { process.exit(code); });
    }

    return result;
  }

  trackFileChanges() {
    const watcher = filewatcher();

    fastGlobSync(this.config.testFiles).forEach(file => {
      watcher.add(file);
    });

    watcher.on('change', file => {
      console.log(`File changed: ${file}`);
      this.calculateTestFiles().then(({ files }) => {
        if (files.indexOf(file) > -1) {
          this.testsRunner.runTestFiles([file]);
        }
      });
    });
  }

  startAllTests() {
    return this.calculateTestFiles().then(async ({ files, filterEnabled }) => {
      const testsForRun = this.config.filterTestsFiles
        ? await this.config.filterTestsFiles(files, filterEnabled, this.config)
        : files;

      return this.testsRunner.runTestFiles(testsForRun);
    });
  }

  calculateTestFiles() {
    const calc = childProcess.fork(`${__dirname}/TestFilesCalculator.js`);

    return new Promise(resolve => {
      calc.on('message', msg => {
        calc.kill();
        resolve(msg.result);
      });

      calc.send({ filesGlob: this.config.testFiles });
    });
  }
}

module.exports = SupervisedTestsRunner;
