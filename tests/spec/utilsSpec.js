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

/* global describe, it, expect, beforeEach  */

"use strict";


var utils = require('../../src/utils');


describe("utils", function() {
    var ε = utils.EPSILON;
    var Orientation = utils.Orientation;
    var orient2d = utils.orient2d;

    it("should export EPSILON", function() {
        expect(ε).toBeGreaterThan(0.0);
        expect(ε).toBeLessThan(0.001);
    });

    describe("orient2d", function() {
        it("should compute CW", function() {
            expect(orient2d({x: 1, y: 1}, {x: 2, y: 2}, {x: 2, y: 1})).toBe(Orientation.CW);
        });
        it("should compute CCW", function() {
            expect(orient2d({x: 1, y: 1}, {x: 2, y: 2}, {x: 1, y: 2})).toBe(Orientation.CCW);
        });
        it("should compute COLLINEAR", function() {
            expect(orient2d({x: 1, y: 1}, {x: 2, y: 2}, {x: 3, y: 3})).toBe(Orientation.COLLINEAR);
        });
        it("should compute COLLINEAR if less than epsilon", function() {
            expect(orient2d({x: 1 - ε / 10, y: 1}, {x: 2 + ε / 10, y: 2}, {x: 3, y: 3 + ε / 10})).toBe(Orientation.COLLINEAR);
        });
    });

    describe("inScanArea", function() {
        var inScanArea = utils.inScanArea;
        var pa, pb, pc;
        beforeEach(function() {
            pa = {x: 1, y: 1};
            pb = {x: 7, y: 3};
            pc = {x: 2, y: 5};
        });
        it("should use CCW points", function() {
            expect(orient2d(pa, pb, pc)).toBe(Orientation.CCW);
        });
        it("should be true if inside triangle (abc)", function() {
            expect(inScanArea(pa, pb, pc, {x: 4, y: 4})).toBeTruthy();
        });
        it("should be true if in front of triangle (edge bc)", function() {
            expect(inScanArea(pa, pb, pc, {x: 5, y: 4})).toBeTruthy();
        });
        it("should be false if above/left of triangle (edge ac)", function() {
            expect(inScanArea(pa, pb, pc, {x: 0.5, y: 4})).toBeFalsy();
        });
        it("should be false if below/right of triangle (edge ab)", function() {
            expect(inScanArea(pa, pb, pc, {x: 4, y: 1.5})).toBeFalsy();
        });
        it("should be false if behind triangle", function() {
            expect(inScanArea(pa, pb, pc, {x: 0, y: 0})).toBeFalsy();
        });
        it("should be false if collinear (edge ac)", function() {
            expect(inScanArea(pa, pb, pc, {x: 3, y: 9})).toBeFalsy();
        });
        it("should be false if collinear (edge ab)", function() {
            expect(inScanArea(pa, pb, pc, {x: 13, y: 5})).toBeFalsy();
        });
        it("should be false if collinear within epsilon (edge ac)", function() {
            expect(inScanArea(pa, pb, pc, {x: 3 + ε / 10, y: 9})).toBeFalsy();
        });
        it("should be false if collinear within epsilon (edge ab)", function() {
            expect(inScanArea(pa, pb, pc, {x: 13, y: 5 + ε / 10})).toBeFalsy();
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

