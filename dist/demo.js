(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*
 * Poly2Tri Copyright (c) 2009-2014, Poly2Tri Contributors
 * http://code.google.com/p/poly2tri/
 * 
 * poly2tri.js (JavaScript port) (c) 2009-2014, Poly2Tri Contributors
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

/* jshint browser:true, jquery:true, globalstrict:true */
/* global poly2tri */


"use strict";

var Stage = require('./stage');
var parse = require("../tests/utils/parse");
var mapPairs = require("../tests/utils/mapPairs");


if (typeof $ === 'undefined') {
    window.alert("jQuery not found -- dependencies not installed ?");
    throw new Error("jQuery not loaded -- bower dependencies not installed ?");
}


function clearData() {
    $(".info").css('visibility', 'hidden');
    $("textarea").val("").change();
    $("#attribution").empty();
}

function setVisibleLayers(stage) {
    var visible = $("#draw_constraints").is(':checked');
    stage.setConstraintsVisible(visible);
}

function makePoints(floats) {
    return mapPairs(floats, function makePoint(x, y) {
        return new poly2tri.Point(x, y);
    });
}

function parsePoints(str) {
    var floats = parse.parseFloats(str);
    return makePoints(floats);
}

function countPoints(str) {
    var floats = parse.parseFloats(str);
    return Math.floor(floats.length / 2);
}

function parseHoles(str) {
    var holes = parse.parseFloatsGroups(str).map(makePoints).filter(function (points) {
        return points.length > 0;
    });
    return holes;
}

function countHoles(str) {
    var count = parse.parseFloatsGroups(str).filter(function (floats) {
        return floats.length > 1;
    }).length;
    return count;
}

function triangulate(stage) {
    stage.reset();
    $(".info").css('visibility', 'visible');

    // parse constraints
    var contour = parsePoints($("textarea#poly_contour").val());
    var holes = parseHoles($("textarea#poly_holes").val());
    var points = parsePoints($("textarea#poly_points").val());

    // perform triangulation
    var swctx;
    var error_points;
    try {
        // prepare SweepContext
        swctx = new poly2tri.SweepContext(contour, {cloneArrays: true});
        swctx.addHoles(holes).addPoints(points);

        // triangulate
        swctx.triangulate();
    } catch (e) {
        window.alert(e);
        error_points = e.points;
    }
    var triangles = swctx.getTriangles() || [];
    $("#triangles_size").text(triangles.length);

    // auto scale / translate
    var bounds = swctx.getBoundingBox();
    stage.setBoundingBox(bounds.min, bounds.max);

    // draw result
    stage.setTriangles(triangles);
    stage.setConstraints(contour, holes, points);
    if (error_points) {
        stage.setErrors(error_points);
    }
    stage.draw();
    setVisibleLayers(stage);
}


// Display pointer coordinates
function onMouseMove(e) {
    var stage = e.data;
    var pos = stage.getPointerCoordinates();
    $('#pointer_x').text(pos.x);
    $('#pointer_y').text(pos.y);
}

// Load index.json and populate 'preset' menu.
// By default, only show the entries with 'demo'=true.
// Use ?all=1 to force showing all entries.
function loadPresetMenu() {
    var $menu = $("#preset");
    var all = +($.url().param('all'));
    $menu.empty().append($('<option>', {
        text: "--Empty--"
    }));
    $.ajax({
        url: "tests/data/index.json",
        dataType: "json",
        success: function(data) {
            var options = [];
            data.forEach(function(group) {
                group.files.filter(function(file) {
                    return file.name && (file.demo || all);
                }).forEach(function(file) {
                    var text = (file.content || file.name);
                    if (file.throws) {
                        text += " (throws!)";
                    }
                    options.push($('<option>', {
                        value: file.name,
                        text: text
                    }).data("file", file).data("attrib", {
                        title: group.title,
                        source: group.source
                    }));
                });
            });
            // Sort before adding
            options.sort(function(a, b) {
                return $(a).text().localeCompare($(b).text());
            }).forEach(function(option) {
                $menu.append(option);
            });
            // Load some default data
            $menu.find("option[value='dude.dat']").attr("selected", "selected");
            $menu.change();
        }
    });
    $menu.change(function() {
        var file = $menu.find("option:selected").data("file") || {};
        var attrib = $menu.find("option:selected").data("attrib") || {};
        function load(filename, selector) {
            if (filename) {
                $.ajax({
                    url: "tests/data/" + filename,
                    success: function(data) {
                        $(selector).val(data).change();
                    }
                });
            }
        }
        clearData();
        if (attrib.title) {
            $("#attribution").html("(source: <a href='" + attrib.source + "'>" + attrib.title + "</a>)");
        }
        load(file.name, "#poly_contour");
        load(file.holes, "#poly_holes");
        load(file.steiner, "#poly_points");
    });
}

$(document).ready(function() {
    $('#version').text(poly2tri.VERSION);

    var stage = new Stage('#content');

    $("#draw_constraints").change(function() {
        setVisibleLayers(stage);
        stage.draw();
    });

    // Display pointer coordinates
    $('#content').on('mousemove', stage, onMouseMove);

    // Display number of constraints
    $("textarea#poly_contour").bind('textentered', function() {
        var count = countPoints($(this).val());
        $("#contour_size").text(count);
    });
    $("textarea#poly_holes").bind('textentered', function() {
        var count = countHoles($(this).val());
        $("#holes_size").text(count);
    });
    $("textarea#poly_points").bind('textentered', function() {
        var count = countPoints($(this).val());
        $("#points_size").text(count);
    });

    $("#btnTriangulate").click(function() {
        triangulate(stage);
    });
    clearData();

    loadPresetMenu();
});


},{"../tests/utils/mapPairs":3,"../tests/utils/parse":4,"./stage":2}],2:[function(require,module,exports){
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


},{}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
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
    var floats = str.split(/[^-+eE\.\d]+/).map(parseFloat).filter(function (val) {
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
    var groups = str.split(/\n\s*\n/).map(parseFloats).filter(function (floats) {
        return floats.length > 0;
    });
    return groups;
}
exports.parseFloatsGroups = parseFloatsGroups;

},{}]},{},[1])