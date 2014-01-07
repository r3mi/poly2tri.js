/*
 * Poly2Tri Copyright (c) 2009-2013, Poly2Tri Contributors
 * http://code.google.com/p/poly2tri/
 * 
 * poly2tri.js (JavaScript port) (c) 2009-2013, Poly2Tri Contributors
 * https://github.com/r3mi/poly2tri.js
 * 
 * All rights reserved.
 * 
 * Distributed under the 3-clause BSD License, see LICENSE.txt
 */

"use strict";

/*
 * SweepContext Emscripten C++ version
 * ===================================
 */

var Point = require('../src/point');
var Triangle = require('../src/triangle');

var cpp = require('../build/cpp');

var SweepContext = function(contour /*, options */) {
    this.points_ = [];
    this.cdt = new cpp.CDT(this.makeCppPoints(contour));
};

SweepContext.prototype.makeCppPoint = function(js_point) {
    var id = this.points_.length;
    var cpp_point = new cpp.PointWithId(js_point.x, js_point.y, id);
    this.points_.push(js_point);
    // XXX TODO check leaks and memory management
    return cpp_point;
};

SweepContext.prototype.makeCppPoints = function(js_points) {
    var cpp_points = new cpp.VectorPoints();
    js_points.forEach(function(js_point) {
        cpp_points.push_back(this.makeCppPoint(js_point));
    }, this);
    // XXX TODO check leaks and memory management
    return cpp_points;
};

SweepContext.prototype.getPoint = function(index) {
    return this.points_[index];
};

SweepContext.prototype.addHole = function(polyline) {
    this.cdt.addHole(this.makeCppPoints(polyline));
    return this; // for chaining
};

// Backward compatibility
SweepContext.prototype.AddHole = SweepContext.prototype.addHole;

SweepContext.prototype.addPoint = function(point) {
    this.cdt.addPoint(this.makeCppPoint(point));
    return this; // for chaining
};

// Backward compatibility
SweepContext.prototype.AddPoint = SweepContext.prototype.addPoint;

SweepContext.prototype.addPoints = function(points) {
    // TBD XXX add method "AddPoints" in C++ version ??
    points.forEach(function(point) {
        this.cdt.addPoint(this.makeCppPoint(point));
    }, this);
    return this; // for chaining
};

SweepContext.prototype.triangulate = function() {
    this.cdt.triangulate();
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
    var cpp_triangles = this.cdt.getTriangles();
    // TBD XXX memory leak ??
    var i;
    var result = [];
    // TBD XXX not very efficient, is there a better way ?
    for (i = 0; i < cpp_triangles.size(); i++) {
        var cpp_t = cpp_triangles.get(i);
        var cpp_0 = cpp.PointWithId.fromPoint(cpp_t.getPoint(0));
        var cpp_1 = cpp.PointWithId.fromPoint(cpp_t.getPoint(1));
        var cpp_2 = cpp.PointWithId.fromPoint(cpp_t.getPoint(2));
        var t = new Triangle(
                this.points_[cpp_0.id],
                this.points_[cpp_1.id],
                this.points_[cpp_2.id]
                );
        result.push(t);
    }
    return result;
};

// Backward compatibility
SweepContext.prototype.GetTriangles = SweepContext.prototype.getTriangles;

// Additional method to free allocated memory by emscripten
SweepContext.prototype.delete = function() {
    this.cdt.delete();
};

module.exports = SweepContext;
