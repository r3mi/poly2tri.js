#!/usr/bin/env node
/*
 * Node tests for poly2tri.js
 *
 * (c) 2014, Rémi Turboult
 * All rights reserved.
 * Distributed under the 3-clause BSD License, see LICENSE.txt
 */

'use strict';

var Path = require('path');
process.chdir(Path.join(__dirname, ".."));

var jasmine = require('jasmine-node');
jasmine.executeSpecsInFolder({
    specFolders: [Path.join('tests', 'spec')],
    // isVerbose: true,
    showColors: true
});
