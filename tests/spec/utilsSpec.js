/*
 * Poly2Tri Copyright (c) 2009-2014, Poly2Tri Contributors
 * http://code.google.com/p/poly2tri/
 * 
 * poly2tri.js (JavaScript port) (c) 2009-2014, Poly2Tri Contributors
 * https://github.com/r3mi/poly2tri.js
 *
 * Unit tests for utils.js
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

/* global describe, describe, it, expect, beforeEach  */

"use strict";


var utils = require('../../src/utils');


describe("utils", function () {
    var ε1 = 1E-1;          // precision
    var ε2 = ε1 * ε1;       // precision squared
    var ε3 = ε1 * ε1 * ε1;  // negligible compared to precision
    var Orientation = utils.Orientation;
    var orient2d = utils.orient2d;

    describe("orient2d", function () {
        it("should compute CW", function () {
            expect(orient2d({x: 1, y: 1}, {x: 2, y: 2}, {x: 2, y: 1}, ε2)).toBe(Orientation.CW);
        });
        it("should compute CCW", function () {
            expect(orient2d({x: 1, y: 1}, {x: 2, y: 2}, {x: 1, y: 2}, ε2)).toBe(Orientation.CCW);
        });
        it("should compute COLLINEAR", function () {
            expect(orient2d({x: 1, y: 1}, {x: 2, y: 2}, {x: 3, y: 3}, ε2)).toBe(Orientation.COLLINEAR);
        });
        it("should not compute COLLINEAR if delta equal to precision", function () {
            expect(orient2d({x: 1 - ε1, y: 1}, {x: 2 + ε1, y: 2}, {x: 3, y: 3 + ε1}, ε2)).not.toBe(Orientation.COLLINEAR);
        });
        it("should compute COLLINEAR if delta of lot less than precision", function () {
            expect(orient2d({x: 1 - ε3, y: 1}, {x: 2 + ε3, y: 2}, {x: 3, y: 3 + ε3}, ε2)).toBe(Orientation.COLLINEAR);
        });
    });

    describe("inScanArea", function () {
        var inScanArea = utils.inScanArea;
        var pa, pb, pc;
        beforeEach(function () {
            /*
             * Disposition of the test points below
             * (reference triangle is ABC).
             *
             * 9     I
             * 8
             * 7
             * 6
             * 5   C                     J
             * 4F      D E
             * 3             B
             * 2         G
             * 1 A
             * H 1 2 3 4 5 6 7 8 9 0 1 2 3
             */
            pa = {x: 1, y: 1};
            pb = {x: 7, y: 3};
            pc = {x: 2, y: 5};
        });
        it("should use CCW points", function () {
            expect(orient2d(pa, pb, pc, ε2)).toBe(Orientation.CCW);
        });
        it("should be true if inside triangle (abc)", function () {
            var pd = {x: 4, y: 4};
            expect(inScanArea(pa, pb, pc, pd, ε2)).toBeTruthy();
        });
        it("should be true if in front of triangle (edge bc)", function () {
            var pe = {x: 5, y: 4};
            expect(inScanArea(pa, pb, pc, pe, ε2)).toBeTruthy();
        });
        it("should be false if above/left of triangle (edge ac)", function () {
            var pf = {x: 0.5, y: 4};
            expect(inScanArea(pa, pb, pc, pf, ε2)).toBeFalsy();
        });
        it("should be false if below/right of triangle (edge ab)", function () {
            var pg = {x: 5, y: 2};
            expect(inScanArea(pa, pb, pc, pg, ε2)).toBeFalsy();
        });
        it("should be false if behind triangle", function () {
            var ph = {x: 0, y: 0};
            expect(inScanArea(pa, pb, pc, ph, ε2)).toBeFalsy();
        });
        it("should be false if collinear (edge ac)", function () {
            var pi = {x: 3, y: 9};
            expect(inScanArea(pa, pb, pc, pi, ε2)).toBeFalsy();
        });
        it("should be true if almost collinear (edge ac) but in front of triangle", function () {
            var pi = {x: 3 + ε1, y: 9};
            expect(inScanArea(pa, pb, pc, pi, ε2)).toBeTruthy();
        });
        it("should be false if almost collinear (edge ac) but in front of triangle less then precision", function () {
            var pi = {x: 3 + ε3, y: 9};
            expect(inScanArea(pa, pb, pc, pi, ε2)).toBeFalsy();
        });
        it("should be false if almost collinear (edge ac) but left of triangle", function () {
            var pi = {x: 3 - ε1, y: 9};
            expect(inScanArea(pa, pb, pc, pi, ε2)).toBeFalsy();
        });
        it("should be false if collinear (edge ab)", function () {
            var pj = {x: 13, y: 5};
            expect(inScanArea(pa, pb, pc, pj, ε2)).toBeFalsy();
        });
        it("should be true if almost collinear (edge ab) but in front of triangle", function () {
            var pj = {x: 13, y: 5 + ε1};
            expect(inScanArea(pa, pb, pc, pj, ε2)).toBeTruthy();
        });
        it("should be false if almost collinear (edge ab) but in front of triangle less than precision", function () {
            var pj = {x: 13, y: 5 + ε3};
            expect(inScanArea(pa, pb, pc, pj, ε2)).toBeFalsy();
        });
        it("should be false if almost collinear (edge ab) but right of triangle", function () {
            var pj = {x: 13, y: 5 - ε1};
            expect(inScanArea(pa, pb, pc, pj, ε2)).toBeFalsy();
        });
    });

    describe("isAngleObtuse", function () {
        var isAngleObtuse = utils.isAngleObtuse;
        it("should be false for nul angle", function() {
            expect(isAngleObtuse({x: 5, y: 7}, {x: 2, y: 3}, {x: 2, y: 3})).toBeFalsy();
        });
        it("should be false for acute angle", function() {
            var pa = {x: 1, y: 1}, pb = {x: 3, y: 2}, pc = {x: 2, y: 4};
            expect(isAngleObtuse(pa, pb, pc)).toBeFalsy();
            expect(isAngleObtuse(pa, pc, pb)).toBeFalsy();
        });
        it("should be false for right angle", function() {
            var pa = {x: 1, y: 1}, pb = {x: 3, y: 2}, pc = {x: -1, y: 5};
            expect(isAngleObtuse(pa, pb, pc)).toBeFalsy();
            expect(isAngleObtuse(pa, pc, pb)).toBeFalsy();
        });
        it("should be true for obtuse angle", function() {
            var pa = {x: 1, y: 1}, pb = {x: 3, y: 2}, pc = {x: -2, y: 3};
            expect(isAngleObtuse(pa, pb, pc)).toBeTruthy();
            expect(isAngleObtuse(pa, pc, pb)).toBeTruthy();
        });
        it("should be false for nul vector", function() {
            expect(isAngleObtuse({x: 1, y: 1}, {x: 1, y: 1}, {x: 2, y: 3})).toBeFalsy();
        });
    });
});

