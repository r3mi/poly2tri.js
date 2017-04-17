/*
 * Tests for the poly2tri TypeScript typings.
 *
 * Created by: Elemar Junior <https://github.com/elemarjr/>
 * Updated by: Rémi Turboult <https://github.com/r3mi>
 *
 * All rights reserved.
 * Distributed under the 3-clause BSD License, see LICENSE.txt
 */

import "jasmine";
import * as poly2tri from "../../src/poly2tri";

describe("poly2tri.d.ts", () => {

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

    it("should have VERSION", () => {
        expect(poly2tri.VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it("should have addHole", () => {
        const swctx = initializeCDT();
        const hole = [
            new poly2tri.Point(200, 200),
            new poly2tri.Point(200, 250),
            new poly2tri.Point(250, 250)
        ];
        swctx.addHole(hole);
        expect(swctx).toBeTruthy();
    });

    it("should have addHoles", () => {
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
        expect(swctx).toBeTruthy();
    });

    it("should have addPoint", () => {
        const swctx = initializeCDT();
        const point = new poly2tri.Point(150, 150);
        swctx.addPoint(point);
        expect(swctx).toBeTruthy();
    });

    it("should have addPoints", () => {
        const swctx = initializeCDT();
        const point1 = new poly2tri.Point(150, 150);
        const point2 = new poly2tri.Point(155, 155);
        swctx.addPoints([point1, point2]);
        swctx.addPoints([{ x: 110, y: 120 }]);
        expect(swctx).toBeTruthy();
    });

    it("should triangulate", () => {
        const swctx = initializeCDT();
        swctx.triangulate();
        const triangles = swctx.getTriangles();
        expect(triangles.length).toBe(2);
        triangles.forEach((t) => {
            t.getPoints().forEach((p) => {
                expect(typeof p.x).toBe("number");
                expect(typeof p.y).toBe("number");
            });
            expect(t.getPoint(0)).toBeTruthy();
            expect(t.getPoint(1)).toBeTruthy();
            expect(t.getPoint(2)).toBeTruthy();
        });
    });

    it("should allow XY", () => {
        const contour = [
            { x: 100, y: 100 },
            { x: 100, y: 300 },
            { x: 300, y: 300 },
            { x: 300, y: 100 }
        ];
        const swctx = new poly2tri.SweepContext(contour);
        swctx.triangulate();
        const triangles = swctx.getTriangles();
        expect(triangles.length).toBe(2);
    });

    it("should allow chaining", () => {
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
        expect(triangles.length).toBe(18);
    });

    it("should raise PointError", () => {
        const contour = [
            { x: 100, y: 100 },
            { x: 100, y: 300 },
            { x: 300, y: 300 },
            { x: 300, y: 100 },
            { x: 100, y: 100 }
        ];
        expect(() => {
            const swctx = new poly2tri.SweepContext(contour);
            swctx.triangulate();
        }).toThrowError(poly2tri.PointError);
        try {
            const swctx = new poly2tri.SweepContext(contour);
            swctx.triangulate();
        } catch (err) {
            expect(err.points.length).toBe(1);
            expect(err.points[0].x).toBe(100);
            expect(err.points[0].y).toBe(100);
        }
    });

});
