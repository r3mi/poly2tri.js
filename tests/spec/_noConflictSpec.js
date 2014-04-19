/*
 * Poly2Tri Copyright (c) 2009-2014, Poly2Tri Contributors
 * http://code.google.com/p/poly2tri/
 * 
 * poly2tri.js (JavaScript port) (c) 2009-2014, Poly2Tri Contributors
 * https://github.com/r3mi/poly2tri.js
 *
 * Unit tests for poly2tri.js
 * Rémi Turboult, 11/2013
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

/*
 * Test module loading + "noConflict" for browsers.
 * Note : due to the interaction with the global scope, this Spec shall run first
 * in order to succeed in browsers (hence this file name starting with "_").
 */

global.poly2tri = "previous";
// For the browser, we require the final distributed bundle
var p2t = (process.browser ? require('../../dist/poly2tri.min') : require('../../src/poly2tri'));
global.poly2tri = p2t;

describe("poly2tri module", function() {
    it("should require 'poly2tri'", function() {
        expect(p2t).toBeDefined();
        expect(p2t.triangulate).toBeDefined();
    });
    it("should have 'VERSION' constant", function() {
        expect(p2t.VERSION).toMatch(/^1\.\d+\.\d+$/);
    });
    it("should have a noConflict() method", function() {
        var pp = global.poly2tri.noConflict();
        expect(pp).toBe(p2t);
        if (process.browser) {
            expect(global.poly2tri).toBe("previous");
        }
    });
});

