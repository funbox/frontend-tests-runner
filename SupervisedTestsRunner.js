const childProcess = require('child_process');
const filewatcher = require('filewatcher');
const fastGlobSync = require('fast-glob').sync;
const dependencyTree = require('dependency-tree');
const fs = require('fs');

const TestsRunner = require('./TestsRunner');

const ANSI_GREEN = '\x1b[32m';
const ANSI_ALL_OFF = '\x1b[0m';

class SupervisedTestsRunner {
  constructor(config) {
    this.config = config;
    this.testsRunner = new TestsRunner(config);

    if (config.dependencyTree) {
      const tree = dependencyTree(config.dependencyTree);
      const treeEntry = tree[Object.keys(tree)[0]];

      this.filteredTrees = Object.keys(treeEntry)
        .filter(path => path.replace(/\\/g, '/').includes(config.dependencyTree.directory))
        .map(path => ({
          entry: /.*index.js$/.test(path)
            ? Object.keys(treeEntry[path])[0]
            : path,
          [path]: '',
          ...treeEntry[path],
        }));
    }

    this.ignoredFiles = config.ignoredFiles ? fastGlobSync(config.ignoredFiles) : [];
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
      this.calculateTestFiles().then(files => {
        if (files.indexOf(file) > -1) {
          this.testsRunner.runTestFiles([file]);
        }
      });
    });
  }

  /* eslint-disable consistent-return */
  startAllTests() {
    return this.calculateTestFiles().then(({ files, filterEnabled }) => {
      if (filterEnabled) {
        this.testsRunner.runTestFiles(files);

        return;
      }

      if (this.config.ignoredBranches) {
        const currentBranch = process.env.GIT_BRANCH || require('child_process').execSync('git rev-parse --abbrev-ref HEAD').toString().trim();

        if (this.config.ignoredBranches.includes(currentBranch.replace(/^origin\//, ''))) {
          console.log(`${ANSI_GREEN}Current branch is ignored${ANSI_ALL_OFF}`);

          return;
        }
      }

      const changedFiles = this.config.baseBranch
        ? require('child_process')
          .execSync(`git diff --name-only origin/${this.config.baseBranch}`)
          .toString()
          .split('\n')
          .filter(file => !!file && !this.ignoredFiles.includes(file))
        : [];

      if (this.config.baseBranch && !changedFiles.length) {
        console.log(`${ANSI_GREEN}No files changed${ANSI_ALL_OFF}`);

        return;
      }

      if (!this.config.dependencyTree || !this.config.baseBranch) return this.testsRunner.runTestFiles(files);

      const testFiles = fastGlobSync(this.config.testFiles);

      const changedFilesWithoutTests = changedFiles.filter(file => !testFiles.some(testFile => testFile.includes(file)));

      const changedGlobalFiles = changedFilesWithoutTests
        .filter(file => !JSON.stringify(this.filteredTrees).replace(/\\\\/g, '/').includes(file));

      if (changedGlobalFiles.length) {
        console.log(`${ANSI_GREEN}Found changed files without target, run all tests${ANSI_ALL_OFF}`);

        return this.testsRunner.runTestFiles(files);
      }

      const changedTests = testFiles.filter(testFile => changedFiles.some(file => testFile.includes(file)));

      const changedTrees = this.filteredTrees
        .filter(tree => changedFilesWithoutTests
          .some(file => JSON.stringify(tree).replace(/\\\\/g, '/').includes(file)))
        .map(tree => tree.entry);

      const affectedTests = files
        .filter(file => {
          const name = /^\/\/\sTarget:\s(.*)\s/.exec(fs.readFileSync(file, { encoding: 'utf8' }));

          return changedTrees.some(tree => tree.includes(name && name[1]));
        });

      const testsForRun = [...new Set([...affectedTests, ...changedTests])];

      console.log(`${ANSI_GREEN}Run tests affected by change${ANSI_ALL_OFF}`);

      return this.testsRunner.runTestFiles(testsForRun.length ? testsForRun : files);
    });
  }
  /* eslint-enable consistent-return */

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
