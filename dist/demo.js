(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*
 * poly2tri.js demo.
 * Main AngularJS module.
 *
 * (c) 2014, Rémi Turboult
 * All rights reserved.
 * Distributed under the 3-clause BSD License, see LICENSE.txt
 */

/* jshint browser:true, globalstrict:true */
/* global angular */


"use strict";


if (typeof angular === 'undefined') {
    window.alert("AngularJS not found -- dependencies not installed ?");
    throw new Error("AngularJS not loaded -- bower dependencies not installed ?");
}


var parse = require("../tests/utils/parse");
var mapPairs = require("../tests/utils/mapPairs");
var find = require('array-find');

// AngularJS main
var app = angular.module('demo', [
    require("./files").name,
    require("./triangulation").name,
    require("./stage").name
]);


app.controller('poly2triCtrl', ['$scope', 'poly2tri', function ($scope, poly2tri) {
    $scope.poly2tri = poly2tri;
}]);


function makePoints(floats) {
    return mapPairs(floats, function makePoint(x, y) {
        // XXX return new poly2tri.Point(x, y);
        return {x: x, y: y};
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


app.config(function ($locationProvider) {
    // Get rid of #! before search parameters, in compatible browsers.
    // See http://stackoverflow.com/a/16678065
    $locationProvider.html5Mode(true);
});


/**
 * Global controller : manages constraints, performs triangulation
 * XXX separate controllers ?
 */
app.controller('demoCtrl', function ($scope, filesPromise, triangulate, $window) {
    var self = this;
    filesPromise.then(function (data) {
        self.files = data;
        self.file = find(data, function (element) {
            return element.holes === 'dude_holes.dat';
        });
    });
    this.text = $scope.textConstraints = {
        /** @type {string} */
        contour: null,
        /** @type {string} */
        holes: null,
        /** @type {string} */
        points: null
    };
    this.parsed = $scope.parsedConstraints = {
        contour: null,
        holes: null,
        points: null
    };

    /**
     * Watch text areas, to parse constraints.
     *      contour.text => parsePoints => contour.parsed
     *      holes.text => parseHoles => holes.parsed
     *      points.text => parsePoints => points.parsed
     * @param {string} scopeProperty
     * @param {function} parseFn
     */
        // XXX to replace with Custom Validations ??
        // XXX see NgModelController and https://docs.angularjs.org/guide/forms
        //
        // XXX add Non-immediate (debounced) model updates ??
        // XXX see ngModelOptions and https://docs.angularjs.org/guide/forms
    function watch(scopeProperty, parseFn) {
        $scope.$watch('textConstraints.' + scopeProperty, function (text) {
            $scope.parsedConstraints[scopeProperty] = parseFn(text);
        });
    }

    watch('contour', parsePoints);
    watch('holes', parseHoles);
    watch('points', parsePoints);

    this.triangulate = function () {
        var result = triangulate(self.parsed);
        self.result = result;
        if (result.error) {
            // XXX move in View
            $window.alert(result.error);
        }
    };
});

},{"../tests/utils/mapPairs":6,"../tests/utils/parse":7,"./files":2,"./stage":3,"./triangulation":4,"array-find":5}],2:[function(require,module,exports){
/*
 * poly2tri.js demo.
 * File loading AngularJS module.
 *
 * (c) 2014, Rémi Turboult
 * All rights reserved.
 * Distributed under the 3-clause BSD License, see LICENSE.txt
 */

/* jshint node:true */
/* global angular */


"use strict";

module.exports = angular.module('files', [ ])
    .constant('DATA_URL', "tests/data")
/**
 * List of files.
 * Load index.json and return a Promise for the asynchronously loaded data.
 * By default, only show the entries with 'demo'=true.
 * Use ?all=1 to force showing all entries.
 */
    .factory('filesPromise', function ($http, $location, DATA_URL) {
        return $http.get(DATA_URL + "/index.json").then(function (res) {
            var showAll = +($location.search().all);
            var files = [];
            res.data.forEach(function (group) {
                group.files.filter(function (file) {
                    return file.name && (file.demo || showAll);
                }).forEach(function (file) {
                    file.title = group.title;
                    file.source = group.source;
                    file.label = (file.content || file.name);
                    files.push(file);
                });
            });
            return files;
        });
    })
/**
 * Service to load a data file and return a Promise for the asynchronously loaded data.
 */
    .factory('loadData', function ($http, DATA_URL, $log) {
        return function (filename) {
            // XXX if filename ??
            return $http.get(DATA_URL + "/" + filename, {
                // Avoid the default toJSON transformation
                transformResponse: null
            }).then(function (res) {
                $log.debug("loaded=", res);
                return res.data;
            });
        };
    })
/**
 * Initialize an input field with the content of a file
 */
    .directive('initFromFile', function (loadData) {
        return {
            restrict: 'A',
            require: 'ngModel',
            scope: {
                filename: '=initFromFile',
                model: '=ngModel'
            },
            link: function (scope /*XXX, element, attrs, ngModel*/) {
                scope.$watch('filename', function (filename) {
                    scope.model = "";
                    if (filename) {
                        loadData(filename).then(function (data) {
                            scope.model = data;
                        });
                    }
                });
            }
        };
    });

},{}],3:[function(require,module,exports){
/*
 * Display poly2tri results in the browser.
 * Angular facade for the Kinetic Stage.
 *
 * (c) 2014, Rémi Turboult
 * All rights reserved.
 * Distributed under the 3-clause BSD License, see LICENSE.txt
 */

/* jshint node:true */
/* global angular */


"use strict";

module.exports = angular.module('stage', [ ])

/**
 * KineticJS library
 */
    .value('Kinetic', Kinetic) // jshint ignore:line

/**
 * Stage styles
 */
    .constant('STAGE_STYLES', {
        TRIANGLE_FILL_COLOR: "#e0c4ef",
        TRIANGLE_STROKE_COLOR: "#911ccd",
        TRIANGLE_STROKE_WIDTH: 1,
        CONSTRAINT_COLOR: "rgba(0,0,0,0.6)",
        CONSTRAINT_DASH_ARRAY: [10, 5],
        CONSTRAINT_STROKE_WIDTH: 4,
        ERROR_COLOR: "rgba(255,0,0,0.8)",
        ERROR_RADIUS: 4,
        CANVAS_MARGIN: 5
    })

/**
 * KineticJS Stage factory
 */
    .factory('Stage', function (Kinetic, $window, STAGE_STYLES) {
        /**
         * Stage class : facade for the Kinetic Stage
         *
         * Create a new stage
         * @param {angular.element} $container - jQuery/jqLite element for the parent container
         * @constructor
         */
        var Stage = function ($container) {
            var self = this;

            // XXX remove jQuery code
            // XXX also in bower_components and bower.json

            var kStage = new Kinetic.Stage({
                container: $container[0],
                width: $container.width(),
                height: $container.height(),
                // Don't listen to events : avoid performance problems with mousemove on Firefox
                listening: false,
                draggable: true
            });
            this.kStage = kStage;

            angular.element($window).on('resize', function () {
                kStage.setSize($container.width(), $container.height());
            });

            // Zoom to point and scale
            // ("delta" has been normalized at +/-1 by the jquery-mousewheel plugin).
            $container.on('mousewheel', function onMouseWheel(e, delta) {
                //prevent the actual wheel movement
                e.preventDefault();
                self.zoomOnPointer(delta);
            });
        };


        // XXX why is it needed ? normally KineticJS should accept our {x,y} objects,
        // but it doesn't work in practice.
        function makeKineticPoints(points) {
            return points.map(function (point) {
                return [point.x, point.y];
            });
        }


        /**
         * Helper to override Kinetic.Shape.draw in order to have fixed width strokes
         * or radius, independently of scale
         * (strokeScaleEnabled = false doesn't give the expected result)
         */
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
            var MARGIN = STAGE_STYLES.CANVAS_MARGIN;

            // auto scale / translate
            var xScale = (kStage.getWidth() - 2 * MARGIN) / (max.x - min.x);
            var yScale = (kStage.getHeight() - 2 * MARGIN) / (max.y - min.y);
            var scale = Math.min(xScale, yScale);
            // CANVAS_MARGIN is fixed and needs to be unscaled
            kStage.setOffset(min.x - MARGIN / scale, min.y - MARGIN / scale);
            kStage.setScale(scale);
        };


        /**
         * Get pointer position in scene coordinates
         * @returns {{x:string,y:string}} formatted coordinates
         */
        Stage.prototype.getPointerCoordinates = function () {
            var kStage = this.kStage;
            var pointer = kStage.getPointerPosition();
            if (pointer) { // can be undefined
                var stage_pos = kStage.getAbsolutePosition();
                var x = (pointer.x - stage_pos.x) / kStage.getScaleX() + kStage.getOffsetX();
                var y = (pointer.y - stage_pos.y) / kStage.getScaleY() + kStage.getOffsetY();
                var digits = Math.min(kStage.getScaleX() / 10, 5);
                return {x: x.toFixed(digits), y: y.toFixed(digits)};
            }
            return null;
        };


        /**
         * Zoom the stage (relatively to the current zoom), centered on the pointer position.
         * Adapted from "Zoom to point and scale (kineticjs+mousewheel)"
         *      http://nightlycoding.com/index.php/2013/08/zoom-to-point-and-scale-kineticjsmousewheel/
         * @param {number} delta - zoom increment, in steps of +/-1
         */
        Stage.prototype.zoomOnPointer = function (delta) {
            var kStage = this.kStage;
            var scale = kStage.getScaleX(); // scaleX === scaleY in this app

            // Change scale by +/- 10%
            var new_scale = scale * (1 + delta * 0.1);
            var pointer = kStage.getPointerPosition();
            if (new_scale > 0.0 && pointer) {
                var stage_pos = kStage.getAbsolutePosition();
                var x = pointer.x - (pointer.x - stage_pos.x) / scale * new_scale;
                var y = pointer.y - (pointer.y - stage_pos.y) / scale * new_scale;
                kStage.setPosition(x, y);
                kStage.setScale(new_scale);
                kStage.draw();
            }
        };


        /**
         * Draw triangles
         * @param {Array.<Triangle>} triangles
         */
        Stage.prototype.setTriangles = function (triangles) {
            var layer = new Kinetic.Layer({name: "triangles"});
            (triangles || []).forEach(function (t) {
                var triangle = new Kinetic.Polygon({
                    points: makeKineticPoints(t.getPoints()),
                    fill: STAGE_STYLES.TRIANGLE_FILL_COLOR,
                    stroke: STAGE_STYLES.TRIANGLE_STROKE_COLOR
                });
                provideFixedLineWidth(triangle, function (linescale) {
                    this.setStrokeWidth(STAGE_STYLES.TRIANGLE_STROKE_WIDTH * linescale);
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

            if (contour && contour.length) {
                var polygon = new Kinetic.Polygon({
                    points: makeKineticPoints(contour),
                    stroke: STAGE_STYLES.CONSTRAINT_COLOR,
                    dashArrayEnabled: true
                });
                provideFixedLineWidth(polygon, function (lineScale) {
                    this.setStrokeWidth(STAGE_STYLES.CONSTRAINT_STROKE_WIDTH * lineScale);
                    var dashArray = STAGE_STYLES.CONSTRAINT_DASH_ARRAY.map(function (dash) {
                        return dash * lineScale;
                    });
                    this.setDashArray(dashArray);
                });
                layer.add(polygon);
            }

            (holes || []).forEach(function (hole) {
                var polygon = new Kinetic.Polygon({
                    points: makeKineticPoints(hole),
                    stroke: STAGE_STYLES.CONSTRAINT_COLOR,
                    dashArrayEnabled: true
                });
                provideFixedLineWidth(polygon, function (lineScale) {
                    this.setStrokeWidth(STAGE_STYLES.CONSTRAINT_STROKE_WIDTH * lineScale);
                    var dashArray = STAGE_STYLES.CONSTRAINT_DASH_ARRAY.map(function (dash) {
                        return dash * lineScale;
                    });
                    this.setDashArray(dashArray);
                });
                layer.add(polygon);
            });

            (points || []).forEach(function (point) {
                var circle = new Kinetic.Circle({
                    x: point.x,
                    y: point.y,
                    fill: STAGE_STYLES.CONSTRAINT_COLOR
                });
                provideFixedLineWidth(circle, function (lineScale) {
                    this.setRadius(STAGE_STYLES.CONSTRAINT_STROKE_WIDTH * lineScale);
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
         * @param {Array.<XY>} errorPoints
         */
        Stage.prototype.setErrors = function (errorPoints) {
            var layer = new Kinetic.Layer({name: "errors"});
            (errorPoints || []).forEach(function (point) {
                var circle = new Kinetic.Circle({
                    x: point.x,
                    y: point.y,
                    fill: STAGE_STYLES.ERROR_COLOR
                });
                provideFixedLineWidth(circle, function (lineScale) {
                    this.setRadius(STAGE_STYLES.ERROR_RADIUS * lineScale);
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

        return Stage;
    })

/**
 * KineticJS stage directive.
 * Optionally export the KineticJS stage object to the parent scope, trough the "model" attribute, if specified.
 */
    .directive('stage', function ($log, Stage) {
        return {
            restrict: 'E',
            scope: {
                stageModel: '=?model',
                contour: '=',
                holes: '=',
                points: '=',
                triangles: '=',
                boundingBox: '=',
                errorPoints: '=',
                showConstraints: '=',
                onMouseMove: '&'
            },
            link: function (scope, element) {
                var stage = new Stage(element);

                // Export the KineticJS stage object to the parent scope
                scope.stageModel = stage;

                // Show or hide constraints (contour + holes + Steiner points)
                scope.$watch('showConstraints', function (newValue) {
                    stage.setConstraintsVisible(newValue);
                    // Shouldn't be needed to redraw explicitly, but sometimes when stage is created
                    // with hidden constraints, it is not possible to show the constraints again, without
                    // forcing a redraw.
                    stage.draw();
                });

                // Redraw iff triangles is modified
                // (for the time being, don't redraw if constraints are modified : wait for triangulation).
                // We use watchCollection so only a shallow comparison is done i.e. collection items such as
                // 'triangles' are compared using '===', not not deep equality. This should be sufficient
                // for this use case (each triangulation returns a new array).
                scope.$watchCollection('[ triangles, errorPoints ]', function (newValue) {
                    $log.debug("stage $watchCollection", newValue);
                    stage.reset();

                    // XXX watch separately ?
                    // XXX compute if not set ?
                    if (scope.boundingBox) {
                        stage.setBoundingBox(scope.boundingBox.min, scope.boundingBox.max);
                    }

                    // draw result
                    stage.setTriangles(scope.triangles);
                    stage.setConstraints(scope.contour, scope.holes, scope.points);
                    stage.setConstraintsVisible(scope.showConstraints);
                    if (scope.errorPoints) {
                        stage.setErrors(scope.errorPoints);
                    }
                    stage.draw();
                });
            }
        };
    });

},{}],4:[function(require,module,exports){
/*
 * poly2tri.js demo.
 * AngularJS triangulation service.
 *
 * (c) 2014, Rémi Turboult
 * All rights reserved.
 * Distributed under the 3-clause BSD License, see LICENSE.txt
 */

/* jshint node:true */
/* global angular */

"use strict";


module.exports = angular.module('triangulation', [ ])
/**
 * Triangulation library
 */
    .value('poly2tri', poly2tri.noConflict()) // jshint ignore:line
/**
 * Triangulation service
 */
    .factory('triangulate', function (poly2tri, $log) {
        /**
         * Parsed constraints
         * @typedef {Object} ParsedConstraints
         * @property {Array.<Point>} contour
         * @property {Array.<Array.<Point>>} holes
         * @property {Array.<Point>} points - Steiner points
         */
        /**
         * Triangulation result
         * @typedef {Object} TriangulationResult
         * @property {Array.<Triangle>} triangles
         * @property {{min:Point,max:Point}} boundingBox
         * @property {Error} error - exception, if any
         * @property {Array.<Point>} error_points - faulty constraints, if any
         */
        /**
         * Perform a triangulation
         * @param {ParsedConstraints} constraints
         * @returns {TriangulationResult} result
         */
        return function triangulate(constraints) {
            $log.debug("triangulate", constraints);

            // get model
            var contour = constraints.contour;
            var holes = constraints.holes;
            var points = constraints.points;

            // perform triangulation
            var swctx;
            var result = { };
            try {
                // prepare SweepContext
                swctx = new poly2tri.SweepContext(contour, {cloneArrays: true});
                swctx.addHoles(holes).addPoints(points);

                // triangulate
                swctx.triangulate();
            } catch (e) {
                result.error = e;
                result.error_points = e.points;
            }
            result.triangles = (swctx && swctx.getTriangles());
            result.boundingBox = (swctx && swctx.getBoundingBox());

            $log.debug("result", result);
            return result;
        };
    });

},{}],5:[function(require,module,exports){
function find(array, predicate, self) {
  self = self || this;
  var len = array.length;
  var i;
  if (len === 0) {
    return;
  }
  if (typeof predicate !== 'function') {
    throw new TypeError(predicate + ' must be a function');
  }

  for (i = 0; i < len; i++) {
    if (predicate.call(self, array[i], i, array)) {
      return array[i];
    }
  }

  return;
}

module.exports = find;

},{}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
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
    var floats = (str||"").split(/[^-+eE\.\d]+/).map(parseFloat).filter(function (val) {
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
    var groups = (str||"").split(/\n\s*\n/).map(parseFloats).filter(function (floats) {
        return floats.length > 0;
    });
    return groups;
}
exports.parseFloatsGroups = parseFloatsGroups;

},{}]},{},[1])