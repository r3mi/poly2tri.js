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
         * @typedef {Object} TriangulationConstraints
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
         * @param {TriangulationConstraints} constraints
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
