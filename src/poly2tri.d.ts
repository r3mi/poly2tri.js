// Bundled type definitions for poly2tri.js
// Project: http://github.com/r3mi/poly2tri.js/
// Definitions by: Elemar Junior <https://github.com/elemarjr/>
// Updated by: Rémi Turboult <https://github.com/r3mi>
// TypeScript Version: 2.0

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
 * If you are not using a module system (e.g. CommonJS, RequireJS), you can access this library
 * as a global variable `poly2tri` i.e. `window.poly2tri` in a browser.
 */
export as namespace poly2tri;


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
    /** x coordinate */
    x: number;
    /** y coordinate */
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

    /** x coordinate */
    public x: number;
    /** y coordinate */
    public y: number;

    /**
     * Construct a point
     * @example
     *      const point = new poly2tri.Point(150, 150);
     * @param x    coordinate (0 if undefined)
     * @param y    coordinate (0 if undefined)
     */
    constructor(x?: number, y?: number);

    /**
     * For pretty printing
     * @example
     *      "p=" + new poly2tri.Point(5,42)
     *      // → "p=(5;42)"
     * @returns `"(x;y)"`
     */
    public toString(): string;

    /**
     * JSON output, only coordinates
     * @example
     *      JSON.stringify(new poly2tri.Point(1,2))
     *      // → '{"x":1,"y":2}'
     */
    public toJSON(): any;

    /**
     * Creates a copy of this Point object.
     * @return   new cloned point
     */
    public clone(): Point;

    /**
     * Set this Point instance to the origin `(0; 0)`
     * @return this (for chaining)
     */
    public set_zero(): Point;

    /**
     * Set the coordinates of this instance.
     * @param {number} x   coordinate
     * @param {number} y   coordinate
     * @return this (for chaining)
     */
    public set(x: number, y: number): Point;

    /**
     * Negate this Point instance. (component-wise)
     * @return this (for chaining)
     */
    public negate(): Point;

    /**
     * Add another Point object to this instance. (component-wise)
     * @param n - Point object.
     * @return this (for chaining)
     */
    public add(n: XY): Point;

    /**
     * Subtract this Point instance with another point given. (component-wise)
     * @param n - Point object.
     * @return this (for chaining)
     */
    public sub(n: XY): Point;

    /**
     * Multiply this Point instance by a scalar. (component-wise)
     * @param s   scalar.
     * @return this (for chaining)
     */
    public mul(s: number): Point;

    /**
     * Return the distance of this Point instance from the origin.
     * @return distance
     */
    public length(): number;

    /**
     * Normalize this Point instance (as a vector).
     * @return The original distance of this instance from the origo.
     */
    public normalize(): number;

    /**
     * Test this Point object with another for equality.
     * @param p - any "Point like" object with {x,y}
     * @return `true` if same x and y coordinates, `false` otherwise.
     */
    public equals(p: XY): boolean;

    /**
     * Negate a point component-wise and return the result as a new Point object.
     * @param p - any "Point like" object with {x,y}
     * @return the resulting Point object.
     */
    public static negate(p: XY): Point;

    /**
     * Add two points component-wise and return the result as a new Point object.
     * @param a - any "Point like" object with {x,y}
     * @param b - any "Point like" object with {x,y}
     * @return the resulting Point object.
     */
    public static add(a: XY, b: XY): Point;

    /**
     * Subtract two points component-wise and return the result as a new Point object.
     * @param a - any "Point like" object with {x,y}
     * @param b - any "Point like" object with {x,y}
     * @return the resulting Point object.
     */
    public static sub(a: XY, b: XY): Point;

    /**
     * Multiply a point by a scalar and return the result as a new Point object.
     * @param s - the scalar
     * @param p - any "Point like" object with {x,y}
     * @return the resulting Point object.
     */
    public static mul(s: number, p: XY): Point;

    /**
     * Perform the cross product on either two points (result is a scalar)
     * or a point and a scalar (result is a point).
     * This function requires two parameters, either may be a Point object or a
     * number.
     * @param  a - Point object or scalar.
     * @param  b - Point object or scalar.
     * @return a Point object or a number, depending on the parameters.
     */
    public static cross(a: XY, b: XY): number;
    public static cross(a: XY, b: number): Point;
    public static cross(a: number, b: XY): Point;
    public static cross(a: number, b: number): number;

    /**
     * Point pretty printing. Delegates to the point's custom "toString()" method if exists,
     * else simply prints x and y coordinates.
     * @example
     *      xy.toString({x:5, y:42})
     *      // → "(5;42)"
     * @example
     *      xy.toString({x:5,y:42,toString:function() {return this.x+":"+this.y;}})
     *      // → "5:42"
     * @param p - point object with {x,y}
     * @returns `"(x;y)"`
     */
    public static toString(p: XY): string;

    /**
     * Compare two points component-wise. Ordered by y axis first, then x axis.
     * @param a - point object with {x,y}
     * @param b - point object with {x,y}
     * @return `< 0` if `a < b` ; `> 0` if `a > b` ; `0` otherwise.
     */
    public static compare(a: XY, b: XY): number;

    /**
     * Test two Point objects for equality.
     * @param a - point object with {x,y}
     * @param b - point object with {x,y}
     * @return `true` if `a == b`, `false` otherwise.
     */
    public static equals(a: XY, b: XY): boolean;

    /**
     * Peform the dot product on two vectors.
     * @param a - any "Point like" object with {x,y}
     * @param b - any "Point like" object with {x,y}
     * @return the dot product
     */
    public static dot(a: XY, b: XY): number;
}


/**
 * Custom exception class to indicate invalid Point values
 */
export class PointError extends Error {
    /**
     * Invalid points
     */
    public readonly points: ReadonlyArray<XY>;

    /**
     * Custom exception class to indicate invalid Point values
     * @param message - error message
     * @param points - invalid points
     */
    constructor(message: string, points: Array<XY>);
}


/**
 * Triangle defined by 3 points
 */
export class Triangle {
    constructor(a: XY, b: XY, c: XY);

    /**
     * For pretty printing ex. `"[(5;42)(10;20)(21;30)]"`.
     */
    public toString(): string;

    /**
     * Get one vertice of the triangle.
     * The output triangles of a triangulation have vertices which are references
     * to the initial input points (not copies): any custom fields in the
     * initial points can be retrieved in the output triangles.
     * @example
     *      const contour = [{x:100, y:100, id:1}, {x:100, y:300, id:2}, {x:300, y:300, id:3}];
     *      const swctx = new poly2tri.SweepContext(contour);
     *      swctx.triangulate();
     *      const triangles = swctx.getTriangles();
     *      typeof triangles[0].getPoint(0).id
     *      // → "number"
     * @param index - vertice index: 0, 1 or 2
     * @returns point
     */
    public getPoint(index: 0 | 1 | 2): XY;

    /**
     * Get all 3 vertices of the triangle as an array
     */
    public getPoints(): [XY, XY, XY];

    public containsPoint(point: XY): boolean;

    public containsPoints(p1: XY, p2: XY): boolean;

    public isInterior(): boolean;
}


/**
 * SweepContext constructor option
 */
export interface SweepContextOptions {
    /**
     * cloneArrays - if `true`, do a shallow copy of the Array parameters (contour, holes).
     * Points inside arrays are never copied.
     * Default is `false` : keep a reference to the array arguments, who will be modified in place.
     */
    cloneArrays?: boolean;
}


/**
 * Triangulation context
 */
export class SweepContext {

    /**
     * Constructor for the triangulation context.
     * It accepts a simple polyline (with non repeating points),
     * which defines the constrained edges.
     *
     * @example
     *          const contour = [
     *              new poly2tri.Point(100, 100),
     *              new poly2tri.Point(100, 300),
     *              new poly2tri.Point(300, 300),
     *              new poly2tri.Point(300, 100)
     *          ];
     *          const swctx = new poly2tri.SweepContext(contour, {cloneArrays: true});
     * @example
     *          const contour = [{x:100, y:100}, {x:100, y:300}, {x:300, y:300}, {x:300, y:100}];
     *          const swctx = new poly2tri.SweepContext(contour, {cloneArrays: true});
     *
     * @param contour - array of point objects. The points can be either {@linkcode Point} instances,
     *          or any "Point like" custom class with `{x, y}` attributes.
     * @param options - constructor options
     */
    constructor(contour: Array<XY>, options?: SweepContextOptions);

    /**
     * Add a hole to the constraints
     * @example
     *      const swctx = new poly2tri.SweepContext(contour);
     *      const hole = [
     *          new poly2tri.Point(200, 200),
     *          new poly2tri.Point(200, 250),
     *          new poly2tri.Point(250, 250)
     *      ];
     *      swctx.addHole(hole);
     * @example
     *      const swctx = new poly2tri.SweepContext(contour);
     *      swctx.addHole([{x:200, y:200}, {x:200, y:250}, {x:250, y:250}]);
     *
     * @param polyline - array of "Point like" objects with {x,y}
     */
    public addHole(polyline: Array<XY>): SweepContext;

    /**
     * Add several holes to the constraints.
     * @example
     *      const swctx = new poly2tri.SweepContext(contour);
     *      const holes = [
     *          [ new poly2tri.Point(200, 200), new poly2tri.Point(200, 250), new poly2tri.Point(250, 250) ],
     *          [ new poly2tri.Point(300, 300), new poly2tri.Point(300, 350), new poly2tri.Point(350, 350) ]
     *      ];
     *      swctx.addHoles(holes);
     * @example
     *      const swctx = new poly2tri.SweepContext(contour);
     *      const holes = [
     *          [{x:200, y:200}, {x:200, y:250}, {x:250, y:250}],
     *          [{x:300, y:300}, {x:300, y:350}, {x:350, y:350}]
     *      ];
     *      swctx.addHoles(holes);
     *
     * @param holes - array of array of "Point like" objects with {x,y}
     */
    public addHoles(holes: Array<Array<XY>>): SweepContext;

    /**
     * Add a Steiner point to the constraints
     * @example
     *      const swctx = new poly2tri.SweepContext(contour);
     *      const point = new poly2tri.Point(150, 150);
     *      swctx.addPoint(point);
     * @example
     *      const swctx = new poly2tri.SweepContext(contour);
     *      swctx.addPoint({x:150, y:150});
     *
     * @param point - any "Point like" object with {x,y}
     */
    public addPoint(point: XY): SweepContext;

    /**
     * Add several Steiner points to the constraints
     * @example
     *      const swctx = new poly2tri.SweepContext(contour);
     *      const points = [
     *          new poly2tri.Point(150, 150),
     *          new poly2tri.Point(200, 250),
     *          new poly2tri.Point(250, 250)
     *      ];
     *      swctx.addPoints(points);
     * @example
     *      const swctx = new poly2tri.SweepContext(contour);
     *      swctx.addPoints([{x:150, y:150}, {x:200, y:250}, {x:250, y:250}]);
     *
     * @param points - array of "Point like" object with {x,y}
     */
    public addPoints(point: Array<XY>): SweepContext;

    /**
     * Triangulate the polygon with holes and Steiner points.
     * Do this AFTER you've added the polyline, holes, and Steiner points
     * @example
     *      const swctx = new poly2tri.SweepContext(contour);
     *      swctx.triangulate();
     *      const triangles = swctx.getTriangles();
     */
    public triangulate(): SweepContext;

    /**
     * Get the bounding box of the provided constraints (contour, holes and
     * Steinter points). Warning : these values are not available if the triangulation
     * has not been done yet.
     *
     * @returns object with 'min' and 'max' Point
     */
    public getBoundingBox(): { min: Point; max: Point; };

    /**
     * Get result of triangulation.
     * The output triangles have vertices which are references
     * to the initial input points (not copies): any custom fields in the
     * initial points can be retrieved in the output triangles.
     *
     * @example
     *      const swctx = new poly2tri.SweepContext(contour);
     *      swctx.triangulate();
     *      const triangles = swctx.getTriangles();
     * @example
     *      const contour = [{x:100, y:100, id:1}, {x:100, y:300, id:2}, {x:300, y:300, id:3}];
     *      const swctx = new poly2tri.SweepContext(contour);
     *      swctx.triangulate();
     *      const triangles = swctx.getTriangles();
     *      typeof triangles[0].getPoint(0).id
     *      // → "number"
     *
     * @returns array of triangles
     */
    public getTriangles(): Array<Triangle>;
}

