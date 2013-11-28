/*
 * Poly2Tri Copyright (c) 2009-2013, Poly2Tri Contributors
 * http://code.google.com/p/poly2tri/
 *
 * Unit tests for poly2tri.js
 * Rémi Turboult, 03/2013
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

/* global jasmine, describe, it, expect, beforeEach */

"use strict";

// ---------------------------------------------------------------Module loading

global.poly2tri = "previous";
var p2t = require('../../dist/poly2tri');
global.poly2tri = p2t;

describe("poly2tri module", function() {
    it("should require 'poly2tri'", function() {
        expect(p2t).toBeDefined();
        expect(p2t.triangulate).toBeDefined();
    });
    it("should have a noConflict() method", function() {
        var pp = global.poly2tri.noConflict();
        expect(pp).toBe(p2t);
        if (process.browser) {
            expect(global.poly2tri).toBe("previous");
        }
    });
});


// -------------------------------------------------------------Node vs. Browser 

if (process.browser) {
    /**
     * Read an external data file.
     * Done synchroneously, to simplify and avoid using jasmine's waitsFor/runs
     * @param {String} filename
     * @param {String} dataType     see jQuery.Ajax dataType (default: Intelligent Guess)
     * @returns {String}    file content, undefined if problem
     */
    var readFileSync = function(filename, dataType) {
        var data;
        /* global $ */
        $.ajax({
            async: false,
            url: "base/tests/data/" + filename,
            dataType: dataType,
            success: function(d) {
                data = d;
            }
        });
        return data;
    };
} else {
    var fs = require('fs');
    var readFileSync = function(filename, dataType) {
        var data = fs.readFileSync("tests/data/" + filename, 'utf8');
        return (dataType === 'json') ? JSON.parse(data) : data;
    };
}



describe("poly2tri", function() {

// ------------------------------------------------------------------------utils
    /*
     * Utilities
     * =========
     */
    var MersenneTwister = require('mersennetwister');

    // Creates list of Point from list of coordinates [ x1, y1, x2, y2 ...]
    function makePoints(a) {
        var i, len = a.length, points = [];
        for (i = 0; i < len; i += 2) {
            points.push(new p2t.Point(a[i], a[i + 1]));
        }
        return points;
    }

    // Simple polygon generation (star shaped)
    // http://stackoverflow.com/questions/8997099/algorithm-to-generate-random-2d-polygon
    function randomPolygon(generator, n) {
        var i, theta = [], rho, x, y, points = [];
        for (i = 0; i < n; i++) {
            theta.push(generator() * Math.PI * 2);
        }
        theta.sort();
        for (i = 0; i < n; i++) {
            rho = generator() * 200;
            // pol2cart
            x = rho * Math.cos(theta[i]);
            y = rho * Math.sin(theta[i]);
            points.push(500 + x, 500 + y);
        }
        return points;
    }


    /**
     * Checks that all the triangles vertices are in the list of points
     * @param   triangles   array of triangles
     * @param   pointslists array of array of Points
     * @returns a triangle failing the test, or null if success
     */
    function testTrianglesToBeInPoints(triangles, pointslists) {
        var i, tlen = triangles.length, failed = null;
        for (i = 0; i < tlen && !failed; i++) {
            var triangle = triangles[i], found0 = false, found1 = false, found2 = false;
            /* jshint loopfunc:true */
            pointslists.forEach(function(points) {
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
    }

    /**
     * Checks that all the points are in at least one triangle
     * @param   triangles   array of triangles
     * @param   pointslists array of array of Points
     * @returns a point failing the test, or null if success
     */
    function testTrianglesToContainPoints(triangles, pointslists) {
        var failed = null;
        pointslists.forEach(function(points) {
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
    }


    /**
     * Parse points coordinates : pairs of x y, with any separator between coordinates
     * @param {String} data
     * @returns {Array<Point>}  points 
     */
    function parsePoints(data) {
        var points = data.split(/[^-eE\.\d]+/).filter(function(val) {
            return val;
        }).map(parseFloat);
        return makePoints(points);
    }


// -----------------------------------------------------------------------Shapes
    /*
     * Tests
     * =====
     *   TODO we test only part of the "public API" of poly2tri for the time being
     *   (methods used in the "triangulate" tests),
     *   not all the methods or all sub-classes.
     */

    describe("Point", function() {
        it("should have a default constructor", function() {
            expect(p2t.Point).toBeDefined();
            var point = new p2t.Point();
            expect(point).toEqual(jasmine.any(p2t.Point));
            expect(point.x).toBe(0);
            expect(point.y).toBe(0);
        });
        it("should have a constructor", function() {
            var point = new p2t.Point(1, 2);
            expect(point.x).toBe(1);
            expect(point.y).toBe(2);
        });
        it("should have a set() method", function() {
            var point = new p2t.Point(1, 2);
            point.set(3, 4);
            expect(point.x).toBe(3);
            expect(point.y).toBe(4);
        });
        it("should have a clone() method", function() {
            var point1 = new p2t.Point(1, 2), point2 = point1.clone();
            expect(point2.x).toBe(point1.x);
            expect(point2.y).toBe(point1.y);
        });
        it("should have a equals() method", function() {
            var point = new p2t.Point(1, 2);
            expect(point.equals(point)).toBeTruthy();
            expect(point.equals(new p2t.Point(1, 2))).toBeTruthy();
            expect(point.equals(new p2t.Point(1, 3))).toBeFalsy();
        });
        it("should have a equals() static function", function() {
            var point = new p2t.Point(1, 2);
            expect(p2t.Point.equals(point, point)).toBeTruthy();
            expect(p2t.Point.equals(point, new p2t.Point(1, 2))).toBeTruthy();
            expect(p2t.Point.equals(point, {x: 1, y: 2})).toBeTruthy();
            expect(p2t.Point.equals(point, new p2t.Point(1, 3))).toBeFalsy();
        });
        it("should have a toString() method", function() {
            var point = new p2t.Point(1, 2);
            expect(point.toString()).toBe("(1;2)");
        });
        it("should have a toString() static function", function() {
            expect(p2t.Point.toString(new p2t.Point(1, 2))).toBe("(1;2)");
            expect(p2t.Point.toString({x: 3, y: 4})).toBe("(3;4)");
            expect(p2t.Point.toString({z: 7, toString: function() {
                    return "56";
                }
            })).toBe("56");
        });
    });

    describe("Triangle", function() {
        var t, p1, p2, p3;
        beforeEach(function() {
            p1 = new p2t.Point(1, 2);
            p2 = new p2t.Point(3, 4);
            p3 = new p2t.Point(5, 6);
            t = new p2t.Triangle(p1, p2, p3);
        });
        it("should have a getPoint() method", function() {
            expect(t.getPoint(0)).toBe(p1);
            expect(t.getPoint(1)).toBe(p2);
            expect(t.getPoint(2)).toBe(p3);
        });
        it("should have a containsPoint() method", function() {
            expect(t.containsPoint(p1)).toBeTruthy();
            expect(t.containsPoint(p2)).toBeTruthy();
            expect(t.containsPoint(p3)).toBeTruthy();
            expect(t.containsPoint(new p2t.Point(1, 2))).toBeFalsy(); // compares references, not values
            expect(t.containsPoint(new p2t.Point(7, 8))).toBeFalsy();
        });
        it("should have a toString() method", function() {
            expect(t.toString()).toBe("[(1;2)(3;4)(5;6)]");
        });
    });

// -----------------------------------------------------------------SweepContext

    describe("SweepContext", function() {
        it("should have a constructor", function() {
            var contour = [new p2t.Point(1, 2), new p2t.Point(3, 4)];
            var swctx = new p2t.SweepContext(contour);
            expect(swctx).toEqual(jasmine.any(p2t.SweepContext));
        });
        it("should reject null contour in constructor", function() {
            expect(function() {
                void(new p2t.SweepContext(null));
            }).toThrow();
        });
        it("should have getPoint", function() {
            var contour = [new p2t.Point(1, 2), new p2t.Point(3, 4)];
            var swctx = new p2t.SweepContext(contour);
            expect(swctx.getPoint(0).x).toBe(1);
            expect(swctx.getPoint(1).y).toBe(4);
        });
        it("should have addPoint", function() {
            var contour = [new p2t.Point(1, 2), new p2t.Point(3, 4)];
            var swctx = new p2t.SweepContext(contour);
            swctx.addPoint(new p2t.Point(5, 6));
            expect(swctx.getPoint(2).x).toBe(5);
        });
        it("should chain addPoint", function() {
            var contour = [new p2t.Point(1, 2), new p2t.Point(3, 4)];
            var swctx = new p2t.SweepContext(contour);
            expect(swctx.addPoint(new p2t.Point(5, 6))).toBe(swctx);
        });
        it("should have addPoints", function() {
            var contour = [new p2t.Point(1, 2), new p2t.Point(3, 4)];
            var swctx = new p2t.SweepContext(contour);
            swctx.addPoints([new p2t.Point(5, 6), new p2t.Point(7, 8)]);
            expect(swctx.getPoint(3).y).toBe(8);
        });
        it("should chain addPoints", function() {
            var contour = [new p2t.Point(1, 2), new p2t.Point(3, 4)];
            var swctx = new p2t.SweepContext(contour);
            expect(swctx.addPoints([new p2t.Point(5, 6), new p2t.Point(7, 8)])).toBe(swctx);
        });
    });

// ------------------------------------------------------------------Triangulate

    beforeEach(function() {
        // Helper matchers to ease test writing
        this.addMatchers({
            // Checks that a point equals another
            toEqualPoint: function(p2) {
                return p2t.Point.equals(this.actual, p2);
            },
            // Checks that all the triangles vertices are in the list of points
            toBeInPoints: function(pointslists) {
                var triangles = this.actual, failed;
                failed = testTrianglesToBeInPoints(triangles, pointslists);
                // Customize message for easier debugging
                // (because of isNot, message might be printed event if !failed)
                this.message = function() {
                    var str = "Expected Triangle" + (failed ? (" " + failed) : ("s ") + triangles);
                    return str + (this.isNot ? " not" : "") + " to be in points " + pointslists;
                };
                return !failed;
            },
            // Checks that all the points are in at least one triangle
            toContainPoints: function(pointslists) {
                var triangles = this.actual, failed;
                failed = testTrianglesToContainPoints(triangles, pointslists);
                // Customize message for easier debugging
                // (because of isNot, message might be printed event if !failed)
                this.message = function() {
                    var str = "Expected Point" + (failed ? (" " + failed) : ("s ") + pointslists);
                    return str + (this.isNot ? " not" : "") + " to be in triangles " + triangles;
                };
                return !failed;
            }
        });
    });

    describe("Triangulate", function() {
        // Common options for SweepContext
        var options = {cloneArrays: true};

        describe("a triangle", function() {
            // not reset between tests
            var contour, t, swctx;
            contour = makePoints([100, 100, 100, 200, 200, 200]);
            it("should triangulate", function() {
                swctx = new p2t.SweepContext(contour, options);
                swctx.triangulate();
                t = swctx.getTriangles();
                expect(t).toBeTruthy();
            });
            it("should return 1 triangle", function() {
                expect(t.length).toBe(1);
            });
            it("should have a bounding box", function() {
                expect(swctx.getBoundingBox().min).toEqualPoint({x: 100, y: 100});
                expect(swctx.getBoundingBox().max).toEqualPoint({x: 200, y: 200});
            });
            it("should return the same triangle", function() {
                expect(t[0].containsPoint(contour[0])).toBeTruthy();
                expect(t[0].containsPoint(contour[1])).toBeTruthy();
                expect(t[0].containsPoint(contour[2])).toBeTruthy();
            });
            it("should triangulate (backward compatibility)", function() {
                var swctx2 = new p2t.SweepContext(contour, options);
                p2t.sweep.Triangulate(swctx2);
                var t2 = swctx2.getTriangles();
                expect(t2.length).toBe(1);
                expect(t[0].getPoint(0)).toEqualPoint(t2[0].getPoint(0));
                expect(t[0].getPoint(1)).toEqualPoint(t2[0].getPoint(1));
                expect(t[0].getPoint(2)).toEqualPoint(t2[0].getPoint(2));
            });
            it("should triangulate (backward compatibility)", function() {
                var swctx2 = new p2t.SweepContext(contour, options);
                p2t.triangulate(swctx2);
                var t2 = swctx2.getTriangles();
                expect(t2.length).toBe(1);
                expect(t[0].getPoint(0)).toEqualPoint(t2[0].getPoint(0));
                expect(t[0].getPoint(1)).toEqualPoint(t2[0].getPoint(1));
                expect(t[0].getPoint(2)).toEqualPoint(t2[0].getPoint(2));
            });
        });
        describe("a square", function() {
            // not reset between tests
            var contour, t, swctx;
            contour = makePoints([0, 0, 0, 1, 1, 1, 2, 1]); // same as issue #7
            it("should triangulate", function() {
                swctx = new p2t.SweepContext(contour, options);
                swctx.triangulate();
                t = swctx.getTriangles();
                expect(t).toBeTruthy();
            });
            it("should return 2 triangles", function() {
                expect(t.length).toBe(2);
            });
            it("should have a bounding box", function() {
                expect(swctx.getBoundingBox().min).toEqualPoint({x: 0, y: 0});
                expect(swctx.getBoundingBox().max).toEqualPoint({x: 2, y: 1});
            });
            it("should be in the contour", function() {
                expect(t).toBeInPoints([contour]);
            });
            it("should contain the contour", function() {
                expect(t).toContainPoints([contour]);
            });
        });
        describe("a rectangle", function() {
            // not reset between tests
            var contour, t;
            contour = makePoints([100, 100, 100, 300, 300, 300, 300, 100]);
            it("should triangulate", function() {
                var swctx = new p2t.SweepContext(contour, options);
                swctx.triangulate();
                t = swctx.getTriangles();
                expect(t).toBeTruthy();
            });
            it("should return 2 triangles", function() {
                expect(t.length).toBe(2);
            });
            it("should be in the contour", function() {
                expect(t).toBeInPoints([contour]);
            });
            it("should contain the contour", function() {
                expect(t).toContainPoints([contour]);
            });
        });
        describe("a rectangle containing 1 Steiner point", function() {
            // not reset between tests
            var contour, points, t;
            contour = makePoints([100, 100, 100, 300, 300, 300, 300, 100]);
            points = makePoints([150, 150]);
            it("should triangulate", function() {
                var swctx = new p2t.SweepContext(contour, options);
                swctx.addPoint(points[0]);
                swctx.triangulate();
                t = swctx.getTriangles();
                expect(t).toBeTruthy();
            });
            it("should return 4 triangles", function() {
                expect(t.length).toBe(4);
            });
            it("should be in the contour and point", function() {
                expect(t).toBeInPoints([contour, points]);
            });
            it("should contain the contour and point", function() {
                expect(t).toContainPoints([contour, points]);
            });
        });
        describe("a rectangle not cloned", function() {
            // not reset between tests
            var contour, copy, points, t;
            contour = makePoints([100, 100, 100, 300, 300, 300, 300, 100]);
            copy = contour.slice(0);
            points = makePoints([150, 150]);
            it("should triangulate", function() {
                var swctx = new p2t.SweepContext(contour, {});
                swctx.addPoint(points[0]);
                swctx.triangulate();
                t = swctx.getTriangles();
                expect(t).toBeTruthy();
            });
            it("should have modified the original contour", function() {
                expect(contour.length).toBeGreaterThan(copy.length);
            });
        });
        describe("an octogon", function() {
            // not reset between tests
            var contour, t, swctx;
            contour = makePoints([200, 100, 300, 100, 400, 200, 400, 300, 300, 400, 200, 400, 100, 300, 100, 200]);
            it("should triangulate", function() {
                swctx = new p2t.SweepContext(contour, options);
                swctx.triangulate();
                t = swctx.getTriangles();
                expect(t).toBeTruthy();
            });
            it("should return 6 triangles", function() {
                expect(t.length).toBe(6);
            });
            it("should have a bounding box", function() {
                expect(swctx.getBoundingBox().min).toEqualPoint({x: 100, y: 100});
                expect(swctx.getBoundingBox().max).toEqualPoint({x: 400, y: 400});
            });
            it("should be in the contour", function() {
                expect(t).toBeInPoints([contour]);
            });
            it("should contain the contour", function() {
                expect(t).toContainPoints([contour]);
            });
        });
        describe("an octogon containing 1 rectangle hole", function() {
            // not reset between tests
            var contour, hole, t;
            contour = makePoints([200, 100, 300, 100, 400, 200, 400, 300, 300, 400, 200, 400, 100, 300, 100, 200]);
            hole = makePoints([250, 250, 280, 250, 280, 280, 250, 280]);
            it("should triangulate", function() {
                var swctx = new p2t.SweepContext(contour, options);
                swctx.addHole(hole);
                swctx.triangulate();
                t = swctx.getTriangles();
                expect(t).toBeTruthy();
            });
            it("should return 12 triangles", function() {
                expect(t.length).toBe(12);
            });
            it("should be in the contour and hole", function() {
                expect(t).toBeInPoints([contour, hole]);
            });
            it("should contain the contour and hole", function() {
                expect(t).toContainPoints([contour, hole]);
            });
        });
        describe("a polygon containing 1 hole", function() {
            // not reset between tests
            var contour, hole, t, swctx;
            // same as issue #44
            contour = makePoints([71, 161, 100, 66, 280, 97, 282, 223, 201, 238, 75, 243]);
            hole = makePoints([101, 102, 103, 204, 205, 206, 207, 108]);
            it("should triangulate", function() {
                swctx = new p2t.SweepContext(contour, options);
                swctx.addHole(hole);
                swctx.triangulate();
                t = swctx.getTriangles();
                expect(t).toBeTruthy();
            });
            it("should return 10 triangles", function() {
                expect(t.length).toBe(10);
            });
            it("should have a bounding box", function() {
                expect(swctx.getBoundingBox().min).toEqualPoint({x: 71, y: 66});
                expect(swctx.getBoundingBox().max).toEqualPoint({x: 282, y: 243});
            });
            it("should be in the contour and hole", function() {
                expect(t).toBeInPoints([contour, hole]);
            });
            it("should contain the contour and hole", function() {
                expect(t).toContainPoints([contour, hole]);
            });
        });
        describe("a polygon containing 1 hole and 2 Steiner points", function() {
            // not reset between tests
            var contour, hole, points, t;
            contour = makePoints([256, 288, 339, 123, 174, 41, 8, 222]);
            hole = makePoints([107, 233, 88, 221, 124, 233]);
            points = makePoints([200, 200, 150, 150]);
            describe("separate methods", function() {
                it("should triangulate", function() {
                    var swctx = new p2t.SweepContext(contour, options);
                    swctx.addHole(hole);
                    swctx.addPoints(points);
                    swctx.triangulate();
                    t = swctx.getTriangles();
                    expect(t).toBeTruthy();
                });
                it("should return 11 triangles", function() {
                    expect(t.length).toBe(11);
                });
                it("should be in the contour and hole and points", function() {
                    expect(t).toBeInPoints([contour, hole, points]);
                });
                it("should contain the contour and hole and points", function() {
                    expect(t).toContainPoints([contour, hole, points]);
                });
            });
            describe("chained methods", function() {
                it("should triangulate", function() {
                    var swctx = new p2t.SweepContext(contour, options);
                    t = swctx.addHole(hole).addPoints(points).triangulate().getTriangles();
                    expect(t).toBeTruthy();
                });
                it("should return 11 triangles", function() {
                    expect(t.length).toBe(11);
                });
                it("should be in the contour and hole and points", function() {
                    expect(t).toBeInPoints([contour, hole, points]);
                });
                it("should contain the contour and hole and points", function() {
                    expect(t).toContainPoints([contour, hole, points]);
                });
            });
        });
        describe("a polygon with 2 holes and points using custom Point class", function() {
            // not reset between tests
            var contour, hole1, hole2, points, t;
            // same as issue #39
            function makeCustomPoints(a) {
                var i, len = a.length, points = [];
                for (i = 0; i < len; i += 2) {
                    points.push({x: a[i], y: a[i + 1]});
                }
                return points;
            }
            contour = makeCustomPoints([-311, 774, -216, 418, -48, 343, 23, 318, 44, 284, 59, 262, 84, 242, 92, 161, 131, 134, 140, 77, 134, 30, 118, 6, 115, -32, 67, -85, 213, -85, 211, -53, 198, -13, 182, 63, 165, 120, 194, 137, 238, 111, 265, 5, 243, -87, 502, -93, 446, 772]);
            hole1 = makeCustomPoints([-276, 747, 421, 745, 473, -65, 276, -61, 291, 2, 291, 8, 262, 123, 256, 131, 201, 163, 186, 163, 155, 145, 150, 152, 118, 175, 110, 250, 105, 259, 78, 281, 66, 299, 43, 335, 36, 341, -37, 367, -37, 368, -193, 438]);
            // mix classes
            hole2 = makePoints([161, 32, 172, -19, 171, -20, 184, -58, 127, -58, 138, -46, 141, -38, 144, -2, 157, 17, 160, 23]);
            points = makeCustomPoints([148, 127, 161, 70, 157, 82, 152, 98, 160, 35, 115, -58, 160, 65, 149, 117, -205, 428, -44, 356, 29, 330, 32, 326, 55, 292, 69, 271, 94, 251, 96, 245, 104, 169, 141, 143, 143, 138, 153, 78, 153, 75, 146, 26, 131, 2, 127, -35, 126, -39, 97, -72, 199, -72, 198, -57, 184, -16, 169, 59, 150, 120, 153, 129, 190, 150, 197, 150, 247, 121, 250, 116, 278, 6, 278, 3, 260, -74, 488, -80, 434, 759, -294, 761]);
            it("should triangulate", function() {
                var swctx = new p2t.SweepContext(contour, options);
                swctx.addHole(hole1);
                swctx.addHole(hole2);
                swctx.addPoints(points);
                swctx.triangulate();
                t = swctx.getTriangles();
                expect(t).toBeTruthy();
            });
            it("should return 143 triangles", function() {
                expect(t.length).toBe(143);
            });
            it("should be in the contour and holes and points", function() {
                expect(t).toBeInPoints([contour, hole1, hole2, points]);
            });
            it("should contain the contour and holes and points", function() {
                expect(t).toContainPoints([contour, hole1, hole2, points]);
            });
        });
        describe("a quadrilateral containing 1000 Steiner points", function() {
            // not reset between tests
            var contour, points, t, max = 1000;
            var i;
            // pseudo-random generator with known seed, so that test is repeatable
            var m = new MersenneTwister(12899);
            contour = makePoints([-1, -1, 1.5, -1, 2, 2, -1, 2]);
            points = [];
            for (i = 0; i < max * 2; i++) {
                points.push(m.rnd());
            }
            points = makePoints(points);
            it("should triangulate", function() {
                var swctx = new p2t.SweepContext(contour, options);
                swctx.addPoints(points);
                swctx.triangulate();
                t = swctx.getTriangles();
                expect(t).toBeTruthy();
            });
            it("should return 2002 triangles", function() {
                expect(t.length).toBe(2002);
            });
            it("should be in the contour and points", function() {
                expect(t).toBeInPoints([contour, points]);
            });
            it("should contain the contour and points", function() {
                expect(t).toContainPoints([contour, points]);
            });
        });
        describe("a polygon with 1000 vertices", function() {
            // not reset between tests
            var contour, t, max = 1000;
            // pseudo-random generator with known seed, so that test is repeatable
            var m = new MersenneTwister(3756);
            contour = randomPolygon(function() {
                return m.rnd();
            }, max);
            contour = makePoints(contour);
            it("should triangulate", function() {
                var swctx = new p2t.SweepContext(contour, options);
                swctx.triangulate();
                t = swctx.getTriangles();
                expect(t).toBeTruthy();
            });
            it("should return 998 triangles", function() {
                expect(t.length).toBe(998);
            });
            it("should be in the contour", function() {
                expect(t).toBeInPoints([contour]);
            });
            it("should contain the contour", function() {
                expect(t).toContainPoints([contour]);
            });
        });
        describe("a polygon containing extra information in points", function() {
            // not reset between tests
            var contour, t, max = 100;
            // pseudo-random generator with known seed, so that test is repeatable
            var m = new MersenneTwister(235336);
            contour = randomPolygon(function() {
                return m.rnd();
            }, max);
            contour = makePoints(contour);
            contour.forEach(function(point, index) {
                point.myfield = "f" + index;
            });
            it("should triangulate", function() {
                var swctx = new p2t.SweepContext(contour, options);
                swctx.triangulate();
                t = swctx.getTriangles();
                expect(t).toBeTruthy();
            });
            it("should keep extra information", function() {
                t.forEach(function(triangle) {
                    expect(triangle.getPoint(0).myfield).toMatch(/f\d+/);
                    expect(triangle.getPoint(1).myfield).toMatch(/f\d+/);
                    expect(triangle.getPoint(2).myfield).toMatch(/f\d+/);
                });
            });
        });
        describe("a polygon with duplicate points", function() {
            // not reset between tests
            var contour = makePoints([100, 100, 100, 300, 300, 300, 300, 100, 100, 100]);
            it("should throw", function() {
                expect(function() {
                    var swctx = new p2t.SweepContext(contour, options);
                    swctx.triangulate();
                }).toThrow("poly2tri Invalid Edge constructor: repeated points! (100;100)");
            });
            it("should provide faulty points in exception", function() {
                var exception;
                try {
                    var swctx = new p2t.SweepContext(contour, options);
                    swctx.triangulate();
                } catch (e) {
                    exception = e;
                }
                expect(exception.points.length).toBe(1);
                expect(exception.points[0]).toEqualPoint({x: 100, y: 100});
            });
        });
        describe("a flat polygon", function() {
            // not reset between tests
            var contour = makePoints([100, 100, 200, 100, 300, 100]);
            it("should throw", function() {
                expect(function() {
                    var swctx = new p2t.SweepContext(contour, options);
                    swctx.triangulate();
                }).toThrow("poly2tri EdgeEvent: Collinear not supported! (300;100) (200;100) (100;100)");
            });
            it("should provide faulty points in exception", function() {
                var exception;
                try {
                    var swctx = new p2t.SweepContext(contour, options);
                    swctx.triangulate();
                } catch (e) {
                    exception = e;
                }
                expect(exception.points.length).toBe(3);
                expect(exception.points[0].y).toBe(100);
                expect(exception.points[1].y).toBe(100);
                expect(exception.points[2].y).toBe(100);
            });
        });
    });

// -------------------------------------------------------------------data files
    /*
     * Automated tests based on external data files.
     * These are loaded with Ajax. This might fails for local files (file://)
     * because of Access-Control-Allow-Origin, depending on browser. 
     * If it happens, please run the tests through a local web server.
     */
    describe("Data files", function() {
        // Common options for SweepContext
        var options = {cloneArrays: true};

        var index = readFileSync("index.json", "json");
        it("index should load (if fails for local files Access-Control-Allow-Origin => use web server)", function() {
            expect(index).toEqual(jasmine.any(Array));
            expect(index.length).toBeGreaterThan(0);
        });
        index.forEach(function(group) {
            describe('' + group.title, function() {
                group.files.filter(function(file) {
                    return file.name;
                }).forEach(function(file) {
                    describe('"' + file.name + '"', function() {
                        // not reset between tests : loaded once only
                        var contour, holes = [], points = [], t, swctx;
                        it("should load and parse contour", function() {
                            var data = readFileSync(file.name);
                            contour = parsePoints(data);
                            expect(contour.length).toBeGreaterThan(1);
                        });
                        if (file.holes) {
                            it("should load and parse holes " + file.holes, function() {
                                var data = readFileSync(file.holes);
                                // at least one blank line between each hole
                                data.split(/\n\s*\n/).forEach(function(val) {
                                    var hole = parsePoints(val);
                                    if (hole.length > 0) {
                                        holes.push(hole);
                                    }
                                });
                                expect(holes.length).toBeGreaterThan(0);
                            });
                        }
                        if (file.steiner) {
                            it("should load and parse Steiner points " + file.steiner, function() {
                                var data = readFileSync(file.steiner);
                                points = parsePoints(data);
                                expect(points.length).toBeGreaterThan(0);
                            });
                        }
                        if (file.throws) {
                            it("should fail to triangulate", function() {
                                expect(function() {
                                    swctx = new p2t.SweepContext(contour, options);
                                    holes.forEach(function(hole) {
                                        swctx.addHole(hole);
                                    });
                                    swctx.addPoints(points).triangulate();
                                }).toThrow();
                            });
                        } else {
                            it("should triangulate", function() {
                                swctx = new p2t.SweepContext(contour, options);
                                holes.forEach(function(hole) {
                                    swctx.addHole(hole);
                                });
                                swctx.addPoints(points).triangulate();
                                t = swctx.getTriangles();
                                expect(t).toBeTruthy();
                            });
                            if (file.triangles) {
                                it("should return " + file.triangles + " triangles", function() {
                                    expect(t.length).toBe(file.triangles);
                                });
                            } else {
                                it("should return enough triangles", function() {
                                    expect(t.length).toBeGreaterThan(contour.length / 3);
                                });
                            }
                            it("should have a bounding box", function() {
                                expect(swctx.getBoundingBox().min).toEqual(jasmine.any(p2t.Point));
                                expect(swctx.getBoundingBox().max).toEqual(jasmine.any(p2t.Point));
                            });
                            it("should be in the constraints", function() {
                                expect(t).toBeInPoints([contour, points].concat(holes));
                            });
                            it("should contain the constraints", function() {
                                expect(t).toContainPoints([contour, points].concat(holes));
                            });
                        }
                    });
                }, this);
            });
        }, this);
    });
});
