/*
 * Poly2Tri Copyright (c) 2009-2014, Poly2Tri Contributors
 * http://code.google.com/p/poly2tri/
 * 
 * poly2tri.js (JavaScript port) (c) 2009-2017, Poly2Tri Contributors
 * https://github.com/r3mi/poly2tri.js
 * 
 * Build script for poly2tri.js
 * Rémi Turboult, 12/2013
 * 
 * All rights reserved.
 * 
 * Distributed under the 3-clause BSD License, see LICENSE.txt
 */

"use strict";

var browserify = require('browserify');
var fs = require('fs');
var uglify = require('uglify-js');
var pkg = require('./package.json');

// Update version file (require'd by main poly2tri.js for VERSION string)
fs.writeFileSync('./dist/version.json', '{"version": "' + pkg.version + '"}');

var preamble = '/*! ' + pkg.name + ' v' + pkg.version + ' | (c) 2009-2017 Poly2Tri Contributors */\n';

var b = browserify('./src/poly2tri.js', {standalone: 'poly2tri'});
b.bundle(function(err, buffer) {
    if (err instanceof Error) {
        throw(err);
    }
    if (err) {
        process.stderr.write(err);
    }
    if (buffer) {
        fs.writeFileSync('./dist/poly2tri.js', buffer);
        var min = uglify.minify(buffer.toString(), {fromString: true, compress: true, mangle: true});
        fs.writeFileSync('./dist/poly2tri.min.js', preamble + min.code);
    }
});
