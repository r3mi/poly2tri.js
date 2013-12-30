/*
 * Copyright 2013, Rémi Turboult
 * All rights reserved.
 * 
 * Karma configuration for unit tests.
 * New configuration file syntax : Karma >= 0.10
 */

module.exports = function(config) {
    'use strict';

    config.set({
        basePath: '../',
        frameworks: ['jasmine', 'browserify'],
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
        browsers: ['Chrome', 'Firefox', 'PhantomJS']
    });
};
