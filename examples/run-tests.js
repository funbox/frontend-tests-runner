/* eslint-disable import/no-unresolved, import/no-dynamic-require, import/no-extraneous-dependencies */

if (process.argv.length !== 3) {
  console.log('Usage: node run-tests.js <config>');
}

const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const Runner = require('@funboxteam/frontend-tests-runner');
const { isPortFree, findFreePort } = require('@funboxteam/free-port-finder');

const config = require(path.resolve(process.argv[2]));
const webpackConfig = require(path.resolve(__dirname, '../webpack.app.test.js'));

const project = new EventEmitter();

let resolveInitialBuild;

// Pass PhantomJS arguments through the env variable
process.env.BROWSER_ARGS = JSON.stringify(config.browserArgs);

project.build = () => {
  if (config.live) {
    setBaseUrl();
    return isPortFree(webpackConfig.devServer.port).then(isFree => (isFree ? build() : Promise.resolve()));
  }

  return findFreePort(webpackConfig.devServer.port).then(port => {
    console.log(`Free port found: ${port}`);
    webpackConfig.devServer.port = port;
    setBaseUrl();
    return build();
  });
};

function setBaseUrl() {
  // Pass env variable BASE_URL to make it possible for E2E tests to find the app URL
  process.env.BASE_URL = `http://localhost:${webpackConfig.devServer.port}`;
  console.log(`BASE_URL: ${process.env.BASE_URL}`);
}

// Here we assume that @funboxteam/rebuild-in-progress-webpack-plugin is used for live mode
const rebuildInProgressFile = path.resolve(__dirname, '../../node_modules/.rebuildInProgress');

fs.watch(path.dirname(rebuildInProgressFile), (eventType, filename) => {
  if (eventType === 'rename' && filename === path.basename(rebuildInProgressFile)) {
    if (fs.existsSync(rebuildInProgressFile)) {
      project.emit('buildStart');
    } else {
      if (resolveInitialBuild) {
        resolveInitialBuild();
        resolveInitialBuild = null;
      }
      project.emit('buildFinish');
    }
  }
});

config.project = project;

const runner = new Runner(config);
runner.start();

function build() {
  return new Promise(resolve => {
    // For example we use Webpack here
    new WebpackDevServer(webpack(webpackConfig), webpackConfig.devServer).listen(webpackConfig.devServer.port, 'localhost', err => {
      if (err) {
        console.log(`Build error: ${err}`);
        process.exit(1);
      }

      resolveInitialBuild = resolve;
    });
  });
}
