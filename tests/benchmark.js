#!/usr/bin/env node
/*
 * Benchmarking tests for poly2tri.js
 *
 * (c) 2013-2014, Rémi Turboult
 * All rights reserved.
 * Distributed under the 3-clause BSD License, see LICENSE.txt
 */

"use strict";

var Benchmark = require('benchmark').Benchmark;
var load = require('load');
var Linespin = require('linespin');
var bars = require('jstrace-bars');

var suite = new Benchmark.Suite();


function makePoint(x, y, poly2tri) {
    return new poly2tri.Point(x, y);
}
function makeXY(x, y) {
    return { x: x, y: y };
}
function makeXY_(x, y) {
    return { x: x, y: y, _p2t_edge_list: null };
}

/*
 * Define the known poly2tri versions
 */

var loaders = {
    // 1st version with Steiner points (and optional Namespace.js).
    '1.1.1': function () {
        // use "load" to work around missing Node.js support
        var p = load('./versions/1.1.1/poly2tri').js.poly2tri;
        return { poly2tri: p, makePoint: makePoint };
    },
    '1.2.0': function () {
        var p = require('./versions/1.2.0/poly2tri');
        return { poly2tri: p, makePoint: makePoint };
    },
    // Last version before browserify
    '1.2.7': function () {
        var p = require('./versions/1.2.7/poly2tri');
        return { poly2tri: p, makePoint: makePoint };
    },
    // Last version before atan2 improvements
    '1.3.3': function () {
        var p = require('./versions/1.3.3/poly2tri.min');
        return { poly2tri: p, makePoint: makePoint };
    },
    // atan2 improvements
    '1.3.4': function () {
        var p = require('./versions/1.3.4/poly2tri');
        return { poly2tri: p, makePoint: makePoint };
    },
    'current.src': function () {
        var p = require('../src/poly2tri');
        return { poly2tri: p, makePoint: makePoint };
    },
    'current.dist': function () {
        var p = require('../dist/poly2tri');
        return { poly2tri: p, makePoint: makePoint };
    },
    'current.dist.min': function () {
        var p = require('../dist/poly2tri.min');
        return { poly2tri: p, makePoint: makePoint };
    },
    '1.3.4-XY_': function () {
        var p = require('./versions/1.3.4/poly2tri');
        return { poly2tri: p, makePoint: makeXY_ };
    },
    '1.3.4-XY': function () {
        var p = require('./versions/1.3.4/poly2tri');
        return { poly2tri: p, makePoint: makeXY };
    },
    'current.dist.XY_': function () {
        var p = require('../dist/poly2tri');
        return { poly2tri: p, makePoint: makeXY_ };
    },
    'current.dist.XY': function () {
        var p = require('../dist/poly2tri');
        return { poly2tri: p, makePoint: makeXY };
    }
};


/*
 * Get versions to test from the command line arguments
 * (default to all versions)
 */

function usage() {
    console.log("usage: " + process.argv[1] + " [--help] [version] [version] ...");
    console.log("where [version] can be: " + Object.keys(loaders).join(" "));
    process.exit();
}

if (process.argv[2] === '--help') {
    usage();
}

var versions = (process.argv.length > 2 ? process.argv.slice(2) : Object.keys(loaders));


/*
 * Repeatable test data
 */

// constant polygon data : same as poly2tri issue #39
var contour = [-311, 774, -216, 418, -48, 343, 23, 318, 44, 284, 59, 262, 84, 242, 92, 161, 131, 134, 140, 77, 134, 30, 118, 6, 115, -32, 67, -85, 213, -85, 211, -53, 198, -13, 182, 63, 165, 120, 194, 137, 238, 111, 265, 5, 243, -87, 502, -93, 446, 772];
var hole1 = [-276, 747, 421, 745, 473, -65, 276, -61, 291, 2, 291, 8, 262, 123, 256, 131, 201, 163, 186, 163, 155, 145, 150, 152, 118, 175, 110, 250, 105, 259, 78, 281, 66, 299, 43, 335, 36, 341, -37, 367, -37, 368, -193, 438];
var hole2 = [161, 32, 172, -19, 171, -20, 184, -58, 127, -58, 138, -46, 141, -38, 144, -2, 157, 17, 160, 23];
var points = [148, 127, 161, 70, 157, 82, 152, 98, 160, 35, 115, -58, 160, 65, 149, 117, -205, 428, -44, 356, 29, 330, 32, 326, 55, 292, 69, 271, 94, 251, 96, 245, 104, 169, 141, 143, 143, 138, 153, 78, 153, 75, 146, 26, 131, 2, 127, -35, 126, -39, 97, -72, 199, -72, 198, -57, 184, -16, 169, 59, 150, 120, 153, 129, 190, 150, 197, 150, 247, 121, 250, 116, 278, 6, 278, 3, 260, -74, 488, -80, 434, 759, -294, 761];

function makePoints(arr, poly2tri, makePoint) {
    var i, len = arr.length, points = [];
    for (i = 0; i < len; i += 2) {
        points.push(makePoint(arr[i], arr[i + 1], poly2tri));
    }
    return points;
}

function triangulate(poly2tri, makePoint) {
    var c = makePoints(contour, poly2tri, makePoint);
    var h1 = makePoints(hole1, poly2tri, makePoint);
    var h2 = makePoints(hole2, poly2tri, makePoint);
    var p = makePoints(points, poly2tri, makePoint);
    var swctx = new poly2tri.SweepContext(c);
    // Call methods with old names, in order to be compatible
    // with old and new version of poly2tri.
    swctx.AddHole(h1);
    swctx.AddHole(h2);
    p.forEach(function (point) {
        swctx.AddPoint(point);
    });
    poly2tri.sweep.Triangulate(swctx);
    swctx.GetTriangles();
}


/*
 * Load the poly2tri versions and add to tests
 */

versions.forEach(function (v) {
    var spin = new Linespin(v);
    try {
        var loaded = loaders[v].call();
        suite.add(v, function () {
            triangulate(loaded.poly2tri, loaded.makePoint);
        }, {
                onStart: function () {
                    spin.start();
                },
                onError: function (event) {
                    spin.error(v + ": " + event.message);
                },
                onComplete: function (event) {
                    spin.stop(String(event.target));
                }
            });
        console.log("Loaded version " + v);
    } catch (e) {
        console.log("*** can't load or unknown '" + v + "' version");
        usage();
    }
});


/*
 * Run tests
 */

// add listeners
suite
    .on('complete', function () {
        console.log("");
        console.log('Fastest is ' + this.filter('fastest').pluck('name'));
        console.log("");

        // Sorted ouput with ascii bars
        var successful = this.filter('successful');
        var data = {};
        successful.forEach(function (value) {
            data[value.name] = Math.round(1 / value.stats.mean);
        });
        console.log(bars(data, { sort: false }));
    })
    // run async
    .run({ 'async': true });


