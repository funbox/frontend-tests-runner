const childProcess = require('child_process');
const filewatcher = require('filewatcher');
const globSync = require('glob').sync;
import TestsRunner from "./TestsRunner";

/*
 *  ожидаемый формат конфига от проекта:
 *  {
 *    parallelTestsCount: 2,
 *    live: true,
 *    separatedLogs: true,
 *    project: {
 *      build: () => new Promise((resolve, reject) => { }),
 *      addListener(eventName) { названия событий buildStart и buildFinish }
 *    }
 *  }
 *
 */

export default class SupervisedTestsRunner {
  constructor(config) {
    this.config = config;
    this.testsRunner = new TestsRunner(config);
  }

  start() {
    if (this.config.live) {
      this.config.project.addListener("buildStart", () => {
        this.testsRunner.stop();
      });
      this.config.project.addListener("buildFinish", () => {
        this.startAllTests();
      });
      this.trackFileChanges();
    }

    this.config.project.build().then(() => this.startAllTests());
  }

  trackFileChanges() {
    const watcher = filewatcher();

    globSync(this.config.testFiles).forEach((file) => {
      watcher.add(file);
    });

    watcher.on('change', (file, stat) => {
      // TODO обработать ситуацию когда файл удалился или добавился
      // TODO что делать если изменился один файл и он еще прогоняется когда изменился другой
      console.log(`Изменение файла ${file}`);
      calculateTestFiles().then((files) => {
        if (files.indexOf(file) > -1) {
          this.testsRunner.runTestFiles([file]);
        }
      });
    });
  }

  startAllTests() {
    calculateTestFiles().then((files) => {
      this.testsRunner.runTestFiles(files);
    });
  }

  calculateTestFiles() {
    const calc = childProcess.fork(`${__dirname}/TestFilesCalculator.js`);

    return new Promise((resolve) => {
      calc.on('message', (result) => {
        calc.kill();
        resolve(result);
      });

      calc.send(this.config.testFiles);
    });
  }

  trackFileChanges() {
    throw 'NotImplemented';
  }
}
