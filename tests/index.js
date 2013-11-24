/*
 * Poly2Tri Copyright (c) 2009-2013, Poly2Tri Contributors
 * http://code.google.com/p/poly2tri/
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

// Colors
var TRIANGLE_FILL_STYLE = "#e0c4ef";
var TRIANGLE_STROKE_STYLE = "#911ccd";
var CONSTRAINT_STYLE = "rgba(0,0,0,0.6)";
var ERROR_STYLE = "rgba(255,0,0,0.8)";


function clearData() {
    $(".info").css('visibility', 'hidden');
    $("textarea").val("");
    $("#attribution").empty();
}

function parsePoints(str) {
    var floats = str.split(/[^-eE\.\d]+/).filter(function(val) {
        return val;
    }).map(parseFloat);
    var i, points = [];
    // bitwise 'and' to ignore any isolated float at the end
    /* jshint bitwise:false */
    for (i = 0; i < (floats.length & 0x7FFFFFFE); i += 2) {
        points.push(new poly2tri.Point(floats[i], floats[i + 1]));
    }
    return points;
}

function polygonPath(ctx, points) {
    ctx.beginPath();
    points.forEach(function(point, index) {
        if (index === 0) {
            ctx.moveTo(point.x, point.y);
        } else {
            ctx.lineTo(point.x, point.y);
        }
    });
    ctx.closePath();
}

function triangulate(ctx) {
    //
    var contour = [];
    var holes = [];
    var points = [];
    var bounds, xscale, yscale, scale, linescale;
    var error_points;
    var triangles;
    var swctx;
    var MARGIN = 5;

    // clear the canvas
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    $(".info").css('visibility', 'visible');

    // parse contour
    contour = parsePoints($("textarea#poly_contour").val());
    $("#contour_size").text(contour.length);

    // parse holes
    $("textarea#poly_holes").val().split(/\n\s*\n/).forEach(function(val) {
        var hole = parsePoints(val);
        if (hole.length > 0) {
            holes.push(hole);
        }
    });
    $("#holes_size").text(holes.length);

    // parse points
    points = parsePoints($("textarea#poly_points").val());
    $("#points_size").text(points.length);

    try {
        // prepare SweepContext
        swctx = new poly2tri.SweepContext(contour, {cloneArrays: true});
        holes.forEach(function(hole) {
            swctx.addHole(hole);
        });
        swctx.addPoints(points);

        // triangulate
        swctx.triangulate();
    } catch (e) {
        window.alert(e);
        error_points = e.points;
    }
    triangles = swctx.getTriangles() || [];
    $("#triangles_size").text(triangles.length);

    // auto scale / translate
    bounds = swctx.getBoundingBox();
    xscale = (ctx.canvas.width - 2 * MARGIN) / (bounds.max.x - bounds.min.x);
    yscale = (ctx.canvas.height - 2 * MARGIN) / (bounds.max.y - bounds.min.y);
    scale = Math.min(xscale, yscale);
    ctx.translate(MARGIN, MARGIN);
    ctx.scale(scale, scale);
    ctx.translate(-bounds.min.x, -bounds.min.y);
    linescale = 1 / scale;

    // draw result
    ctx.lineWidth = linescale;
    ctx.fillStyle = TRIANGLE_FILL_STYLE;
    ctx.strokeStyle = TRIANGLE_STROKE_STYLE;
    ctx.setLineDash([]);

    triangles.forEach(function(t) {
        polygonPath(ctx, [t.getPoint(0), t.getPoint(1), t.getPoint(2)]);
        ctx.fill();
        ctx.stroke();
    });

    // draw constraints
    if ($("#draw_constraints").attr('checked')) {
        ctx.lineWidth = 4 * linescale;
        ctx.strokeStyle = CONSTRAINT_STYLE;
        ctx.fillStyle = CONSTRAINT_STYLE;
        ctx.setLineDash([10 * linescale, 5 * linescale]);

        polygonPath(ctx, contour);
        ctx.stroke();

        holes.forEach(function(hole) {
            polygonPath(ctx, hole);
            ctx.stroke();
        });

        points.forEach(function(point) {
            ctx.beginPath();
            ctx.arc(point.x, point.y, ctx.lineWidth, 0, 2 * Math.PI, false);
            ctx.closePath();
            ctx.fill();
        });
    }

    // highlight errors, if any
    if (error_points) {
        ctx.lineWidth = 4 * linescale;
        ctx.fillStyle = ERROR_STYLE;
        error_points.forEach(function(point) {
            ctx.beginPath();
            ctx.arc(point.x, point.y, ctx.lineWidth, 0, 2 * Math.PI, false);
            ctx.closePath();
            ctx.fill();
        });
    }
}

$(document).ready(function() {
    var $canvas = $('#canvas');
    var ctx = $canvas[0].getContext('2d');
    ctx.canvas.width = $canvas.width();
    ctx.canvas.height = $canvas.height();

    if (typeof ctx.setLineDash === "undefined") {
        ctx.setLineDash = function(a) {
            ctx.mozDash = a;
        };
    }

    $("#btnTriangulate").click(function() {
        triangulate(ctx);
    });
    clearData();

    // Load index.json and populate 'preset' menu
    $("#preset").empty().append($('<option>', {
        text: "--Empty--"
    }));
    $.ajax({
        url: "tests/data/index.json",
        dataType: "json",
        success: function(data) {
            var options = [];
            data.forEach(function(group) {
                group.files.filter(function(file) {
                    return file.name && file.content;
                }).forEach(function(file) {
                    options.push($('<option>', {
                        value: file.name,
                        text: (file.content || file.name)
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
                $("#preset").append(option);
            });
            // Load some default data
            $("#preset option[value='dude.dat']").attr("selected", "selected");
            $("#preset").change();
        }
    });
    $("#preset").change(function() {
        var file = $("#preset option:selected").data("file") || {};
        var attrib = $("#preset option:selected").data("attrib") || {};
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
});

