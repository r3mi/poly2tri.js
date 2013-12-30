/*
 * Poly2Tri Copyright (c) 2009-2013, Poly2Tri Contributors
 * http://code.google.com/p/poly2tri/
 * 
 * poly2tri.js (JavaScript port) (c) 2009-2013, Poly2Tri Contributors
 * https://github.com/r3mi/poly2tri.js
 * 
 * All rights reserved.
 * 
 * Distributed under the 3-clause BSD License, see LICENSE.txt
 */

/* jshint maxcomplexity:11 */

"use strict";


/*
 * Note
 * ====
 * the structure of this JavaScript version of poly2tri intentionally follows
 * as closely as possible the structure of the reference C++ version, to make it 
 * easier to keep the 2 versions in sync.
 */


// -------------------------------------------------------------------------Node

/**
 * Advancing front node
 * @param {Point} p any "Point like" object with {x,y} (duck typing)
 * @param {Triangle} t triangle (optionnal)
 */
var Node = function(p, t) {
    this.point = p;
    this.triangle = t || null;

    this.next = null; // Node
    this.prev = null; // Node

    this.value = p.x;
};

// ---------------------------------------------------------------AdvancingFront
var AdvancingFront = function(head, tail) {
    this.head_ = head; // Node
    this.tail_ = tail; // Node
    this.search_node_ = head; // Node
};

AdvancingFront.prototype.head = function() {
    return this.head_;
};

AdvancingFront.prototype.setHead = function(node) {
    this.head_ = node;
};

AdvancingFront.prototype.tail = function() {
    return this.tail_;
};

AdvancingFront.prototype.setTail = function(node) {
    this.tail_ = node;
};

AdvancingFront.prototype.search = function() {
    return this.search_node_;
};

AdvancingFront.prototype.setSearch = function(node) {
    this.search_node_ = node;
};

AdvancingFront.prototype.findSearchNode = function(/*x*/) {
    // TODO: implement BST index
    return this.search_node_;
};

AdvancingFront.prototype.locateNode = function(x) {
    var node = this.search_node_;

    /* jshint boss:true */
    if (x < node.value) {
        while (node = node.prev) {
            if (x >= node.value) {
                this.search_node_ = node;
                return node;
            }
        }
    } else {
        while (node = node.next) {
            if (x < node.value) {
                this.search_node_ = node.prev;
                return node.prev;
            }
        }
    }
    return null;
};

AdvancingFront.prototype.locatePoint = function(point) {
    var px = point.x;
    var node = this.findSearchNode(px);
    var nx = node.point.x;

    if (px === nx) {
        // Here we are comparing point references, not values
        if (point !== node.point) {
            // We might have two nodes with same x value for a short time
            if (point === node.prev.point) {
                node = node.prev;
            } else if (point === node.next.point) {
                node = node.next;
            } else {
                throw new Error('poly2tri Invalid AdvancingFront.locatePoint() call');
            }
        }
    } else if (px < nx) {
        /* jshint boss:true */
        while (node = node.prev) {
            if (point === node.point) {
                break;
            }
        }
    } else {
        while (node = node.next) {
            if (point === node.point) {
                break;
            }
        }
    }

    if (node) {
        this.search_node_ = node;
    }
    return node;
};


// ----------------------------------------------------------------------Exports

module.exports = AdvancingFront;
module.exports.Node = Node;

