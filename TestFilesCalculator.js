const globSync = require('glob').sync;

const emptyFn = () => {};
global['before'] = emptyFn;
global['beforeEach'] = emptyFn;
global['after'] = emptyFn;
global['afterEach'] = emptyFn;
global['it'] = emptyFn;
global['it'].skip = emptyFn;
global['xit'] = emptyFn;
global['describe'] = (name, fn) => fn();
global['describe'].skip = emptyFn;

let filterEnabled = false;
const filteredTestFiles = [];

process.on('message', (filesGlob) => {
  const testFiles = globSync(filesGlob);
  testFiles.forEach((testFile) => {
    let filter = false;

    global['describe'].only = (name, fn) => {
      filter = true;
      fn();
    }

    global['it'].only = () => {
      filter = true;
    }

    try {
      require(testFile);
    } catch (e) {
      console.log(e.stack || e);
    }

    if (filter) {
      filterEnabled = true;
      filteredTestFiles.push(testFile);
    }
  });

  process.send(filterEnabled ? filteredTestFiles : testFiles);
});
