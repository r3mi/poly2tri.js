/*
 * Poly2Tri Copyright (c) 2009-2014, Poly2Tri Contributors
 * http://code.google.com/p/poly2tri/
 * 
 * poly2tri.js (JavaScript port) (c) 2009-2014, Poly2Tri Contributors
 * https://github.com/r3mi/poly2tri.js
 *
 * Unit tests for point.js
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

/* global jasmine, describe, it, expect */

"use strict";


var Point = require('../../src/point');


/*
 * Tests
 * =====
 *   TODO we test only part of the "public API" of Point for the time being
 *   (methods used in the "triangulate" tests),
 *   not all the methods or all sub-classes.
 */

describe("Point", function() {
    it("should have a default constructor", function() {
        expect(Point).toBeDefined();
        var point = new Point();
        expect(point).toEqual(jasmine.any(Point));
        expect(point.x).toBe(0);
        expect(point.y).toBe(0);
    });
    it("should have a constructor", function() {
        var point = new Point(1, 2);
        expect(point.x).toBe(1);
        expect(point.y).toBe(2);
    });
    it("should have a set() method", function() {
        var point = new Point(1, 2);
        point.set(3, 4);
        expect(point.x).toBe(3);
        expect(point.y).toBe(4);
    });
    it("should have a clone() method", function() {
        var point1 = new Point(1, 2), point2 = point1.clone();
        expect(point2.x).toBe(point1.x);
        expect(point2.y).toBe(point1.y);
    });
    it("should have a equals() method", function() {
        var point = new Point(1, 2);
        expect(point.equals(point)).toBeTruthy();
        expect(point.equals(new Point(1, 2))).toBeTruthy();
        expect(point.equals(new Point(1, 3))).toBeFalsy();
    });
    it("should have a equals() static function", function() {
        var point = new Point(1, 2);
        expect(Point.equals(point, point)).toBeTruthy();
        expect(Point.equals(point, new Point(1, 2))).toBeTruthy();
        expect(Point.equals(point, {x: 1, y: 2})).toBeTruthy();
        expect(Point.equals(point, new Point(1, 3))).toBeFalsy();
    });
    it("should have a toString() method", function() {
        var point = new Point(1, 2);
        expect(point.toString()).toBe("(1;2)");
    });
    it("should have a toString() static function", function() {
        expect(Point.toString(new Point(1, 2))).toBe("(1;2)");
        expect(Point.toString({x: 3, y: 4})).toBe("(3;4)");
        expect(Point.toString({z: 7, toString: function() {
                return "56";
            }
        })).toBe("56");
    });
    it("should stringify only coordinates into JSON", function() {
        var point = new Point(1, 2);
        expect(JSON.stringify(point)).toEqual('{"x":1,"y":2}');
    });
});

