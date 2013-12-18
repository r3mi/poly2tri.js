jsPerf
======

content of the jsPerf test at
[jsperf.com/poly2tri](http://jsperf.com/poly2tri/3) 


Test case details
-----------------

### Title
poly2tri.js Triangulation


### Description
Tests the performance of the [poly2tri.js] triangulation library across versions.

[poly2tri.js]: https://github.com/r3mi/poly2tri.js


Preparation code
================

### Preparation code HTML

    <!-- latest version -->
    <script src="http://r3mi.github.io/poly2tri.js/dist/poly2tri.js">
    </script>
    <script>
      var v_tip = poly2tri.noConflict();
    </script>
    <!-- v1.2.7 -->
    <script src="http://javascript.poly2tri.googlecode.com/hg-history/1.2.7/src/poly2tri.js">
    </script>
    <script>
      var v1_2_7 = poly2tri.noConflict();
    </script>
    <!-- v1.2.0 first version with noConflict() -->
    <script src="http://javascript.poly2tri.googlecode.com/hg-history/1.2.0/src/poly2tri.js">
    </script>
    <script>
      var v1_2_0 = poly2tri.noConflict();
    </script>
    <!-- v1.1.1 2012 version + patches for Steiner points & namespace -->
    <script src="http://javascript.poly2tri.googlecode.com/hg-history/1.1.1/src/js/poly2tri.js">
    </script>
    <script>
      var v1_1_1 = js.poly2tri;
    </script>
    <script>
      function makePoints(Point, a) {
        var i, len = a.length,
            points = [];
        for (i = 0; i < len; i += 2) {
          points.push(new Point(a[i], a[i + 1]));
        }
        return points;
      }
      // polygon data : same as poly2tri issue #39
      var contour, hole1, hole2, points;
      contour = [-311, 774, -216, 418, -48, 343, 23, 318, 44, 284, 59, 262, 84, 242, 92, 161, 131, 134, 140, 77, 134, 30, 118, 6, 115, -32, 67, -85, 213, -85, 211, -53, 198, -13, 182, 63, 165, 120, 194, 137, 238, 111, 265, 5, 243, -87, 502, -93, 446, 772];
      hole1 = [-276, 747, 421, 745, 473, -65, 276, -61, 291, 2, 291, 8, 262, 123, 256, 131, 201, 163, 186, 163, 155, 145, 150, 152, 118, 175, 110, 250, 105, 259, 78, 281, 66, 299, 43, 335, 36, 341, -37, 367, -37, 368, -193, 438];
      hole2 = [161, 32, 172, -19, 171, -20, 184, -58, 127, -58, 138, -46, 141, -38, 144, -2, 157, 17, 160, 23];
      points = [148, 127, 161, 70, 157, 82, 152, 98, 160, 35, 115, -58, 160, 65, 149, 117, -205, 428, -44, 356, 29, 330, 32, 326, 55, 292, 69, 271, 94, 251, 96, 245, 104, 169, 141, 143, 143, 138, 153, 78, 153, 75, 146, 26, 131, 2, 127, -35, 126, -39, 97, -72, 199, -72, 198, -57, 184, -16, 169, 59, 150, 120, 153, 129, 190, 150, 197, 150, 247, 121, 250, 116, 278, 6, 278, 3, 260, -74, 488, -80, 434, 759, -294, 761];
    </script>


### Define setup for all tests

    function triangulate(P) {
      var c = makePoints(P.Point, contour);
      var h1 = makePoints(P.Point, hole1);
      var h2 = makePoints(P.Point, hole2);
      var p = makePoints(P.Point, points);
      var swctx = new P.SweepContext(c);
      swctx.AddHole(h1);
      swctx.AddHole(h2);
      p.forEach(function(point) {
        swctx.AddPoint(point);
      });
      P.sweep.Triangulate(swctx);
      var t = swctx.GetTriangles();
    }


Code snippets to compare
========================

Test 1
------

### Title 
v1.1.1

### Code 
    triangulate(v1_1_1);


Test 2
------

### Title 
v1.2.0

### Code
    triangulate(v1_2_0);


Test 3
------

### Title 
v1.2.7

### Code
    triangulate(v1_2_7);


Test 4
------

### Title 
vtip (latest)

### Code
    triangulate(v_tip);
