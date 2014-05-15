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
/* global poly2tri, Kinetic */


"use strict";

var parse = require("../tests/utils/parse");
var mapPairs = require("../tests/utils/mapPairs");


if (typeof $ === 'undefined') {
    window.alert("jQuery not found -- dependencies not installed ?");
    throw new Error("jQuery not loaded -- bower dependencies not installed ?");
}

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


function clearData() {
    $(".info").css('visibility', 'hidden');
    $("textarea").val("");
    $("#attribution").empty();
}

function setVisibleLayers(stage) {
    var visible = $("#draw_constraints").is(':checked');
    stage.find('.constraints').each(function(layer) {
        layer.setVisible(visible);
    });
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

function parseHoles(str) {
    var holes = parse.parseFloatsGroups(str).map(makePoints).filter(function (points) {
        return points.length > 0;
    });
    return holes;
}

// XXX why is it needed ? normally KineticJS should accept our {x,y} objects,
// but it doesn't work in practice.
function makeKineticPoints(points) {
    return points.map(function(point) {
        return [point.x, point.y];
    });
}

// Helper to override Kinetic.Shape.draw in order to have fixed width strokes 
// or radius, independently of scale 
// (strokeScaleEnabled = false doesn't give the expected result)
function provideFixedLineWidth(shape, setLineWidth) {
    var originalDrawFunc = shape.getDrawFunc();
    shape.setDrawFunc(function() {
        var linescale = 1 / this.getStage().getScaleX();
        setLineWidth.call(this, linescale);
        originalDrawFunc.apply(this, arguments);
    });
}


function drawTriangles(stage, triangles) {
    var layer = new Kinetic.Layer({name: "triangles"});
    triangles.forEach(function(t) {
        var triangle = new Kinetic.Polygon({
            points: makeKineticPoints(t.getPoints()),
            fill: TRIANGLE_FILL_COLOR,
            stroke: TRIANGLE_STROKE_COLOR
        });
        provideFixedLineWidth(triangle, function(linescale) {
            this.setStrokeWidth(TRIANGLE_STROKE_WIDTH * linescale);
        });
        layer.add(triangle);
    });
    stage.add(layer);
}

function drawConstraints(stage, contour, holes, points) {
    var layer = new Kinetic.Layer({name: "constraints"});

    var polygon = new Kinetic.Polygon({
        points: makeKineticPoints(contour),
        stroke: CONSTRAINT_COLOR,
        dashArrayEnabled: true
    });
    provideFixedLineWidth(polygon, function(linescale) {
        this.setStrokeWidth(CONSTRAINT_STROKE_WIDTH * linescale);
        var dashArray = CONSTRAINT_DASH_ARRAY.map(function(dash) {
            return dash * linescale;
        });
        this.setDashArray(dashArray);
    });
    layer.add(polygon);

    holes.forEach(function(hole) {
        var polygon = new Kinetic.Polygon({
            points: makeKineticPoints(hole),
            stroke: CONSTRAINT_COLOR,
            dashArrayEnabled: true
        });
        provideFixedLineWidth(polygon, function(linescale) {
            this.setStrokeWidth(CONSTRAINT_STROKE_WIDTH * linescale);
            var dashArray = CONSTRAINT_DASH_ARRAY.map(function(dash) {
                return dash * linescale;
            });
            this.setDashArray(dashArray);
        });
        layer.add(polygon);
    });

    points.forEach(function(point) {
        var circle = new Kinetic.Circle({
            x: point.x,
            y: point.y,
            fill: CONSTRAINT_COLOR
        });
        provideFixedLineWidth(circle, function(linescale) {
            this.setRadius(CONSTRAINT_STROKE_WIDTH * linescale);
        });
        layer.add(circle);
    });

    stage.add(layer);
}

function drawErrors(stage, error_points) {
    var layer = new Kinetic.Layer({name: "errors"});
    error_points.forEach(function(point) {
        var circle = new Kinetic.Circle({
            x: point.x,
            y: point.y,
            fill: ERROR_COLOR
        });
        provideFixedLineWidth(circle, function(linescale) {
            this.setRadius(ERROR_RADIUS * linescale);
        });
        layer.add(circle);
    });
    stage.add(layer);
}

function triangulate(stage) {
    // clear the canvas
    stage.destroyChildren();
    // reset drag
    stage.setAbsolutePosition(0, 0);
    $(".info").css('visibility', 'visible');

    // parse contour
    var contour = parsePoints($("textarea#poly_contour").val());
    $("#contour_size").text(contour.length);

    // parse holes
    var holes = parseHoles($("textarea#poly_holes").val());
    $("#holes_size").text(holes.length);

    // parse points
    var points = parsePoints($("textarea#poly_points").val());
    $("#points_size").text(points.length);

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
    var xscale = (stage.getWidth() - 2 * CANVAS_MARGIN) / (bounds.max.x - bounds.min.x);
    var yscale = (stage.getHeight() - 2 * CANVAS_MARGIN) / (bounds.max.y - bounds.min.y);
    var scale = Math.min(xscale, yscale);
    // CANVAS_MARGIN is fixed and needs to be unscaled
    stage.setOffset(bounds.min.x - CANVAS_MARGIN / scale, bounds.min.y - CANVAS_MARGIN / scale);
    stage.setScale(scale);

    var base = new Kinetic.Layer({name: "base"});
    stage.add(base);

    // draw result
    drawTriangles(stage, triangles);
    drawConstraints(stage, contour, holes, points);
    if (error_points) {
        drawErrors(stage, error_points);
    }
    stage.draw();
    setVisibleLayers(stage);
}

// Adapted from "Zoom to point and scale (kineticjs+mousewheel)"
// http://nightlycoding.com/index.php/2013/08/zoom-to-point-and-scale-kineticjsmousewheel/
function onMouseWheel(e, delta) {
    //prevent the actual wheel movement
    e.preventDefault();

    var stage = e.data;
    var scale = stage.getScaleX(); // scaleX === scaleY in this app

    // Change scale by +/- 10%
    // ("delta" has been normalized at +/-1 by the jquery-mousewheel plugin).
    var new_scale = scale * (1 + delta * 0.1);

    if (new_scale > 0.0) {
        var pointer = stage.getPointerPosition();
        var stage_pos = stage.getAbsolutePosition();
        var x = pointer.x - (pointer.x - stage_pos.x) / scale * new_scale;
        var y = pointer.y - (pointer.y - stage_pos.y) / scale * new_scale;
        stage.setPosition(x, y);
        stage.setScale(new_scale);
        stage.draw();
    }
}

// Display pointer coordinates
function onMouseMove(e) {
    var stage = e.data;
    var pointer = stage.getPointerPosition();
    var stage_pos = stage.getAbsolutePosition();
    var x = (pointer.x - stage_pos.x) / stage.getScaleX() + stage.getOffsetX();
    var y = (pointer.y - stage_pos.y) / stage.getScaleY() + stage.getOffsetY();
    var digits = Math.min(stage.getScaleX() / 10, 5);
    $('#pointer_x').text(x.toFixed(digits));
    $('#pointer_y').text(y.toFixed(digits));
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
                        $(selector).val(data);
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

    var $content = $('#content');
    var stage = new Kinetic.Stage({
        container: $content[0],
        width: $content.width(),
        height: $content.height(),
        // Don't listen to events : avoid performance problems with mousemove on Firefox
        listening: false,
        draggable: true
    });

    $(window).resize(function() {
        stage.setSize($content.width(), $content.height());
    });

    $("#draw_constraints").change(function() {
        setVisibleLayers(stage);
        stage.draw();
    });

    // Zoom to point and scale
    $content.on('mousewheel', stage, onMouseWheel);

    // Display pointer coordinates
    $content.on('mousemove', stage, onMouseMove);

    $("#btnTriangulate").click(function() {
        triangulate(stage);
    });
    clearData();

    loadPresetMenu();
});


},{"../tests/utils/mapPairs":2,"../tests/utils/parse":3}],2:[function(require,module,exports){
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