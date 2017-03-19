/*
 * Karma configuration for unit tests, common part.
 * New configuration file syntax : Karma >= 0.10
 * 
 * (c) 2013-2017, Rémi Turboult
 * All rights reserved.
 * Distributed under the 3-clause BSD License, see LICENSE.txt
 */


'use strict';

module.exports = {
    basePath: '../',
    frameworks: ['jasmine', 'browserify'],
    singleRun: true,
    files: [
        'tests/**/*Spec.js',
        { pattern: 'tests/data/**/*', included: false }
    ],
    preprocessors: {
        "tests/spec/*.js": ['browserify']
    },
    browserify: {
    },
    browserNoActivityTimeout: 15000
    //logLevel: "LOG_DEBUG",
};


