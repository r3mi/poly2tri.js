/*
 * Tests for the poly2tri TypeScript typings.
 *
 * Created by: Rémi Turboult <https://github.com/r3mi>
 *
 * All rights reserved.
 * Distributed under the 3-clause BSD License, see LICENSE.txt
 */

/*
 * Test global access to the UMD module, without "import"
 * ( see https://github.com/Microsoft/TypeScript/wiki/What%27s-new-in-TypeScript#support-for-umd-module-definitions )
 *
 * NOTE :
 *      This test only checks the TypeScript compilation : no code is actually run,
 *      as it is difficult to load the UMD module as a "global" library, from within the Node environment.
 */

// tslint:disable-next-line:no-reference
/// <reference path="../../src/poly2tri.d.ts" />

function used_only_for_typescript_compilation() {
    const a: string = poly2tri.VERSION;
    const contour = [
        new poly2tri.Point(100, 100),
        new poly2tri.Point(100, 300),
        new poly2tri.Point(300, 300),
        new poly2tri.Point(300, 100)
    ];
    const swctx = new poly2tri.SweepContext(contour);
    swctx.triangulate();
    const triangles = swctx.getTriangles();
    triangles.forEach((t) => {
        const p1 = t.getPoint(0);
        const p2 = t.getPoint(1);
        const p3 = t.getPoint(2);
    });
}
