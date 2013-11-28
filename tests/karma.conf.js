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
            'lib/js/jquery.js', // for Ajax loading 
            'tests/spec/*.js',
            {pattern: 'tests/data/**/*', included: false}
        ],
        preprocessors: {
            'tests/spec/*.js': ['browserify']
        },
        browserify: {
            //watch: true
        },
        browsers: ['Chrome', 'Firefox', 'PhantomJS']
    });
};
