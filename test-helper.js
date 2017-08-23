var jsdom = require('jsdom').jsdom;
var expect = require('expect');
var fs = require('fs');

global.document = jsdom('<html><head><script></script></head><body></body></html>');
global.window = global.document.defaultView;
global.navigator = window.navigator = {};
global.Node = window.Node;

global.window.mocha = {};
global.window.beforeEach = beforeEach;
global.window.afterEach = afterEach;

global._ = require('lodash');
global.moment = require(`${process.cwd()}/node_modules/moment`);
window.jQuery = require('jquery');
if (fs.existsSync(`${process.cwd()}/node_modules/angular/angular.js`)) {
    console.log('angular is required');
    require(`${process.cwd()}/node_modules/angular/angular`);
    global.angular = window.angular;
}
if (fs.existsSync(`${process.cwd()}/node_modules/angular-mocks/angular-mocks.js`)) {
    require(`${process.cwd()}/node_modules/angular-mocks`);
    global.inject = global.angular.mock.inject;
    global.ngModule = global.angular.mock.module;
}
if (fs.existsSync(`${process.cwd()}/node_modules/funbox-angular-ff/src/ff.js`)) {
    global.ff = require(`${process.cwd()}/node_modules/funbox-angular-ff`);
}
global.expect = expect;

if (!!angular) {
    angular.module('app', []);
}
