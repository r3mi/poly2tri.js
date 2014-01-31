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
var p2text_cdt_free_input_points = c.cwrap('p2text_cdt_free_input_points', null, ['number']);
var p2t_cdt_free = c.cwrap('p2t_cdt_free', null, ['number']);
var p2text_point_with_id_new_ddi = c.cwrap('p2text_point_with_id_new_ddi', 'number', ['number', 'number', 'number']);
var p2text_triangle_get_point_id = c.cwrap('p2text_triangle_get_point_id', 'number', ['number', 'number']);
var g_ptr_array_new = c.cwrap('g_ptr_array_new', 'number');
var g_ptr_array_add = c.cwrap('g_ptr_array_add', null, ['number', 'number']);
var g_ptr_array_free = c.cwrap('g_ptr_array_free', 'number', ['number', 'number']);
var gext_ptr_array_length = c.cwrap('gext_ptr_array_length', 'number', ['number']);
var gext_ptr_array_get = c.cwrap('gext_ptr_array_get', 'number', ['number', 'number']);



var SweepContext = function(contour /*, options */) {
    this.points_ = [];
    var cpoints = this._makeCPoints(contour);
    this.cdt = p2t_cdt_new(cpoints);
    // "p2t_cdt_new" copy the contour array (but not the points themselves), 
    // so free the original g_ptr_array (and keep the points allocated).
    // XXX TODO modify "p2t_cdt_new" to avoid this additional copy & free ?
    g_ptr_array_free(cpoints);
};


/**
 * Allocate a new C point. The point is allocated on the emscripten heap 
 * and shall be de-allocated when finished.
 * @param {{x:number, y:number}} js_point any "Point like" object with {x,y} 
 * @returns {number} pointer to the C point
 */
SweepContext.prototype._makeCPoint = function(js_point) {
    var id = this.points_.length;
    var cpoint = p2text_point_with_id_new_ddi(js_point.x, js_point.y, id);
    this.points_.push(js_point);
    return cpoint;
};


/**
 * Allocate a new array of C points. These points, and the array, are allocated 
 * on the emscripten heap and shall be de-allocated when finished.
 * @param {Arrray<{x:number, y:number}>} js_points arrray of {x,y} objects
 * @returns {number} pointer to the C "g_ptr_array" of points
 */
SweepContext.prototype._makeCPoints = function(js_points) {
    var cpoints = g_ptr_array_new();
    js_points.forEach(function(js_point) {
        g_ptr_array_add(cpoints, this._makeCPoint(js_point));
    }, this);
    return cpoints;
};


SweepContext.prototype.getPoint = function(index) {
    return this.points_[index];
};

SweepContext.prototype.addHole = function(polyline) {
    var cpoints = this._makeCPoints(polyline);
    p2t_cdt_add_hole(this.cdt, cpoints);
    // "p2t_cdt_add_hole" copy the array (but not the points themselves), 
    // so free the original g_ptr_array (and keep the points allocated).
    g_ptr_array_free(cpoints);
    return this; // for chaining
};

// Backward compatibility
SweepContext.prototype.AddHole = SweepContext.prototype.addHole;

SweepContext.prototype.addPoint = function(point) {
    p2t_cdt_add_point(this.cdt, this._makeCPoint(point));
    return this; // for chaining
};

// Backward compatibility
SweepContext.prototype.AddPoint = SweepContext.prototype.addPoint;

SweepContext.prototype.addPoints = function(points) {
    // TBD XXX add method "AddPoints" in C version ??
    points.forEach(function(point) {
        p2t_cdt_add_point(this.cdt, this._makeCPoint(point));
    }, this);
    return this; // for chaining
};

SweepContext.prototype.triangulate = function() {
    p2t_cdt_triangulate(this.cdt);
    return this; // for chaining
};

SweepContext.prototype.getBoundingBox = function() {
    // Result is computed once and cached
    if (!this.pmin_ || !this.pmax_) {
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
    }
    return {min: this.pmin_, max: this.pmax_};
};

SweepContext.prototype.getTriangles = function() {
    // Result is computed once and cached
    if (!this.triangles_) {
        var ctriangles = p2t_cdt_get_triangles(this.cdt);
        var points = this.points_;
        var i;
        var result = [];
        // TBD XXX not very efficient, is there a better way ?
        var len = gext_ptr_array_length(ctriangles);
        for (i = 0; i < len; i++) {
            var ctriangle = gext_ptr_array_get(ctriangles, i);
            var id0 = p2text_triangle_get_point_id(ctriangle, 0);
            var id1 = p2text_triangle_get_point_id(ctriangle, 1);
            var id2 = p2text_triangle_get_point_id(ctriangle, 2);
            var t = new Triangle(points[id0], points[id1], points[id2]);
            result.push(t);
        }
        this.triangles_ = result;
    }
    return this.triangles_;
};

// Backward compatibility
SweepContext.prototype.GetTriangles = SweepContext.prototype.getTriangles;

// Additional method to free allocated memory by emscripten
SweepContext.prototype.delete = function() {
    // Free all the points allocated in the "_makeCPoint" method for the calls
    // to "p2t_cdt_new", "p2t_cdt_add_hole" and "p2t_cdt_add_point".
    p2text_cdt_free_input_points(this.cdt);
    // Free memory allocated by poly2tri
    p2t_cdt_free(this.cdt);
    delete this.cdt;
};

module.exports = SweepContext;
