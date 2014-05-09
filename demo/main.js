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
    $(".alert").addClass("hidden");
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
    $(".alert").addClass("hidden");

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
        $("#error").text(e).parents(".alert").removeClass("hidden");
        error_points = e.points;
    }
    var triangles = swctx.getTriangles() || [];
    if (triangles.length) {
        $("#triangles_size").text(triangles.length).parents(".alert").removeClass("hidden");
    }

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

