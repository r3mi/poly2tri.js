/*
 * Karma configuration for unit tests, common part.
 * New configuration file syntax : Karma >= 0.10
 * 
 * (c) 2013-014, Rémi Turboult
 * All rights reserved.
 * Distributed under the 3-clause BSD License, see LICENSE.txt
 */


'use strict';

module.exports = {
    basePath: '../',
    frameworks: ['jasmine', 'browserify'],
    singleRun: true,
    files: [
        'tests/spec/*.js',
        {pattern: 'tests/data/**/*', included: false}
    ],
    preprocessors: {
        'tests/spec/*.js': ['browserify']
    },
    browserify: {
        // work around --standalone bug, see https://github.com/substack/node-browserify/issues/525
        noParse: ['dist/*.js']
    },
    //logLevel: "LOG_DEBUG",
};


