
poly2tri.js
===========

**Based on the paper "Sweep-line algorithm for constrained Delaunay triangulation" by V. Domiter and and B. Zalik**

    Poly2Tri Copyright (c) 2009-2013, Poly2Tri Contributors
    http://code.google.com/p/poly2tri/

[poly2tri]: http://code.google.com/p/poly2tri/
[poly2tri.js]:https://code.google.com/p/poly2tri/source/checkout?repo=javascript
[forum]: https://groups.google.com/forum/?fromgroups#!forum/poly2tri
[issue]: https://code.google.com/p/poly2tri/issues/list
[license]: LICENSE.txt


This document describes the JavaScript version of [poly2tri]. 
Officially supported langages are C++ and Java : 
[poly2tri.js] is a community based port.
You can ask support in the [forum].


poly2tri.js is distributed with the same license as other poly2tri ports : 
the revised BSD License (3-clause BSD), see [license].


Before using
------------

Since there are no input validation of the data given for triangulation you need to think about this. Poly2Tri does not support repeated points within _epsilon_.

* If you have a cyclic function that generates random points make sure you
  don't  add the same coordinate twice,
* If you are given input and aren't sure same point exist twice you need to 
  check for this yourself,
* Only simple polygons are supported. You may add holes or interior Steiner
  points,
* Interior holes must not touch other holes, nor touch the polyline boundary,
* Use the library as described in the next paragraph.
 
**Make sure you understand the preceding notice before posting an [issue].**
If you have  an issue not covered by the above, include your data-set with the problem.
 
_The only easy day was yesterday; have a nice day. Mason Green_


Library usage
-------------

The library `src/poly2tri.js` can be included directly : 
there is no mandatory dependency.
All functions and classes are scoped in the `poly2tri` namespace.

1. Initialize CDT with a simple polyline 
   (this defines the constrained edges)

        var contour = [
            new poly2tri.Point(100, 100), 
            new poly2tri.Point(100, 300), 
            new poly2tri.Point(300, 300), 
            new poly2tri.Point(300, 100)
        ];
        var swctx = new poly2tri.SweepContext(contour);
               
2.  Add holes if necessary (also simple polylines)

        var hole = [
            new poly2tri.Point(200, 200), 
            new poly2tri.Point(200, 250), 
            new poly2tri.Point(250, 250)
        ];  
        swctx.AddHole(hole);

3. Add Steiner points

        var point = new poly2tri.Point(150, 150);
        swctx.AddPoint(point);

4. Triangulate

        poly2tri.triangulate(swctx);
        var triangles = swctx.GetTriangles();

See [`index.html`](index.html) for a complete sample.


Advanced Options
----------------

### Custom Point class

poly2tri.js supports using custom point class instead of `poly2tri.Point`.
Any "Point like" object with `{x, y}` attributes is supported 
to initialize the SweepContext polylines and points
([duck typing](http://en.wikipedia.org/wiki/Duck_typing)).

        var contour = [{x:100, y:100}, {x:100, y:300}, {x:300, y:300}, {x:300, y:100}];
        var swctx = new poly2tri.SweepContext(contour);

poly2tri.js might add extra fields to the point objects when computing the
triangulation : they are prefixed with `_p2t_` to avoid collisions 
with fields in the custom class.


### Custom Point fields

The output triangles in `GetTriangles()` have vertices which are references
to the initial input points (not copies). Any custom fields in the
initial points can be retrieved in the output triangles.

        var contour = [{x:100, y:100, id:1}, {x:100, y:300, id:2}, {x:300, y:300, id:3}];
        var swctx = new poly2tri.SweepContext(contour);
        poly2tri.triangulate(swctx);
        var triangles = swctx.GetTriangles();
        typeof triangles[0].getPoint(0).id
        // → "number"


### poly2tri.noConflict

Reverts the `poly2tri` global object back to its original value, 
and returns a reference to this `poly2tri` object.

        var p = poly2tri.noConflict();


Displaying the samples
----------------------

Use [`index.html`](index.html) to display the result of a triangulation.
Polygon contour, holes, and Steiner points can be added.
Use any separator between points, e.g.

        100 100
        [100, 300, 300, 300]
        (300;100)
is valid data to describe 4 points.

You can get additional sample files from the `tests/data` directory.

You need a modern browser to draw the results, supporting the HTML5 `<canvas>`.



Running the automated tests
---------------------------

To run the automated tests (built using the [jasmine](http://pivotal.github.com/jasmine/) JavaScript test framework), 
simply load `tests/SpecRunner.html`.

Some of the tests load data from the `tests/data` directory, using Ajax.
If these fail in your environement due to *Access-Control-Allow-Origin*
(JavaScript will disallow access to the local file://), you will 
have to run the tests through a local web server.


Performance tests
-----------------

This [jsPerf](http://jsperf.com/poly2tri) compares the performances 
across several versions of the library.

