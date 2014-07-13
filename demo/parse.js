/*
 * poly2tri.js demo.
 * AngularJS module for Point parsing.
 *
 * (c) 2014, Rémi Turboult
 * All rights reserved.
 * Distributed under the 3-clause BSD License, see LICENSE.txt
 */

/* jshint node:true */
/* global angular */


"use strict";

var mapPairs = require("../tests/utils/mapPairs");
var parse = require("../tests/utils/parse");


function makePoints(floats) {
    return mapPairs(floats, function makePoint(x, y) {
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


// XXX add Non-immediate (debounced) model updates ??
// XXX see ngModelOptions and https://docs.angularjs.org/guide/forms

module.exports = angular.module(__filename, [ ])

/**
 * Parse an input field with 'parsePoints' and update the underlying ng-model
 */
    .directive('parsePoints', function () {
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function (scope, element, attrs, ctrl) {
                ctrl.$parsers.push(function (viewValue) {
                    return parsePoints(viewValue);
                });
            }
        };
    })

/**
 * Parse an input field with 'parseHoles' and update the underlying ng-model
 */
    .directive('parseHoles', function () {
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function (scope, element, attrs, ctrl) {
                ctrl.$parsers.push(function (viewValue) {
                    return parseHoles(viewValue);
                });
            }
        };
    });
