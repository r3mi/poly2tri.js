/*
 * Karma configuration for unit tests : run all browsers.
 * 
 * (c) 2013-2014, Rémi Turboult
 * All rights reserved.
 * Distributed under the 3-clause BSD License, see LICENSE.txt
 */

'use strict';

module.exports = function(config) {
    var conf = require('./karma.common');
    conf.frameworks.push('detectBrowsers');
    conf.detectBrowsers = {
        enabled: true,
        usePhantomJS: true
    };
    config.set(conf);
};
