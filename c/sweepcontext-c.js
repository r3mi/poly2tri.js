/*
 * Poly2Tri Copyright (c) 2009-2013, Poly2Tri Contributors
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
 * SweepContext Emscripten C version
 * =================================
 */

var Point = require('../src/point');
var Triangle = require('../src/triangle');

var c = require('../build/c');

var p2t_cdt_new = c.cwrap('p2t_cdt_new', 'number', ['number']);
var p2t_cdt_add_hole = c.cwrap('p2t_cdt_add_hole', null, ['number', 'number']);
var p2t_cdt_add_point = c.cwrap('p2t_cdt_add_point', null, ['number', 'number']);
var p2t_cdt_triangulate = c.cwrap('p2t_cdt_triangulate', null, ['number']);
var p2t_cdt_get_triangles = c.cwrap('p2t_cdt_get_triangles', 'number', ['number']);
var p2t_cdt_free = c.cwrap('p2t_cdt_free', null, ['number']);
var p2t_point_new_dd_with_id = c.cwrap('p2t_point_new_dd_with_id', 'number', ['number', 'number', 'number']);
var p2t_triangle_get_point_id = c.cwrap('p2t_triangle_get_point_id', 'number', ['number', 'number']);
var g_ptr_array_new = c.cwrap('g_ptr_array_new', 'number');
var g_ptr_array_add = c.cwrap('g_ptr_array_add', null, ['number', 'number']);
var g_ptr_array_length = c.cwrap('g_ptr_array_length', 'number', ['number']);
var g_ptr_array_get = c.cwrap('g_ptr_array_get', 'number', ['number', 'number']);


var SweepContext = function(contour /*, options */) {
    this.points_ = [];
    this.cdt = p2t_cdt_new(this.makeCppPoints(contour));
};

SweepContext.prototype.makeCppPoint = function(js_point) {
    var id = this.points_.length;
    var cpp_point = p2t_point_new_dd_with_id(js_point.x, js_point.y, id);
    this.points_.push(js_point);
    // XXX TODO check leaks and memory management
    return cpp_point;
};

SweepContext.prototype.makeCppPoints = function(js_points) {
    var cpp_points = g_ptr_array_new();
    js_points.forEach(function(js_point) {
        g_ptr_array_add(cpp_points, this.makeCppPoint(js_point));
    }, this);
    // XXX TODO check leaks and memory management
    return cpp_points;
};

SweepContext.prototype.getPoint = function(index) {
    return this.points_[index];
};

SweepContext.prototype.addHole = function(polyline) {
    p2t_cdt_add_hole(this.cdt, this.makeCppPoints(polyline));
    return this; // for chaining
};

// Backward compatibility
SweepContext.prototype.AddHole = SweepContext.prototype.addHole;

SweepContext.prototype.addPoint = function(point) {
    p2t_cdt_add_point(this.cdt, this.makeCppPoint(point));
    return this; // for chaining
};

// Backward compatibility
SweepContext.prototype.AddPoint = SweepContext.prototype.addPoint;

SweepContext.prototype.addPoints = function(points) {
    // TBD XXX add method "AddPoints" in C version ??
    points.forEach(function(point) {
        p2t_cdt_add_point(this.cdt, this.makeCppPoint(point));
    }, this);
    return this; // for chaining
};

SweepContext.prototype.triangulate = function() {
    p2t_cdt_triangulate(this.cdt);
    return this; // for chaining
};

SweepContext.prototype.getBoundingBox = function() {
    // TBD XXX cache
    var xmax = this.points_[0].x;
    var xmin = this.points_[0].x;
    var ymax = this.points_[0].y;
    var ymin = this.points_[0].y;

    // Calculate bounds
    var i, len = this.points_.length;
    for (i = 1; i < len; i++) {
        var p = this.points_[i];
        /* jshint expr:true */
        (p.x > xmax) && (xmax = p.x);
        (p.x < xmin) && (xmin = p.x);
        (p.y > ymax) && (ymax = p.y);
        (p.y < ymin) && (ymin = p.y);
    }
    this.pmin_ = new Point(xmin, ymin);
    this.pmax_ = new Point(xmax, ymax);

    return {min: this.pmin_, max: this.pmax_};
};

SweepContext.prototype.getTriangles = function() {
    // TBD XXX cache result ?
    var cpp_triangles = p2t_cdt_get_triangles(this.cdt);
    // TBD XXX memory leak ??
    var i;
    var result = [];
    // TBD XXX not very efficient, is there a better way ?
    var len = g_ptr_array_length(cpp_triangles);
    for (i = 0; i < len; i++) {
        var cpp_t = g_ptr_array_get(cpp_triangles, i);
        var id0 = p2t_triangle_get_point_id(cpp_t, 0);
        var id1 = p2t_triangle_get_point_id(cpp_t, 1);
        var id2 = p2t_triangle_get_point_id(cpp_t, 2);
        var t = new Triangle(
                this.points_[id0],
                this.points_[id1],
                this.points_[id2]
                );
        result.push(t);
    }
    return result;
};

// Backward compatibility
SweepContext.prototype.GetTriangles = SweepContext.prototype.getTriangles;

// Additional method to free allocated memory by emscripten
SweepContext.prototype.delete = function() {
    p2t_cdt_free(this.cdt);
};

module.exports = SweepContext;
