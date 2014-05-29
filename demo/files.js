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
                    files.push(angular.extend({
                        title: group.title,
                        source: group.source,
                        label: (file.content || file.name)
                    }, file));
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
 * (for <input>, <textarea> or <select>)
 */
    .directive('initFromFile', function (loadData) {
        return {
            restrict: 'A',
            scope: {
                filename: '=initFromFile'
            },
            link: function (scope, element) {
                scope.$watch('filename', function (filename) {
                    element.val("").change(); // "change" to trigger angular model update
                    if (filename) {
                        loadData(filename).then(function (data) {
                            element.val(data).change();
                        });
                    }
                });
            }
        };
    });
