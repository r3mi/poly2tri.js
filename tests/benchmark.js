/*
 * Poly2Tri Copyright (c) 2009-2013, Poly2Tri Contributors
 * http://code.google.com/p/poly2tri/
 * 
 * poly2tri.js (JavaScript port) (c) 2009-2013, Poly2Tri Contributors
 * https://github.com/r3mi/poly2tri.js
 *
 * Benchmarking tests for poly2tri.js
 * Rémi Turboult, 12/2013
 *
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *
 * * Redistributions of source code must retain the above copyright notice,
 *   this list of conditions and the following disclaimer.
 * * Redistributions in binary form must reproduce the above copyright notice,
 *   this list of conditions and the following disclaimer in the documentation
 *   and/or other materials provided with the distribution.
 * * Neither the name of Poly2Tri nor the names of its contributors may be
 *   used to endorse or promote products derived from this software without specific
 *   prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

"use strict";

var Benchmark = require('benchmark').Benchmark;
var load = require('load');

var suite = new Benchmark.Suite();


/*
 * Load various poly2tri versions
 */ 

// 1st version with Steiner points (and optionnal Namespace.js).
// (use "load" to work around missing Node.js support)
var v_1_1_1 = load('./versions/1.1.1/poly2tri').js.poly2tri;

var v_1_2_0 = require('./versions/1.2.0/poly2tri');

// Last version before browserify
var v_1_2_7 = require('./versions/1.2.7/poly2tri');

var v_current_node = require('../src/poly2tri');
var v_current_browser = require('../dist/poly2tri');


/*
 * Repeatable test data
 */

// constant polygon data : same as poly2tri issue #39
var contour = [-311, 774, -216, 418, -48, 343, 23, 318, 44, 284, 59, 262, 84, 242, 92, 161, 131, 134, 140, 77, 134, 30, 118, 6, 115, -32, 67, -85, 213, -85, 211, -53, 198, -13, 182, 63, 165, 120, 194, 137, 238, 111, 265, 5, 243, -87, 502, -93, 446, 772];
var hole1 = [-276, 747, 421, 745, 473, -65, 276, -61, 291, 2, 291, 8, 262, 123, 256, 131, 201, 163, 186, 163, 155, 145, 150, 152, 118, 175, 110, 250, 105, 259, 78, 281, 66, 299, 43, 335, 36, 341, -37, 367, -37, 368, -193, 438];
var hole2 = [161, 32, 172, -19, 171, -20, 184, -58, 127, -58, 138, -46, 141, -38, 144, -2, 157, 17, 160, 23];
var points = [148, 127, 161, 70, 157, 82, 152, 98, 160, 35, 115, -58, 160, 65, 149, 117, -205, 428, -44, 356, 29, 330, 32, 326, 55, 292, 69, 271, 94, 251, 96, 245, 104, 169, 141, 143, 143, 138, 153, 78, 153, 75, 146, 26, 131, 2, 127, -35, 126, -39, 97, -72, 199, -72, 198, -57, 184, -16, 169, 59, 150, 120, 153, 129, 190, 150, 197, 150, 247, 121, 250, 116, 278, 6, 278, 3, 260, -74, 488, -80, 434, 759, -294, 761];

function makePoints(Point, a) {
    var i, len = a.length, points = [];
    for (i = 0; i < len; i += 2) {
        points.push(new Point(a[i], a[i + 1]));
    }
    return points;
}

function triangulate(P) {
    var c = makePoints(P.Point, contour);
    var h1 = makePoints(P.Point, hole1);
    var h2 = makePoints(P.Point, hole2);
    var p = makePoints(P.Point, points);
    var swctx = new P.SweepContext(c);
    swctx.AddHole(h1);
    swctx.AddHole(h2);
    p.forEach(function(point) {
        swctx.AddPoint(point);
    });
    P.sweep.Triangulate(swctx);
    swctx.GetTriangles();
}


/*
 * Run tests
 */

// add tests
suite
        .add('v1.1.1', function() {
    triangulate(v_1_1_1);
})
        .add('v1.2.0', function() {
    triangulate(v_1_2_0);
})
        .add('v1.2.7', function() {
    triangulate(v_1_2_7);
})
        .add('current.node', function() {
    triangulate(v_current_node);
})
        .add('current.browser', function() {
    triangulate(v_current_browser);
})
// add listeners
        .on('cycle', function(event) {
    console.log(String(event.target));
})
        .on('complete', function() {
    console.log("");
    console.log('Fastest is ' + this.filter('fastest').pluck('name'));

    // Sort results
    var sorted = this.filter('successful').sort(function(a, b) {
        a = a.stats;
        b = b.stats;
        return (a.mean + a.moe > b.mean + b.moe ? 1 : -1);
    });

    // Output results with ranks (ties get the same rank)
    var results = [sorted[0].name + " "];
    for (var i = 1; i < sorted.length; i++) {
        var a = sorted[i - 1];
        var b = sorted[i];
        if (a.compare(b) !== 0) {
            results.push("");
        }
        results[results.length - 1] += b.name + " ";
    }
    results.forEach(function(val, index) {
        console.log((index + 1) + ": " + val);
    });

})
// run async
        .run({'async': true});


