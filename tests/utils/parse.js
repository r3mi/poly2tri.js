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
 * Parse a string of floats, ignoring any separators between numbers.
 * @param {String} str
 * @returns {Array.<number>} parsed floats (empty array if none)
 */
function parseFloats(str) {
    var floats = (str||"").split(/[^-+eE\.\d]+/).map(parseFloat).filter(function (val) {
        return !isNaN(val);
    });
    return floats;
}
exports.parseFloats = parseFloats;


/**
 * Parse a string with several group of floats : at least one blank line between each group.
 * Within a group, ignore any separators between float numbers.
 * @param {String} str
 * @returns {Array.<Array.<number>>} parsed groups of floats (empty array if none)
 */
function parseFloatsGroups(str) {
    var groups = (str||"").split(/\n\s*\n/).map(parseFloats).filter(function (floats) {
        return floats.length > 0;
    });
    return groups;
}
exports.parseFloatsGroups = parseFloatsGroups;
