/*
 * Build script for poly2tri.js
 * 
 * (c) 2014, Rémi Turboult
 * All rights reserved.
 * Distributed under the 3-clause BSD License, see LICENSE.txt
 */

"use strict";

var gulp = require('gulp');
var pkg = require('./package.json');
var fs = require('fs');
var uglify = require('gulp-uglify');
var bytediff = require('gulp-bytediff');
var header = require('gulp-header');
var rename = require("gulp-rename");
var sourceStream = require('vinyl-source-stream');
var browserify = require('browserify');


var TODAY = new Date().toJSON().slice(0, 10);
var MINI_BANNER = '/*! <%= pkg.name %> v<%= pkg.version %> | built ' + TODAY +
        ' | (c) Poly2Tri Contributors */\n';

gulp.task('build', function() {
    // Use vinyl-source-stream + browserify instead of gulp-browserify because
    // - I won't to control the version of browserify I am using
    // - gulp-browserify with 'standalone' option is currently buggy
    //   https://github.com/deepak1556/gulp-browserify/issues/9
    return browserify('./src/poly2tri.js').bundle({standalone: 'poly2tri'})
            .pipe(sourceStream('poly2tri.js'))
            .pipe(gulp.dest('dist/poly2tri.js'))
            ;
});

gulp.task('version', function() {
    // Update version file (require'd by main poly2tri.js for VERSION string)
    fs.writeFileSync('./dist/version.json', '{"version": "' + pkg.version + '"}');
});

gulp.task('compress', ['build'], function() {
    return gulp.src('dist/poly2tri.js')
            // rename via function instead of object because bug
            // https://github.com/hparra/gulp-rename/issues/13
            .pipe(rename(function(dir, base, ext) {
                return base + ".min" + ext;
            }))
            .pipe(bytediff.start())
            .pipe(uglify())
            .pipe(header(MINI_BANNER, {pkg: pkg}))
            .pipe(bytediff.stop())
            .pipe(gulp.dest('dist'))
            ;
});

gulp.task('watch', function() {
    gulp.watch("src/*.js", ['build', 'compress']);
});
