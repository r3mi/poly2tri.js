/*
 * Poly2Tri Copyright (c) 2009-2014, Poly2Tri Contributors
 * http://code.google.com/p/poly2tri/
 *
 * poly2tri.js (JavaScript port) (c) 2009-2014, Poly2Tri Contributors
 * https://github.com/r3mi/poly2tri.js
 *
 * Helper functions for poly2tri.js tests
 * Rémi Turboult, 04/2014
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


var xy = require('../../src/xy');


/**
 * Parse a string of floats, ignoring any separators between values
 * @param {String} str
 * @returns {Array<number>} parsed floats
 */
function parseFloats(str) {
    var floats = str.split(/[^-+eE\.\d]+/).map(parseFloat).filter(function (val) {
        return !isNaN(val);
    });
    return floats;
}
exports.parseFloats = parseFloats;


/**
 * Simple polygon generation (star shaped)
 * See http://stackoverflow.com/questions/8997099/algorithm-to-generate-random-2d-polygon
 *
 * @param {Function} rnd    generate a random float in the interval [0;1[
 * @param {number} n        number of vertices
 * @returns {Array<number>} array of vertices (x then y)
 */
function randomPolygon(rnd, n) {
    var i, theta = [], rho, x, y, points = [];
    for (i = 0; i < n; i++) {
        theta.push(rnd() * Math.PI * 2);
    }
    theta.sort();
    for (i = 0; i < n; i++) {
        rho = rnd() * 200;
        // pol2cart
        x = rho * Math.cos(theta[i]);
        y = rho * Math.sin(theta[i]);
        points.push(500 + x, 500 + y);
    }
    return points;
}
exports.randomPolygon = randomPolygon;


/**
 * Checks that the list of triangles vertices is the same as the given list of points
 * @param {Array<Triangle>} triangles       array of triangles
 * @param {Array<Array{x,y}>} pointsLists   array of array of Points
 * @returns {Triangle} a triangle failing the test, or null if success
 */
function testTrianglesToEqualVertices(triangles, pointsLists) {
    /* jshint maxcomplexity:8 */
    var tpoints = [];
    triangles.forEach(function (triangle) {
        tpoints.push.apply(tpoints, triangle.getPoints());
    });
    tpoints.sort(xy.compare);

    var ppoints = [].concat.apply([], pointsLists);
    ppoints.sort(xy.compare);

    var failed = null;
    var tplen = tpoints.length;
    var pplen = ppoints.length;
    var t, p;
    for (t = 0, p = 0; t < tplen && p < pplen && !failed; t++, p++) {
        if (tpoints[t] !== ppoints[p]) {
            // which one is missing ? the "smallest" one
            var cmp = xy.compare(tpoints[t], ppoints[p]);
            failed = ((cmp < 0) ? tpoints[t] : ppoints[p]);
        }
        // skip repeated points (shared vertices between triangles)
        while (t < tplen - 1 && tpoints[t + 1] === tpoints[t]) {
            t++;
        }
    }
    if (!failed) {
        if (t < tplen) {
            failed = tpoints[t];
        } else if (p < pplen) {
            failed = ppoints[p];
        }
    }
    return failed;
}
exports.testTrianglesToEqualVertices = testTrianglesToEqualVertices;


/**
 * Compute the number of expected triangles for a triangulation.
 * For Steiner points, works only if all the points are inside the polygon.
 *
 * @param {Array} contour       array of points ("Point like" object)
 * @param {Array<Array>} holes  array of array of points
 * @param {Array} steiner       array of points
 */
exports.computeExpectedNumberOfTriangles = function (contour, holes, steiner) {
    contour = contour || [];
    holes = holes || [];
    steiner = steiner || [];
    //
    // Every triangulation of an n-sided polygon (without holes or steiner points)
    // has n-2 triangles (see http://www.cise.ufl.edu/class/cot5520fa13/polytri.pdf).
    //
    // For a polygon with h holes and n vertices total (holes + outer boundary),
    // a triangulation has t = n + 2h - 2 triangles, which is a generalisation of the previous case
    // (see http://cs.smith.edu/~orourke/books/ArtGalleryTheorems/Art_Gallery_Chapter_5.pdf).
    // This formula works only if the holes are disjoints, i.e. not intersecting (not allowed
    // by poly2tri anyway), not included within each other, and not sharing vertices or edges.

    // Steiner points are a degenerate case of the holes (with 0 vertices), but this is valid only
    // if all the points are inside the polygon.
    //
    var nb_triangles = holes.reduce(function (n, hole) {
        return n + hole.length;
    }, contour.length) + 2 * (holes.length + steiner.length) - 2;
    return nb_triangles;
};

