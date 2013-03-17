/*
 * Poly2Tri Copyright (c) 2009-2010, Poly2Tri Contributors
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

describe("js.poly2tri", function() {

    "use strict";

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


    it("should have js.poly2tri namespace", function() {
        expect(js.poly2tri).toBeDefined();
    });

    var P = js.poly2tri; // shortcut

    // Replace default alert() handler by an exception thrower
    js.poly2tri.fatal = function(message) {
        throw new Error(message);
    };


    /*
     * TODO we test only part of the "public API" of js.poly2tri for the time being
     * (methods used in the sweep.Triangulate tests),
     * not all the methods or all sub-classes.
     */

    describe("Point", function() {
        it("should have a default constructor", function() {
            var point = new P.Point();
            expect(point).toEqual(jasmine.any(P.Point));
        });
        it("should have a constructor", function() {
            var point = new P.Point(1, 2);
            expect(point.x).toBe(1);
            expect(point.y).toBe(2);
        });
        it("should have a set() method", function() {
            var point = new P.Point(1, 2);
            point.set(3, 4);
            expect(point.x).toBe(3);
            expect(point.y).toBe(4);
        });
        it("should have a equals() method", function() {
            var point = new P.Point(1, 2);
            expect(point.equals(point)).toBeTruthy();
            expect(point.equals(new P.Point(1, 2))).toBeTruthy();
            expect(point.equals(new P.Point(1, 3))).toBeFalsy();
        });
        it("should have a toString() method", function() {
            var point = new P.Point(1, 2);
            expect(point.toString()).toBe("(1;2)");
        });
    });

    describe("Triangle", function() {
        var t, p1, p2, p3;
        beforeEach(function() {
            p1 = new P.Point(1, 2);
            p2 = new P.Point(3, 4);
            p3 = new P.Point(5, 6);
            t = new P.Triangle(p1, p2, p3);
        });
        it("should have a GetPoint() method", function() {
            expect(t.GetPoint(0)).toBe(p1);
            expect(t.GetPoint(1)).toBe(p2);
            expect(t.GetPoint(2)).toBe(p3);
        });
        it("should have a ContainsP() method", function() {
            expect(t.ContainsP(p1)).toBeTruthy();
            expect(t.ContainsP(p2)).toBeTruthy();
            expect(t.ContainsP(p3)).toBeTruthy();
            expect(t.ContainsP(new P.Point(1, 2))).toBeTruthy();
            expect(t.ContainsP(new P.Point(7, 8))).toBeFalsy();
        });
        it("should have an Index() method", function() {
            expect(t.Index(p1)).toBe(0);
            expect(t.Index(p2)).toBe(1);
            expect(t.Index(p3)).toBe(2);
            expect(t.Index(new P.Point(1, 2))).toBe(0);
            expect(t.Index(new P.Point(7, 8))).toBe(-1);
        });
        it("should have a toString() method", function() {
            expect(t.toString()).toBe("[(1;2)(3;4)(5;6)]");
        });
    });

    describe("SweepContext", function() {
        it("should have a constructor", function() {
            var contour = [new P.Point(1, 2), new P.Point(3, 4)];
            var swctx = new P.SweepContext(contour);
            expect(swctx).toEqual(jasmine.any(P.SweepContext));
        });
        it("should reject null contour in constructor", function() {
            expect(function() {
                var swctx = new P.SweepContext(null);
            }).toThrow();
        });
        it("should have GetPoint", function() {
            var contour = [new P.Point(1, 2), new P.Point(3, 4)];
            var swctx = new P.SweepContext(contour);
            expect(swctx.GetPoint(0).x).toBe(1);
            expect(swctx.GetPoint(1).y).toBe(4);
        });
        it("should have AddPoint", function() {
            var contour = [new P.Point(1, 2), new P.Point(3, 4)];
            var swctx = new P.SweepContext(contour);
            swctx.AddPoint(new P.Point(5, 6));
            expect(swctx.GetPoint(2).x).toBe(5);
        });
    });

    describe("sweep.Triangulate", function() {
        // array copy (to keep unmodified versions of the arguments to SweepContext
        function clone(a) {
            return a.slice(0);
        }

        // Creates list of Point from list of coordinates [ x1, y1, x2, y2 ...]
        function makePoints(a) {
            var i, points = [];
            for (i = 0; i < a.length; i += 2) {
                points.push(new P.Point(a[i], a[i + 1]));
            }
            return points;
        }

        // Helper matchers to ease test writing
        beforeEach(function() {
            this.addMatchers({
                // Checks that all the triangles vertices are in the list of points
                toBeInPoints: function() {
                    var triangles = this.actual, pointslists = Array.prototype.slice.call(arguments), failed = null;
                    triangles.forEach(function(triangle) {
                        var found0 = false, found1 = false, found2 = false;
                        pointslists.forEach(function(points) {
                            var i;
                            for (i= 0; i < points.length && !(found0 && found1 && found2); i++) {
                                var point = points[i];
                                found0 = found0 || triangle.GetPoint(0).equals(point);
                                found1 = found1 || triangle.GetPoint(1).equals(point);
                                found2 = found2 || triangle.GetPoint(2).equals(point);
                            }
                        });
                        if (!(found0 && found1 && found2)) { 
                            failed = triangle;
                        }
                    });
                    // Customize message for easier debugging
                    // (because of isNot, message might be printed event if !failed)
                    this.message = function() {
                        var str = "Expected Triangle" + (failed ? (" " + failed) : ("s ") + triangles);
                        return str + (this.isNot ? " not" : "") + " to be in points " + pointslists;
                    };
                    return !failed;
                },
                // Checks that all the points are in at least one triangle
                toContainPoints: function() {
                    var triangles = this.actual, pointslists = Array.prototype.slice.call(arguments), failed = null;
                    pointslists.forEach(function(points) {
                        points.forEach(function(point) {
                            var found = false, i;
                            for (i = 0; i < triangles.length && !found; i++) {
                                found = found || triangles[i].ContainsP(point);
                            }
                            if (!found) {
                                failed = point;
                            }
                        });
                    });
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

        describe("a triangle", function() {
            // not reset between tests
            var contour, t;
            contour = makePoints([100, 100, 100, 200, 200, 200]);
            it("should triangulate", function() {
                var swctx = new P.SweepContext(clone(contour));
                P.sweep.Triangulate(swctx);
                t = swctx.GetTriangles();
                expect(t).toBeTruthy();
            });
            it("should return 1 triangle", function() {
                expect(t.length).toBe(1);
            });
            it("should return the same triangle", function() {
                expect(t[0].ContainsP(contour[0])).toBeTruthy();
                expect(t[0].ContainsP(contour[1])).toBeTruthy();
                expect(t[0].ContainsP(contour[2])).toBeTruthy();
            });
        });
        describe("a square", function() {
            // not reset between tests
            var contour, t;
            contour = makePoints([0, 0, 0, 1, 1, 1, 2, 1]); // same as issue #7
            it("should triangulate", function() {
                var swctx = new P.SweepContext(clone(contour));
                P.sweep.Triangulate(swctx);
                t = swctx.GetTriangles();
                expect(t).toBeTruthy();
            });
            it("should return 2 triangles", function() {
                expect(t.length).toBe(2);
            });
            it("should be in the contour", function() {
                expect(t).toBeInPoints(contour);
            });
            it("should contain the contour", function() {
                expect(t).toContainPoints(contour);
            });
        });
        describe("a rectangle", function() {
            // not reset between tests
            var contour, t;
            contour = makePoints([100, 100, 100, 300, 300, 300, 300, 100]);
            it("should triangulate", function() {
                var swctx = new P.SweepContext(clone(contour));
                P.sweep.Triangulate(swctx);
                t = swctx.GetTriangles();
                expect(t).toBeTruthy();
            });
            it("should return 2 triangles", function() {
                expect(t.length).toBe(2);
            });
            it("should be in the contour", function() {
                expect(t).toBeInPoints(contour);
            });
            it("should contain the contour", function() {
                expect(t).toContainPoints(contour);
            });
        });
        describe("a rectangle containing 1 Steiner point", function() {
            // not reset between tests
            var contour, points, t;
            contour = makePoints([100, 100, 100, 300, 300, 300, 300, 100]);
            points = makePoints([150, 150]);
            it("should triangulate", function() {
                var swctx = new P.SweepContext(clone(contour));
                swctx.AddPoint(points[0]);
                P.sweep.Triangulate(swctx);
                t = swctx.GetTriangles();
                expect(t).toBeTruthy();
            });
            it("should return 4 triangles", function() {
                expect(t.length).toBe(4);
            });
            it("should be in the contour and point", function() {
                expect(t).toBeInPoints(contour, points);
            });
            it("should contain the contour and point", function() {
                expect(t).toContainPoints(contour, points);
            });
        });
        describe("an octogon", function() {
            // not reset between tests
            var contour, t;
            contour = makePoints([200, 100, 300, 100, 400, 200, 400, 300, 300, 400, 200, 400, 100, 300, 100, 200]);
            it("should triangulate", function() {
                var swctx = new P.SweepContext(clone(contour));
                P.sweep.Triangulate(swctx);
                t = swctx.GetTriangles();
                expect(t).toBeTruthy();
            });
            it("should return 6 triangles", function() {
                expect(t.length).toBe(6);
            });
            it("should be in the contour", function() {
                expect(t).toBeInPoints(contour);
            });
            it("should contain the contour", function() {
                expect(t).toContainPoints(contour);
            });
        });
        describe("an octogon containing 1 rectangle hole", function() {
            // not reset between tests
            var contour, hole, t;
            contour = makePoints([200, 100, 300, 100, 400, 200, 400, 300, 300, 400, 200, 400, 100, 300, 100, 200]);
            hole = makePoints([250, 250, 280, 250, 280, 280, 250, 280]);
            it("should triangulate", function() {
                var swctx = new P.SweepContext(clone(contour));
                swctx.AddHole(clone(hole));
                P.sweep.Triangulate(swctx);
                t = swctx.GetTriangles();
                expect(t).toBeTruthy();
            });
            it("should return 12 triangles", function() {
                expect(t.length).toBe(12);
            });
            it("should be in the contour and hole", function() {
                expect(t).toBeInPoints(contour, hole);
            });
            it("should contain the contour and hole", function() {
                expect(t).toContainPoints(contour, hole);
            });
        });
        describe("a polygon containing 1 hole", function() {
            // not reset between tests
            var contour, hole, t;
            // same as issue #44
            contour = makePoints([71, 161, 100, 66, 280, 97, 282, 223, 201, 238, 75, 243]);
            hole = makePoints([101, 102, 103, 204, 205, 206, 207, 108]);
            it("should triangulate", function() {
                var swctx = new P.SweepContext(clone(contour));
                swctx.AddHole(clone(hole));
                P.sweep.Triangulate(swctx);
                t = swctx.GetTriangles();
                expect(t).toBeTruthy();
            });
            it("should return 10 triangles", function() {
                expect(t.length).toBe(10);
            });
            it("should be in the contour and hole", function() {
                expect(t).toBeInPoints(contour, hole);
            });
            it("should contain the contour and hole", function() {
                expect(t).toContainPoints(contour, hole);
            });
        });
        describe("a polygon containing 1 hole", function() {
            // not reset between tests
            var contour, hole, t;
            // same as issue #53
            contour = makePoints([256, 288, 339, 123, 174, 41, 8, 222]);
            hole = makePoints([116, 233, 107, 233, 99, 233, 95, 233, 88, 221, 124, 233]);
            it("should triangulate", function() {
                var swctx = new P.SweepContext(clone(contour));
                swctx.AddHole(clone(hole));
                P.sweep.Triangulate(swctx);
                t = swctx.GetTriangles();
                expect(t).toBeTruthy();
            });
            it("should return 10 triangles", function() {
                expect(t.length).toBe(10);
            });
            it("should be in the contour and hole", function() {
                expect(t).toBeInPoints(contour, hole);
            });
            it("should contain the contour and hole", function() {
                expect(t).toContainPoints(contour, hole);
            });
        });
        describe("a complex polygon", function() {
            // not reset between tests
            var contour, hole1, hole2, t;
            // same as default polygon in index.html
            contour = makePoints([280.35714, 648.79075, 286.78571, 662.8979, 263.28607, 661.17871, 262.31092, 671.41548, 250.53571, 677.00504, 250.53571, 683.43361, 256.42857, 685.21933, 297.14286, 669.50504, 289.28571, 649.50504, 285, 631.6479, 285, 608.79075, 292.85714, 585.21932, 306.42857, 563.79075, 323.57143, 548.79075, 339.28571, 545.21932, 357.85714, 547.36218, 375, 550.21932, 391.42857, 568.07647, 404.28571, 588.79075, 413.57143, 612.36218, 417.14286, 628.07647, 438.57143, 619.1479, 438.03572, 618.96932, 437.5, 609.50504, 426.96429, 609.86218, 424.64286, 615.57647, 419.82143, 615.04075, 420.35714, 605.04075, 428.39286, 598.43361, 437.85714, 599.68361, 443.57143, 613.79075, 450.71429, 610.21933, 431.42857, 575.21932, 405.71429, 550.21932, 372.85714, 534.50504, 349.28571, 531.6479, 346.42857, 521.6479, 346.42857, 511.6479, 350.71429, 496.6479, 367.85714, 476.6479, 377.14286, 460.93361, 385.71429, 445.21932, 388.57143, 404.50504, 360, 352.36218, 337.14286, 325.93361, 330.71429, 334.50504, 347.14286, 354.50504, 337.85714, 370.21932, 333.57143, 359.50504, 319.28571, 353.07647, 312.85714, 366.6479, 350.71429, 387.36218, 368.57143, 408.07647, 375.71429, 431.6479, 372.14286, 454.50504, 366.42857, 462.36218, 352.85714, 462.36218, 336.42857, 456.6479, 332.85714, 438.79075, 338.57143, 423.79075, 338.57143, 411.6479, 327.85714, 405.93361, 320.71429, 407.36218, 315.71429, 423.07647, 314.28571, 440.21932, 325, 447.71932, 324.82143, 460.93361, 317.85714, 470.57647, 304.28571, 483.79075, 287.14286, 491.29075, 263.03571, 498.61218, 251.60714, 503.07647, 251.25, 533.61218, 260.71429, 533.61218, 272.85714, 528.43361, 286.07143, 518.61218, 297.32143, 508.25504, 297.85714, 507.36218, 298.39286, 506.46932, 307.14286, 496.6479, 312.67857, 491.6479, 317.32143, 503.07647, 322.5, 514.1479, 325.53571, 521.11218, 327.14286, 525.75504, 326.96429, 535.04075, 311.78571, 540.04075, 291.07143, 552.71932, 274.82143, 568.43361, 259.10714, 592.8979, 254.28571, 604.50504, 251.07143, 621.11218, 250.53571, 649.1479, 268.1955, 654.36208]);
            hole1 = makePoints([325, 437, 320, 423, 329, 413, 332, 423]);
            hole2 = makePoints([320.72342, 480, 338.90617, 465.96863, 347.99754, 480.61584, 329.8148, 510.41534, 339.91632, 480.11077, 334.86556, 478.09046]);
            it("should triangulate", function() {
                var swctx = new P.SweepContext(clone(contour));
                swctx.AddHole(clone(hole1));
                swctx.AddHole(clone(hole2));
                P.sweep.Triangulate(swctx);
                t = swctx.GetTriangles();
                expect(t).toBeTruthy();
            });
            it("should return 106 triangles", function() {
                expect(t.length).toBe(106);
            });
            it("should be in the contour and holes", function() {
                expect(t).toBeInPoints(contour, hole1, hole2);
            });
            it("should contain the contour and holes", function() {
                expect(t).toContainPoints(contour, hole1, hole2);
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
                points.push(m.random());
            }
            points = makePoints(points);
            it("should triangulate", function() {
                var swctx = new P.SweepContext(clone(contour));
                points.forEach(function(point) {
                    swctx.AddPoint(point);
                });
                P.sweep.Triangulate(swctx);
                t = swctx.GetTriangles();
                expect(t).toBeTruthy();
            });
            it("should return 2002 triangles", function() {
                expect(t.length).toBe(2002);
            });
            it("should be in the contour and points", function() {
                expect(t).toBeInPoints(contour, points);
            });
            it("should contain the contour and points", function() {
                expect(t).toContainPoints(contour, points);
            });
        });
        describe("a polygon with 1000 vertices", function() {
            // not reset between tests
            var contour, t, max = 1000;
            // pseudo-random generator with known seed, so that test is repeatable
            var m = new MersenneTwister(3756);
            contour = randomPolygon(function() {
                return m.random();
            }, max);
            contour = makePoints(contour);
            it("should triangulate", function() {
                var swctx = new P.SweepContext(clone(contour));
                P.sweep.Triangulate(swctx);
                t = swctx.GetTriangles();
                expect(t).toBeTruthy();
            });
            it("should return 998 triangles", function() {
                expect(t.length).toBe(998);
            });
            it("should be in the contour", function() {
                expect(t).toBeInPoints(contour);
            });
            it("should contain the contour", function() {
                expect(t).toContainPoints(contour);
            });
        });
        describe("a polygon containing extra information in points", function() {
            // not reset between tests
            var contour, t, max = 100;
            // pseudo-random generator with known seed, so that test is repeatable
            var m = new MersenneTwister(235336);
            contour = randomPolygon(function() {
                return m.random();
            }, max);
            contour = makePoints(contour);
            contour.forEach(function(point, index) {
                point.myfield = "f" + index;
            });
            it("should triangulate", function() {
                var swctx = new P.SweepContext(clone(contour));
                P.sweep.Triangulate(swctx);
                t = swctx.GetTriangles();
                expect(t).toBeTruthy();
            });
            it("should keep extra information", function() {
                t.forEach(function(triangle) {
                    expect(triangle.GetPoint(0).myfield).toMatch(/f\d+/);
                    expect(triangle.GetPoint(1).myfield).toMatch(/f\d+/);
                    expect(triangle.GetPoint(2).myfield).toMatch(/f\d+/);
                });
            });
        });
        describe("a polygon with duplicate points", function() {
            // not reset between tests
            var contour = makePoints([100, 100, 100, 300, 300, 300, 300, 100, 100, 100]);
            it("should throw", function() {
                expect(function() {
                    var swctx = new P.SweepContext(clone(contour));
                    P.sweep.Triangulate(swctx);
                }).toThrow("Invalid js.poly2tri.edge constructor call: repeated points! (100;100)");
            });
        });
        describe("a flat polygon", function() {
            // not reset between tests
            var contour = makePoints([100, 100, 200, 100, 300, 100]);
            it("should throw", function() {
                expect(function() {
                    var swctx = new P.SweepContext(clone(contour));
                    P.sweep.Triangulate(swctx);
                }).toThrow("js.poly2tri.sweep.EdgeEvent: Collinear not supported! (300;100)(200;100)(100;100)");
            });
        });
        describe("a polygon with crossing paths", function() {
            // not reset between tests
            var contour, t;
            // same as polygon in "data/custom.dat"
            var contour = makePoints([0, 130, -270, 0, 130, -40, 10, -60, -10, -20, 100, 30, 40, -40]);
            it("should triangulate", function() {
                var swctx = new P.SweepContext(clone(contour));
                P.sweep.Triangulate(swctx);
                t = swctx.GetTriangles();
                expect(t).toBeTruthy();
            });
            // One of the 2 tests below will fail.
            // In this particular case, it is the second one.
            xit("should be in the contour", function() {
                expect(t).toBeInPoints(contour);
            });
            it("should fail to contain the contour", function() {
                expect(t).not.toContainPoints(contour);
            });
        });
        describe("data files", function() {
            var files = [
                "2.dat",
                "bird.dat",
                //"custom.dat", // invalid: polygon with crossing paths 
                "debug.dat",
                "diamond.dat",
                "dude.dat",
                "funny.dat",
                "kzer-za.dat",
                "nazca_heron.dat",
                "nazca_monkey.dat",
                //"sketchup.dat", // invalid: lot of repeated points 
                "star.dat",
                "strange.dat",
                "tank.dat",
                "test.dat",
                "debug2.dat" // 10000 points, done last
            ];
            files.forEach(function(filename) {
                describe('"' + filename + '"', function() {
                    // not reset between tests : loaded once only
                    var data, contour, t;
                    it("should load (if fails for local files Access-Control-Allow-Origin => use web server)", function() {
                        var success = jasmine.createSpy('success');
                        $.ajax({
                            async: false, // synchronous to simplify and avoid using waitsFor/runs below
                            url: "data/" + filename,
                            success: success
                        });
                        expect(success).toHaveBeenCalled();
                        data = success.mostRecentCall.args[0];
                        expect(data).toBeTruthy();
                    });
                    it("should parse", function() {
                        contour = data.split(/[^-eE\.\d]+/).filter(function(val) {
                            return val;
                        }).map(parseFloat);
                        expect(contour).toBeTruthy();
                        expect(contour.length).toBeGreaterThan(1);
                        contour = makePoints(contour);
                    });
                    it("should triangulate", function() {
                        var swctx = new P.SweepContext(clone(contour));
                        P.sweep.Triangulate(swctx);
                        t = swctx.GetTriangles();
                        expect(t).toBeTruthy();
                    });
                    it("should return enough triangles", function() {
                        expect(t.length).toBeGreaterThan(contour.length / 3);
                    });
                    it("should be in the contour", function() {
                        expect(t).toBeInPoints(contour);
                    });
                    it("should contain the contour", function() {
                        expect(t).toContainPoints(contour);
                    });
                });
            }, this);
        });
    });
});
