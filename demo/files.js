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

module.exports = angular.module(__filename, [ ])
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
                filename: '=initFromFile',
                trigger: '=reloadTrigger'
            },
            link: function (scope, element) {
                // We need to watch both the filename and a 'trigger', so that we can reload if the trigger
                // has changed, event if the filename has not. This can happen if the user performs some input,
                // then reload the same filename (eg an empty holes file on a different example).
                scope.$watchCollection('[ filename, trigger ]', function () {
                    element.val("").change(); // "change" to trigger angular model update
                    if (scope.filename) {
                        loadData(scope.filename).then(function (data) {
                            element.val(data).change();
                        });
                    }
                });
            }
        };
    });
