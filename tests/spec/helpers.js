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


/**
 * Parse a string of floats, ignoring any separators between values
 * @param {String} str
 * @returns {Array<number>} parsed floats
 */
exports.parseFloats = function (str) {
    var floats = str.split(/[^-+eE\.\d]+/).map(parseFloat).filter(function (val) {
        return !isNaN(val);
    });
    return floats;
};


/**
 * Simple polygon generation (star shaped)
 * See http://stackoverflow.com/questions/8997099/algorithm-to-generate-random-2d-polygon
 *
 * @param {Function} rnd    generate a random float in the interval [0;1[
 * @param {number} n        number of vertices
 * @returns {Array<number>} array of vertices (x then y)
 */
exports.randomPolygon = function (rnd, n) {
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
};


/**
 * Checks that all the triangles vertices are in the list of points
 * @param {Array<Triangle>} triangles       array of triangles
 * @param {Array<Array{x,y}>} pointsLists   array of array of Points
 * @returns {Triangle} a triangle failing the test, or null if success
 */
exports.testTrianglesToBeInPoints = function (triangles, pointsLists) {
    var i, tlen = triangles.length, failed = null;
    for (i = 0; i < tlen && !failed; i++) {
        var triangle = triangles[i], found0 = false, found1 = false, found2 = false;
        /* jshint loopfunc:true */
        pointsLists.forEach(function (points) {
            var j, plen = points.length;
            for (j = 0; j < plen && !(found0 && found1 && found2); j++) {
                var point = points[j];
                // Here we are comparing point references, not values
                found0 = found0 || (triangle.getPoint(0) === point);
                found1 = found1 || (triangle.getPoint(1) === point);
                found2 = found2 || (triangle.getPoint(2) === point);
            }
        });
        if (!(found0 && found1 && found2)) {
            failed = triangle;
        }
    }
    return failed;
};


/**
 * Checks that all the points are in at least one triangle
 * @param {Array<Triangle>} triangles       array of triangles
 * @param {Array<Array{x,y}>} pointsLists   array of array of Points
 * @returns {Point} a point failing the test, or null if success
 */
exports.testTrianglesToContainPoints = function (triangles, pointsLists) {
    var failed = null;
    pointsLists.forEach(function (points) {
        var i, plen = points.length;
        for (i = 0; i < plen && !failed; i++) {
            var point = points[i], found = false, j, tlen = triangles.length;
            for (j = 0; j < tlen && !found; j++) {
                found = found || triangles[j].containsPoint(point);
            }
            if (!found) {
                failed = point;
            }
        }
    });
    return failed;
};


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

