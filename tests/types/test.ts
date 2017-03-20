/*
 * Tests for the poly2tri TypeScript typings.
 *
 * Created by: Elemar Junior <https://github.com/elemarjr/>
 * Updated by: Rémi Turboult <https://github.com/r3mi>
 *
 * All rights reserved.
 * Distributed under the 3-clause BSD License, see LICENSE.txt
 */

import * as poly2tri from "../../src/poly2tri";


function assertEquals(actual, expected, message?: string) {
    if (actual !== expected) {
        throw new Error((message || "Assert Failed") + " actual=" + actual + " expected = " + expected);
    }
}

function version() {
    console.log("Typings for poly2tri version " + poly2tri.VERSION);
}
version();

function initializeCDT(): poly2tri.SweepContext {
    const contour = [
        new poly2tri.Point(100, 100),
        new poly2tri.Point(100, 300),
        new poly2tri.Point(300, 300),
        new poly2tri.Point(300, 100)
    ];
    const swctx = new poly2tri.SweepContext(contour);
    return swctx;
}

function addHole() {
    const swctx = initializeCDT();
    const hole = [
        new poly2tri.Point(200, 200),
        new poly2tri.Point(200, 250),
        new poly2tri.Point(250, 250)
    ];
    swctx.addHole(hole);
}
addHole();

function addHoles() {
    const swctx = initializeCDT();
    const hole1 = [
        new poly2tri.Point(200, 200),
        new poly2tri.Point(200, 250),
        new poly2tri.Point(250, 250)
    ];
    const hole2 = [
        new poly2tri.Point(110, 110),
        new poly2tri.Point(110, 120),
        new poly2tri.Point(120, 120)
    ];
    swctx.addHoles([hole1, hole2]);
}
addHoles();

function addPoint() {
    const swctx = initializeCDT();
    const point = new poly2tri.Point(150, 150);
    swctx.addPoint(point);
}
addPoint();

function addPoints() {
    const swctx = initializeCDT();
    const point1 = new poly2tri.Point(150, 150);
    const point2 = new poly2tri.Point(155, 155);
    swctx.addPoints([point1, point2]);
    swctx.addPoints([{ x: 110, y: 120 }]);
}
addPoints();

function triangulate() {
    const swctx = initializeCDT();
    swctx.triangulate();
    const triangles = swctx.getTriangles();
    assertEquals(triangles.length, 2);
    triangles.forEach((t) => {
        t.getPoints().forEach((p) => {
            console.log(p.x, p.y);
        });
        const p1 = t.getPoint(0);
        const p2 = t.getPoint(1);
        const p3 = t.getPoint(2);
    });
}
triangulate();

function xy() {
    const contour = [
        { x: 100, y: 100 },
        { x: 100, y: 300 },
        { x: 300, y: 300 },
        { x: 300, y: 100 }
    ];
    const swctx = new poly2tri.SweepContext(contour);
    swctx.triangulate();
    const triangles = swctx.getTriangles();
    assertEquals(triangles.length, 2);
}
xy();

function chaining() {
    const swctx = initializeCDT();
    const hole1 = [
        new poly2tri.Point(200, 200),
        new poly2tri.Point(200, 250),
        new poly2tri.Point(250, 250)
    ];
    const hole2 = [
        new poly2tri.Point(110, 110),
        new poly2tri.Point(110, 120),
        new poly2tri.Point(120, 120)
    ];
    const holes = [hole1, hole2];
    const point1 = new poly2tri.Point(150, 150);
    const point2 = new poly2tri.Point(155, 155);
    const points = [point1, point2, { x: 153, y: 153 }];
    const triangles = swctx.addHoles(holes).addPoints(points).triangulate().getTriangles();
    assertEquals(triangles.length, 18);
}
chaining();

function error() {
    const contour = [
        { x: 100, y: 100 },
        { x: 100, y: 300 },
        { x: 300, y: 300 },
        { x: 300, y: 100 },
        { x: 100, y: 100 }
    ];
    try {
        const swctx = new poly2tri.SweepContext(contour);
        swctx.triangulate();
        throw "should fail !";
    } catch (err) {
        assertEquals(err.constructor.name, "PointError");
        assertEquals(err.points.length, 1);
        assertEquals(err.points[0].x, 100);
        assertEquals(err.points[0].y, 100);
    }
}
error();

console.log("typings tests : OK");
