/*
 * poly2tri.js demo.
 * Main AngularJS module.
 *
 * (c) 2014, Rémi Turboult
 * All rights reserved.
 * Distributed under the 3-clause BSD License, see LICENSE.txt
 */

/* jshint browser:true, jquery:true, globalstrict:true */
/* global angular */


"use strict";

// XXX remove jQuery
// XXX also in bower_components and bower.json
if (typeof $ === 'undefined') {
    window.alert("jQuery not found -- dependencies not installed ?");
    throw new Error("jQuery not loaded -- bower dependencies not installed ?");
}

if (typeof angular === 'undefined') {
    window.alert("AngularJS not found -- dependencies not installed ?");
    throw new Error("AngularJS not loaded -- bower dependencies not installed ?");
}


var parse = require("../tests/utils/parse");
var mapPairs = require("../tests/utils/mapPairs");
var find = require('array-find');

// AngularJS main
var app = angular.module('demo', [
    'monospaced.mousewheel',
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
