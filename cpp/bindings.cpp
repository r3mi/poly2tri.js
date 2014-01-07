/*
 * bindings.cpp
 * Main C++ bindings for the emscripten C++ version of poly2tri.js.
 * 
 * (c) 2014, Rémi Turboult
 * All rights reserved.
 * Distributed under the 3-clause BSD License, see LICENSE.txt
 */

#include <emscripten/bind.h>
using namespace emscripten;

#include "poly2tri.h"
using namespace p2t;

#include <cassert> 

struct PointWithId : public Point {

    PointWithId() : canary(CANARY) {
    };

    PointWithId(double x, double y, int id)
    : Point(x, y), id(id), canary(CANARY) {
    }

    // Extra identifier added to make the link with JS Points
    int id;

    static PointWithId * fromPoint(Point* point) {
        PointWithId* pid = static_cast<PointWithId*> (point);
        assert(pid->canary == CANARY);
        return pid;
    }

private:
    static const int CANARY = 0xcac0bee1;
    const int canary;
};

EMSCRIPTEN_BINDINGS(CDT) {
    register_vector<Point*>("VectorPoints");
    register_vector<Triangle*>("VectorTriangles");

    class_<CDT>("CDT")
            .constructor<std::vector<Point*> >()
            .function("addHole", &CDT::AddHole)
            .function("addPoint", &CDT::AddPoint, allow_raw_pointer < arg < 1 >> ())
            .function("triangulate", &CDT::Triangulate)
            .function("getTriangles", &CDT::GetTriangles)
            ;

    class_<Point>("Point")
            .constructor< >()
            .constructor<float, float >()
            .property("x", &Point::x)
            .property("y", &Point::y)
            ;

    class_<PointWithId, base < Point >> ("PointWithId")
            .constructor< >()
            .constructor<float, float, int >()
            .property("id", &PointWithId::id)
            .class_function("fromPoint", &PointWithId::fromPoint, allow_raw_pointer < arg < 1 >> ())
            ;

    class_<Triangle>("Triangle")
            .function("getPoint", &Triangle::GetPoint, allow_raw_pointer < arg < 0 >> ())
            ;
}
