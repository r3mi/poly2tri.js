/*
 * Display poly2tri results in the browser.
 * Facade for the Kinetic Stage.
 *
 * (c) 2014, Rémi Turboult
 * All rights reserved.
 * Distributed under the 3-clause BSD License, see LICENSE.txt
 */


/* jshint browser:true, jquery:true, globalstrict:true */
/* global Kinetic */


"use strict";

// Styles
var TRIANGLE_FILL_COLOR = "#e0c4ef";
var TRIANGLE_STROKE_COLOR = "#911ccd";
var TRIANGLE_STROKE_WIDTH = 1;
var CONSTRAINT_COLOR = "rgba(0,0,0,0.6)";
var CONSTRAINT_DASH_ARRAY = [10, 5];
var CONSTRAINT_STROKE_WIDTH = 4;
var ERROR_COLOR = "rgba(255,0,0,0.8)";
var ERROR_RADIUS = 4;
var CANVAS_MARGIN = 5;


// Adapted from "Zoom to point and scale (kineticjs+mousewheel)"
// http://nightlycoding.com/index.php/2013/08/zoom-to-point-and-scale-kineticjsmousewheel/
function onMouseWheel(e, delta) {
    //prevent the actual wheel movement
    e.preventDefault();

    var kStage = e.data;
    var scale = kStage.getScaleX(); // scaleX === scaleY in this app

    // Change scale by +/- 10%
    // ("delta" has been normalized at +/-1 by the jquery-mousewheel plugin).
    var new_scale = scale * (1 + delta * 0.1);

    if (new_scale > 0.0) {
        var pointer = kStage.getPointerPosition();
        var stage_pos = kStage.getAbsolutePosition();
        var x = pointer.x - (pointer.x - stage_pos.x) / scale * new_scale;
        var y = pointer.y - (pointer.y - stage_pos.y) / scale * new_scale;
        kStage.setPosition(x, y);
        kStage.setScale(new_scale);
        kStage.draw();
    }
}


/**
 * Create a new stage
 * @param selector - jQuery selector for the container
 * @constructor
 */
var Stage = function (selector) {

    var $container = $(selector);
    var kStage = new Kinetic.Stage({
        container: $container[0],
        width: $container.width(),
        height: $container.height(),
        // Don't listen to events : avoid performance problems with mousemove on Firefox
        listening: false,
        draggable: true
    });
    this.kStage = kStage;

    $(window).resize(function () {
        kStage.setSize($container.width(), $container.height());
    });

    // Zoom to point and scale
    $container.on('mousewheel', kStage, onMouseWheel);
};


// XXX why is it needed ? normally KineticJS should accept our {x,y} objects,
// but it doesn't work in practice.
function makeKineticPoints(points) {
    return points.map(function (point) {
        return [point.x, point.y];
    });
}


// Helper to override Kinetic.Shape.draw in order to have fixed width strokes
// or radius, independently of scale
// (strokeScaleEnabled = false doesn't give the expected result)
function provideFixedLineWidth(shape, setLineWidth) {
    var originalDrawFunc = shape.getDrawFunc();
    shape.setDrawFunc(function () {
        var lineScale = 1 / this.getStage().getScaleX();
        setLineWidth.call(this, lineScale);
        originalDrawFunc.apply(this, arguments);
    });
}


/**
 * Clear and reset stage
 */
Stage.prototype.reset = function () {
    // clear the canvas
    this.kStage.destroyChildren();

    // reset drag
    this.kStage.setAbsolutePosition(0, 0);
};


/**
 * Auto scale / translate stage to contain the bounding box
 * @param {XY} min - smallest coordinates
 * @param {XY} max - biggest coordinates
 */
Stage.prototype.setBoundingBox = function (min, max) {
    var kStage = this.kStage;

    // auto scale / translate
    var xScale = (kStage.getWidth() - 2 * CANVAS_MARGIN) / (max.x - min.x);
    var yScale = (kStage.getHeight() - 2 * CANVAS_MARGIN) / (max.y - min.y);
    var scale = Math.min(xScale, yScale);
    // CANVAS_MARGIN is fixed and needs to be unscaled
    kStage.setOffset(min.x - CANVAS_MARGIN / scale, min.y - CANVAS_MARGIN / scale);
    kStage.setScale(scale);
};


/**
 * Get pointer position in scene coordinates
 * @returns {{x:string,y:string}} formatted coordinates
 */
Stage.prototype.getPointerCoordinates = function () {
    var kStage = this.kStage;
    var pointer = kStage.getPointerPosition();
    var stage_pos = kStage.getAbsolutePosition();
    var x = (pointer.x - stage_pos.x) / kStage.getScaleX() + kStage.getOffsetX();
    var y = (pointer.y - stage_pos.y) / kStage.getScaleY() + kStage.getOffsetY();
    var digits = Math.min(kStage.getScaleX() / 10, 5);
    return {x: x.toFixed(digits), y: y.toFixed(digits)};
};


/**
 * Draw triangles
 * @param {Array.<Triangle>} triangles
 */
Stage.prototype.setTriangles = function (triangles) {
    var layer = new Kinetic.Layer({name: "triangles"});
    triangles.forEach(function (t) {
        var triangle = new Kinetic.Polygon({
            points: makeKineticPoints(t.getPoints()),
            fill: TRIANGLE_FILL_COLOR,
            stroke: TRIANGLE_STROKE_COLOR
        });
        provideFixedLineWidth(triangle, function (linescale) {
            this.setStrokeWidth(TRIANGLE_STROKE_WIDTH * linescale);
        });
        layer.add(triangle);
    });
    this.kStage.add(layer);
};


/**
 * Draw constraints
 * @param {Array.<XY>} contour
 * @param {Array.<Array.<XY>>} holes
 * @param {Array.<XY>} points
 */
Stage.prototype.setConstraints = function (contour, holes, points) {
    var layer = new Kinetic.Layer({name: "constraints"});

    var polygon = new Kinetic.Polygon({
        points: makeKineticPoints(contour),
        stroke: CONSTRAINT_COLOR,
        dashArrayEnabled: true
    });
    provideFixedLineWidth(polygon, function (lineScale) {
        this.setStrokeWidth(CONSTRAINT_STROKE_WIDTH * lineScale);
        var dashArray = CONSTRAINT_DASH_ARRAY.map(function (dash) {
            return dash * lineScale;
        });
        this.setDashArray(dashArray);
    });
    layer.add(polygon);

    holes.forEach(function (hole) {
        var polygon = new Kinetic.Polygon({
            points: makeKineticPoints(hole),
            stroke: CONSTRAINT_COLOR,
            dashArrayEnabled: true
        });
        provideFixedLineWidth(polygon, function (lineScale) {
            this.setStrokeWidth(CONSTRAINT_STROKE_WIDTH * lineScale);
            var dashArray = CONSTRAINT_DASH_ARRAY.map(function (dash) {
                return dash * lineScale;
            });
            this.setDashArray(dashArray);
        });
        layer.add(polygon);
    });

    points.forEach(function (point) {
        var circle = new Kinetic.Circle({
            x: point.x,
            y: point.y,
            fill: CONSTRAINT_COLOR
        });
        provideFixedLineWidth(circle, function (lineScale) {
            this.setRadius(CONSTRAINT_STROKE_WIDTH * lineScale);
        });
        layer.add(circle);
    });

    this.kStage.add(layer);
};


/**
 * Show or hide constraints
 * @param {boolean} visible
 */
Stage.prototype.setConstraintsVisible = function (visible) {
    this.kStage.find('.constraints').each(function (layer) {
        layer.setVisible(visible);
    });
};


/**
 * Draw errors
 * @param {Array.<XY>} error_points
 */
Stage.prototype.setErrors = function (error_points) {
    var layer = new Kinetic.Layer({name: "errors"});
    error_points.forEach(function (point) {
        var circle = new Kinetic.Circle({
            x: point.x,
            y: point.y,
            fill: ERROR_COLOR
        });
        provideFixedLineWidth(circle, function (lineScale) {
            this.setRadius(ERROR_RADIUS * lineScale);
        });
        layer.add(circle);
    });
    this.kStage.add(layer);
};


/**
 * Draw stage
 */
Stage.prototype.draw = function () {
    this.kStage.draw();
};


module.exports = Stage;

