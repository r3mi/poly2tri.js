/*
 * Poly2Tri Copyright (c) 2009-2014, Poly2Tri Contributors
 * http://code.google.com/p/poly2tri/
 * 
 * poly2tri.js (JavaScript port) (c) 2009-2014, Poly2Tri Contributors
 * https://github.com/r3mi/poly2tri.js
 *
 * Unit tests for xy.js
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

/* global describe, it, expect */

"use strict";


var xy = require('../../src/xy');

// Any "Point like" object  with {x,y} (duck typing)
var Point = function(x, y) {
    this.y = y;
    this.x = x;
};

describe("xy", function() {
    it("should have a toString() function", function() {
        expect(xy.toString({x: 3, y: 4})).toBe("(3;4)");
        expect(xy.toString(new Point(1, 2))).toBe("(1;2)");
        expect(xy.toString({z: 7, toString: function() {
                return "56";
            }
        })).toBe("56");
    });
    it("should have a equals() function", function() {
        var point = {x: 1, y: 2};
        expect(xy.equals(point, point)).toBeTruthy();
        expect(xy.equals(point, {x: 1, y: 2})).toBeTruthy();
        expect(xy.equals(point, new Point(1, 2))).toBeTruthy();
        expect(xy.equals({x: 1, y: 2}, point)).toBeTruthy();
        expect(xy.equals(point, {x: 1, y: 3})).toBeFalsy();
    });
    it("should have a compare() function", function() {
        var point = {x: 1, y: 2};
        expect(xy.compare(point, point)).toBe(0);
        expect(xy.compare(point, {x: 1, y: 2})).toBe(0);
        expect(xy.compare(point, new Point(1, 2))).toBe(0);
        // y ordering first, then x
        expect(xy.compare(point, {x: 1, y: 1})).toBeGreaterThan(0);
        expect(xy.compare(point, {x: 3, y: 1})).toBeGreaterThan(0);
        expect(xy.compare(point, {x: 1, y: 3})).toBeLessThan(0);
        expect(xy.compare(point, {x: 0, y: 3})).toBeLessThan(0);
    });
});

