/*
 * Build script for poly2tri.js, using the "jake" build tool.
 * 
 * (c) 2014, Rémi Turboult
 * All rights reserved.
 * Distributed under the 3-clause BSD License, see LICENSE.txt
 */

/* global jake, desc, task, file, directory, complete */

"use strict";

var fs = require('fs');
var browserify = require('browserify');
var uglify = require('uglify-js');

function createWriteStream(filename) {
    var out = fs.createWriteStream(filename);
    out.on('finish', function() {
        jake.logger.log(filename);
        complete();
    });
    return out;
}

desc("builds the poly2tri library");
task("default", ["dist/poly2tri.js", "dist/poly2tri.min.js"], function() {
});

desc('Creates the directory for files to be distributed');
directory('dist');

desc("update version file (require'd by main poly2tri.js for VERSION string)");
file("dist/version.json", ["dist", "jakefile.js", "package.json"], function() {
    var pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    fs.writeFileSync('dist/version.json', '{"version": "' + pkg.version + '"}');
    jake.logger.log('version.json');
});

desc("builds the browserified poly2tri library");
var dep = new jake.FileList("jakefile.js", "dist/version.json", "src/*.js");
file("dist/poly2tri.js", dep.toArray(), {async: true}, function() {
    var b = browserify();
    b.add('./src/poly2tri.js');
    b.bundle({standalone: 'poly2tri'}).pipe(createWriteStream('dist/poly2tri.js'));
});

desc("builds the minified poly2tri library");
file("dist/poly2tri.min.js", ["jakefile.js", "dist/poly2tri.js", "package.json"], function() {
    var pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    var preamble = '/*! ' + pkg.name + ' v' + pkg.version + ' | (c) 2009-2014 Poly2Tri Contributors */\n';
    var options = {compress: true, mangle: true};
    var min = uglify.minify('dist/poly2tri.js', options);
    fs.writeFileSync('dist/poly2tri.min.js', preamble + min.code);
    jake.logger.log('poly2tri.min.js');
});

