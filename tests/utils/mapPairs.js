/*
 * Helper function for poly2tri.js demo & tests
 * 
 * (c) 2014, Rémi Turboult
 * All rights reserved.
 * Distributed under the 3-clause BSD License, see LICENSE.txt
 */

/* jshint node:true */

"use strict";


/**
 * This callback is called by <code>mapPairs</code> with 2 array elements at a time,
 * to produce an element of the new Array.
 * @callback mapPairsCallback
 * @param {*} a - even element being processed in the original Array
 * @param {*} b - odd element being processed in the original Array
 */

/**
 * Creates a new array with the results of calling a provided callback function on every elements pair in an array.
 * Like <code>Array.prototype.map()</code>, but taking 2 elements at a time.
 *
 * For sparse arrays, <code>mapPairs</code> behaves similarly to <code>map</map> : the callback is invoked only
 * for pairs of array indexes which are both existing  i.e. both have assigned elements. It is not invoked
 * if any element of the pair is missing, and there will be a missing element instead in the resulting array
 * (note that this behavior is only for undefined indexes : it is different from elements  with undefined values,
 * which are processed normally).
 *
 * This implies that this function also ignores any isolated element at the end of the original array, if its length
 * is not a multiple of 2.
 * The resulting array's length will always be half of the original array's length, rounded down.
 *
 * @example
 *      var arr = ['a', 'b', 'c', 'd'];
 *      mapPairs(arr, function (a, b) { return a + b; });
 *      // → ['ab', 'cd']
 * @example
 *      var arr = ['a', , 'c', 'd', 'e'];
 *      mapPairs(arr, function (a, b) { return a + b; });
 *      // → [ , 'cd']
 *
 * @param {Array} arr - original Array (not modified by the function)
 * @param {mapPairsCallback} callback - function that produces an element of the new Array
 * @param {Object} thisArg - value to use as this when executing callback
 * @returns {Array}
 */
function mapPairs(arr, callback, thisArg) {
    if (!arr) {
        throw new TypeError("mapPairs null or undefined array");
    }
    if (typeof callback !== "function") {
        throw new TypeError("mapPairs callback is not a function");
    }
    var len = Math.floor(arr.length / 2);
    var result = new Array(len);
    for (var i = 0, j = 0; i < len; i++, j += 2) {
        if (j in arr && (j + 1) in arr) {
            result[i] = callback.call(thisArg, arr[j], arr[j + 1]);
        }
    }
    return result;
}
module.exports = mapPairs;
