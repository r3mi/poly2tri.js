/*
 * Karma configuration for unit tests : run PhantomJS.
 * 
 * (c) 2013-2014, Rémi Turboult
 * All rights reserved.
 * Distributed under the 3-clause BSD License, see LICENSE.txt
 */

'use strict';

module.exports = function(config) {
    var conf = require('./karma.common');
    conf.browsers = ['PhantomJS'];
    config.set(conf);
};
