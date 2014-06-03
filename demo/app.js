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

var find = require('array-find');

// AngularJS main
module.exports = angular.module('demo', [
    require("./files").name,
    require("./parse").name,
    require("./triangulation").name,
    require("./stage").name
])

    .config(function ($locationProvider) {
        // Get rid of #! before search parameters, in compatible browsers.
        // See http://stackoverflow.com/a/16678065
        $locationProvider.html5Mode(true);
    })

/**
 * Global controller : manages files, performs triangulation
 */
    .controller('demoCtrl', function ($scope, filesPromise, triangulate, $window, poly2tri) {
        filesPromise.then(function (data) {
            $scope.files = data;
            $scope.file = find(data, function (element) {
                return element.holes === 'dude_holes.dat';
            });
        });

        $scope.poly2tri = poly2tri;

        $scope.triangulate = function (constraints) {
            var result = triangulate(constraints);
            if (result.error) {
                // XXX move in View
                $window.alert(result.error);
            }
            return result;
        };
    });

