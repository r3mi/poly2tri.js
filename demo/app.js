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


// XXX move to triangulation.js
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
 * Global controller : manages files, performs triangulation
 * XXX separate controllers ?
 */
app.controller('demoCtrl', function (filesPromise, triangulate, $window) {

    // XXX move to file.js
    var self = this;
    filesPromise.then(function (data) {
        self.files = data;
        self.file = find(data, function (element) {
            return element.holes === 'dude_holes.dat';
        });
    });

    // XXX move to triangulation.js
    this.triangulate = function (constraints) {
        var result = triangulate(constraints);
        if (result.error) {
            // XXX move in View
            $window.alert(result.error);
        }
        return result;
    };
});


// XXX add Non-immediate (debounced) model updates ??
// XXX see ngModelOptions and https://docs.angularjs.org/guide/forms

/**
 * Parse an input field with 'parsePoints' and update the underlying ng-model
 */
// XXX move into files.js ??
app.directive('parsePoints', function () {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, element, attrs, ctrl) {
            ctrl.$parsers.push(function(viewValue) {
                return parsePoints(viewValue);
            });
        }
    };
});


/**
 * Parse an input field with 'parseHoles' and update the underlying ng-model
 */
// XXX move into files.js ??
app.directive('parseHoles', function () {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, element, attrs, ctrl) {
            ctrl.$parsers.push(function(viewValue) {
                return parseHoles(viewValue);
            });
        }
    };
});
