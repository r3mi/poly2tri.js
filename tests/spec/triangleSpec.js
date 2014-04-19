/*
 * Poly2Tri Copyright (c) 2009-2014, Poly2Tri Contributors
 * http://code.google.com/p/poly2tri/
 * 
 * poly2tri.js (JavaScript port) (c) 2009-2014, Poly2Tri Contributors
 * https://github.com/r3mi/poly2tri.js
 *
 * Unit tests for triangle.js
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

/* global describe, it, expect, beforeEach */

"use strict";


var Triangle = require('../../src/triangle');

// Point === any "Point like" objects with {x,y} (duck typing)
var Point = function(x, y) {
    this.x = x;
    this.y = y;
};


/*
 * Tests
 * =====
 *   TODO we test only part of the "public API" of Triangle for the time being
 *   (methods used in the "triangulate" tests),
 *   not all the methods or all sub-classes.
 */

describe("Triangle", function() {
    var t, p1, p2, p3;
    beforeEach(function() {
        p1 = new Point(1, 2);
        p2 = new Point(3, 4);
        p3 = new Point(5, 6);
        t = new Triangle(p1, p2, p3);
    });
    it("should have a getPoint() method", function() {
        expect(t.getPoint(0)).toBe(p1);
        expect(t.getPoint(1)).toBe(p2);
        expect(t.getPoint(2)).toBe(p3);
    });
    it("should have a getPoints() method", function() {
        expect(t.getPoints()).toEqual([p1, p2, p3]);
    });
    it("should have a containsPoint() method", function() {
        expect(t.containsPoint(p1)).toBeTruthy();
        expect(t.containsPoint(p2)).toBeTruthy();
        expect(t.containsPoint(p3)).toBeTruthy();
        expect(t.containsPoint(new Point(1, 2))).toBeFalsy(); // compares references, not values
        expect(t.containsPoint(new Point(7, 8))).toBeFalsy();
    });
    it("should have a toString() method", function() {
        expect(t.toString()).toBe("[(1;2)(3;4)(5;6)]");
    });
});