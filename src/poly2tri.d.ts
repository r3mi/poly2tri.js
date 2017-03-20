// Bundled type definitions for poly2tri.js
// Project: http://github.com/r3mi/poly2tri.js/
// Definitions by: Elemar Junior <https://github.com/elemarjr/>
// Updated by: Rémi Turboult <https://github.com/r3mi>

/*
 * Poly2Tri Copyright (c) 2009-2014, Poly2Tri Contributors
 * http://code.google.com/p/poly2tri/
 *
 * poly2tri.js (JavaScript port) (c) 2009-2017, Poly2Tri Contributors
 * https://github.com/r3mi/poly2tri.js
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

/**
 * poly2tri.js supports using custom point class instead of {@linkcode Point}.
 * Any "Point like" object with `{x, y}` attributes is supported
 * to initialize the SweepContext polylines and points
 * ([duck typing]{@link http://en.wikipedia.org/wiki/Duck_typing}).
 *
 * poly2tri.js might add extra fields to the point objects when computing the
 * triangulation : they are prefixed with `_p2t_` to avoid collisions
 * with fields in the custom class.
 *
 * @example
 *      const contour = [{x:100, y:100}, {x:100, y:300}, {x:300, y:300}, {x:300, y:100}];
 *      const swctx = new poly2tri.SweepContext(contour);
 */
export interface IPointLike {
    x: number;
    y: number;
}

// Alias
export type XY = IPointLike;


/**
 * poly2tri library version
 */
export const VERSION: string;


/**
 * A point {x, y}
 */
export class Point implements XY {

    public x: number;
    public y: number;

    constructor(x: number, y: number);

    public toString(): string;

    public toJSON(): JSON;

    public clone(): Point;

    public set_zero(): Point;

    public set(x: number, y: number): Point;

    public negate(): Point;

    public add(n: XY): Point;

    public sub(n: XY): Point;

    public mul(s: number): Point;

    public length(): number;

    public normalize(): number;

    public equals(p: XY): boolean;

    public static negate(p: XY): Point;

    public static add(a: XY, b: XY): Point;

    public static sub(a: XY, b: XY): Point;

    public static mul(s: number, p: XY): Point;

    public static cross(a: XY, b: XY): number;
    public static cross(a: XY, b: number): Point;
    public static cross(a: number, b: XY): Point;
    public static cross(a: number, b: number): number;

    public static toString(p: XY): string;

    public static compare(a: XY, b: XY): number;

    public static equals(a: XY, b: XY): boolean;

    public static dot(a: XY, b: XY): number;
}


/**
 * Custom exception class to indicate invalid Point values
 */
export class PointError extends Error {
    public points: Array<XY>;

    constructor(message: string, points: Array<XY>);
}


/**
 * Triangle defined by 3 points
 */
export class Triangle {
    constructor(a: XY, b: XY, c: XY);

    public toString(): string;

    public getPoint(index: number): XY;

    public getPoints(): [XY, XY, XY];

    public containsPoint(point: XY): boolean;

    public containsPoints(p1: XY, p2: XY): boolean;

    public isInterior(): boolean;
}


/**
 * Triangulation context
 */
export class SweepContext {
    constructor(contour: Array<XY>);

    constructor(contour: Array<XY>, options: JSON);

    public addHole(polyline: Array<XY>): SweepContext;

    public addHoles(holes: Array<Array<XY>>): SweepContext;

    public addPoint(point: XY): SweepContext;

    public addPoints(point: Array<XY>): SweepContext;

    public triangulate(): SweepContext;

    public getBoundingBox(): { min: Point; max: Point; };

    public getTriangles(): Array<Triangle>;
}

