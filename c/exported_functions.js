#!/usr/bin/env node
/* 
 * Helper tool to return the C functions called from a JavaScript file
 * (used by the EXPORTED_FUNCTIONS parameter to emscripten).
 * 
 * (c) 2014, Rémi Turboult
 * All rights reserved.
 * Distributed under the 3-clause BSD License, see LICENSE.txt
 *
 */

"use strict";

var fs = require('fs');
var parse = require('acorn/acorn_loose').parse_dammit;
var walk = require('acorn/util/walk');

/*
 * Extracts calls to 'ccall' and 'cwrap'
 * TODO handle raw calls to C functions (prefixed by "_") ?
 */
function get_c_functions(filename) {
    var prog = fs.readFileSync(filename, 'utf8');
    var ast = parse(prog);
    var funcs = [];
    walk.simple(ast, {
        CallExpression: function(node) {
            var name = (node.callee.property ? node.callee.property.name : node.callee.name);
            if (name === 'cwrap' || name === 'ccall') {
                funcs.push("_" + node.arguments[0].value);
            }
        }
    });
    return funcs;
}

// Parse all files
var funcs = [];
process.argv.slice(2).forEach(function(filename) {
    funcs = funcs.concat(get_c_functions(filename));
});

// Output the result
console.log(JSON.stringify(funcs));

 