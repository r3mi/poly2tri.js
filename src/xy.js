/*
 * Poly2Tri Copyright (c) 2009-2014, Poly2Tri Contributors
 * http://code.google.com/p/poly2tri/
 * 
 * poly2tri.js (JavaScript port) (c) 2009-2014, Poly2Tri Contributors
 * https://github.com/r3mi/poly2tri.js
 * 
 * All rights reserved.
 * 
 * Distributed under the 3-clause BSD License, see LICENSE.txt
 */

"use strict";

/*
 * The following functions operate on "Point" or any "Point like" object 
 * with {x,y} (duck typing).
 */


/**
 * Point pretty printing ex. <i>"(5;42)"</i>)
 * @param {!{x:number, y:number}} p Point
 * @returns {string}
 */
function toStringBase(p) {
    return ("(" + p.x + ";" + p.y + ")");
}
/**
 * Point pretty printing ex. <i>"(5;42)"</i>)
 * @param {!{x:number, y:number}} p   Point
 * @return {string}
 */
function toString(p) {
    // Try a custom toString first, and fallback to own implementation if none
    var s = p.toString();
    return (s === '[object Object]' ? toStringBase(p) : s);
}

/**
 * Compare two points component-wise. Ordered by y axis first, then x axis.
 * @param {!{x:number, y:number}} a   Point
 * @param {!{x:number, y:number}} b   Point
 * @return {number} <code>&lt; 0</code> if <code>a &lt; b</code>,
 *         <code>&gt; 0</code> if <code>a &gt; b</code>, 
 *         <code>0</code> otherwise.
 */
function compare(a, b) {
    if (a.y === b.y) {
        return a.x - b.x;
    } else {
        return a.y - b.y;
    }
}

/**
 * Test two Point objects for equality.
 * @param {!{x:number, y:number}} a   Point
 * @param {!{x:number, y:number}} b   Point
 * @return {boolean} <code>True</code> if <code>a == b</code>, <code>false</code> otherwise.
 */
function equals(a, b) {
    return a.x === b.x && a.y === b.y;
}


module.exports = {
    toString: toString,
    toStringBase: toStringBase,
    compare: compare,
    equals: equals
};
