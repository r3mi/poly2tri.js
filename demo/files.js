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
            // XXX needed ?
            files.findBy = function (property, value) {
                var file = this.filter(function (file) {
                    return file[property] === value;
                });
                return (file ? file[0] : null);
            };
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
