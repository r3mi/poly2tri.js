/*
 * Build script for poly2tri.js
 * 
 * (c) 2014, Rémi Turboult
 * All rights reserved.
 * Distributed under the 3-clause BSD License, see LICENSE.txt
 */

"use strict";

var gulp = require('gulp');
var plug = require('gulp-load-plugins')();

var pkg = require('./package.json');

var MINI_BANNER = '/*! <%= pkg.name %> v<%= pkg.version %> | (c) 2009-2014 Poly2Tri Contributors */\n';

var JS_SRC = 'src/*.js';
var JS_ALL = ['*.js', JS_SRC, 'tests/*.js', 'tests/spec/*.js'];

gulp.task('default', ['watch']);
gulp.task('build', ['jshint', 'templates', 'scripts']);

var watching = false;
gulp.task('watch', ['build'], function() {
    watching = true;
    gulp.watch(JS_ALL, ['jshint']);
    gulp.watch([JS_SRC, "src/templates/*"], ['templates', 'scripts']);
});

gulp.task('clean', function() {
    return gulp.src('dist/', {read: false}).pipe(plug.clean());
});

gulp.task('jshint', function() {
    return gulp.src(JS_ALL)
            .pipe(watching ? plug.plumber() : plug.util.noop())
            .pipe(plug.jshint('.jshintrc'))
            .pipe(plug.jshint.reporter('jshint-stylish'))
            .pipe(watching ? plug.util.noop() : plug.jshint.reporter('fail'));
});

gulp.task('templates', function() {
    return gulp.src('src/templates/*')
            .pipe(watching ? plug.plumber() : plug.util.noop())
            .pipe(plug.template({pkg: pkg}))
            .pipe(gulp.dest('dist'));
});

gulp.task('scripts', ['templates'], function() {
    return gulp.src('src/poly2tri.js', {read: false})
            .pipe(watching ? plug.plumber() : plug.util.noop())
            .pipe(plug.browserify({standalone: 'poly2tri'}))
            .pipe(gulp.dest('dist'))
            // XXX rename via function instead of object because bug
            // XXX https://github.com/hparra/gulp-rename/issues/13
            .pipe(plug.rename(function(dir, base, ext) {
                return base + ".min" + ext;
            }))
            .pipe(plug.bytediff.start())
            .pipe(plug.uglify())
            .pipe(plug.header(MINI_BANNER, {pkg: pkg}))
            .pipe(plug.bytediff.stop())
            .pipe(gulp.dest('dist'));
});
