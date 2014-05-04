poly2tri.js
===========

[![Bower version](https://badge.fury.io/bo/poly2tri.svg)](http://badge.fury.io/bo/poly2tri)
[![NPM version](https://badge.fury.io/js/poly2tri.svg)](http://badge.fury.io/js/poly2tri)

**Based on the paper "Sweep-line algorithm for constrained Delaunay triangulation" by V. Domiter and and B. Zalik**

    Poly2Tri Copyright (c) 2009-2014, Poly2Tri Contributors
    http://code.google.com/p/poly2tri/

    poly2tri.js (JavaScript port) (c) 2009-2014, Poly2Tri Contributors
    https://github.com/r3mi/poly2tri.js

[poly2tri]: http://code.google.com/p/poly2tri/
[poly2tri.js]: https://github.com/r3mi/poly2tri.js
[demo]: http://r3mi.github.io/poly2tri.js
[forum]: https://groups.google.com/forum/?fromgroups#!forum/poly2tri
[issue]: https://code.google.com/p/poly2tri/issues/list
[license]: LICENSE.txt
[jsPerf]: http://jsperf.com/poly2tri/3


This document describes the JavaScript version of [poly2tri]. 
Officially supported languages are C++ and Java :
[poly2tri.js] is a community based port, currently based on 
the "May 1, 2013" C++ version, with patches and JavaScript specificities.
You can ask support in the [forum].


poly2tri.js is distributed with the same license as other poly2tri ports : 
the revised BSD License (3-clause BSD), see [license].


Before using
------------

Since there are no input validation of the data given for triangulation you need to think about this. 
poly2tri does not support repeated points within _epsilon_.

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

If you want to triangulate complex or weak polygons, you will need to prepare 
your data with a polygon clipping library like 
[Javascript Clipper](http://sourceforge.net/projects/jsclipper).

You can test your dataset using the online JavaScript [demo].

> The only easy day was yesterday; have a nice day. 
> -- <cite>Mason Green</cite>


Install
-------

This module works on both Node.js and browsers.

For Node.js:

[![NPM](https://nodei.co/npm/poly2tri.png?compact=true)](https://nodei.co/npm/poly2tri/)

For browsers, using Bower:
```sh
bower install --save poly2tri
```

For browsers, manually:
```sh
wget http://r3mi.github.io/poly2tri.js/dist/poly2tri.js
```
The file `dist/poly2tri.js` can be included directly.
It is standalone and has no mandatory dependency.
Use `dist/poly2tri.min.js` for the compressed version.


Usage
-----

1. Get a reference to the library.
   Thanks to [browserify](http://browserify.org/), the module is in 
   [UMD](https://github.com/umdjs/umd) format (Universal Module Definition), 
   compatible with the various module systems:
    - CommonJS:

        ```node
        var poly2tri = require('poly2tri');
        ```
    - RequireJS:

        ```js
        require('poly2tri', function (poly2tri) {
            ...
        });
        ```
    - If you are not using a module system at all, you can access the package
      as a global variable `poly2tri` (or `window.poly2tri` in a browser).

2. Initialize CDT with a simple polyline 
   (this defines the constrained edges)

    ```js
    var contour = [
        new poly2tri.Point(100, 100),
        new poly2tri.Point(100, 300),
        new poly2tri.Point(300, 300),
        new poly2tri.Point(300, 100)
    ];
    var swctx = new poly2tri.SweepContext(contour);
    ```

3. Add holes if necessary (also simple polylines)

    ```js
    var hole = [
        new poly2tri.Point(200, 200),
        new poly2tri.Point(200, 250),
        new poly2tri.Point(250, 250)
    ];
    swctx.addHole(hole);
    // or swctx.addHoles([hole1, hole2]) for multiple holes
    ```

4. Add Steiner points if necessary
    ```js
    var point = new poly2tri.Point(150, 150);
    swctx.addPoint(point);
    // or swctx.addPoints([p1, p2, p3]) for multiple points
    ```

5. Triangulate

    ```js
    swctx.triangulate();
    var triangles = swctx.getTriangles();
    ```

6. Use results

    ```js
    triangles.forEach(function(t) {
        t.getPoints().forEach(function(p) {
            console.log(p.x, p.y);
        });
        // or t.getPoint(0), t.getPoint(1), t.getPoint(2)
    });
    ```

See [`index.html`](index.html) for a complete example.

Method calls can be chained:
    
```js
var triangles = swctx.addHoles(holes).addPoints(points).triangulate().getTriangles();
```

Advanced Options
----------------

### Error handling

The library methods throw an exception for invalid input data,
such as duplicated or collinear points.
The exception object will contain a `points` array attribute with the
faulty data, if available.


### Custom Point class

poly2tri.js supports using custom point class instead of `poly2tri.Point`.
Any "Point like" object with `{x, y}` attributes is supported 
to initialize the SweepContext polylines and points
([duck typing](http://en.wikipedia.org/wiki/Duck_typing)).

```js
var contour = [{x:100, y:100}, {x:100, y:300}, {x:300, y:300}, {x:300, y:100}];
var swctx = new poly2tri.SweepContext(contour);
```

poly2tri.js might add extra fields to the point objects when computing the
triangulation : they are prefixed with `_p2t_` to avoid collisions 
with fields in the custom class.


### Custom Point fields

The output triangles in `getTriangles()` have vertices which are references
to the initial input points (not copies). Any custom fields in the
initial points can be retrieved in the output triangles.

```js
var contour = [{x:100, y:100, id:1}, {x:100, y:300, id:2}, {x:300, y:300, id:3}];
var swctx = new poly2tri.SweepContext(contour);
swctx.triangulate();
var triangles = swctx.getTriangles();
typeof triangles[0].getPoint(0).id
// → "number"
```

### poly2tri.noConflict

Reverts the `poly2tri` global object back to its original value, 
and returns a reference to this `poly2tri` object.

```js
var p = poly2tri.noConflict();
```


Displaying the samples
----------------------

Install the dependent packages by running:
```sh
bower install
```

Use `index.html` (also available online as a [demo]) to display the result of a triangulation.
Polygon contour, holes, and Steiner points can be added.
Use any separator between points, e.g.
```
100 100
[100, 300, 300, 300]
(300;100)
```
is valid data to describe 4 points.

Some interesting samples can be interactively loaded 
using the "Load preset data" option menu.
You can get additional files from the `tests/data` directory.

You need a modern browser to draw the results, supporting the HTML5 `<canvas>`.


Development
-----------

Install the dependent packages by running:
```sh
npm install
```

The automated tests are built using [jasmine](http://pivotal.github.com/jasmine/),
both for browser and for Node.js testing.
Run the headless tests (JSHint, Node.js and PhantomJS) with:
```sh
npm test
```
Run all the browser tests (PhantomJS, Firefox and Chrome) with:
```sh
npm run test.browsers
```
Check JSHint with:
```sh
npm run jshint
```


Performance tests
-----------------

This [jsPerf] compares the performances across several versions of the module.

You can also run
```sh
npm run bench
```
