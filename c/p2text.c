/*
 * p2text.c
 * Extra C functions to export into the emscripten C version of poly2tri.js.
 * 
 * (c) 2014, Rémi Turboult
 * All rights reserved.
 * Distributed under the 3-clause BSD License, see LICENSE.txt
 */

#include "glib.h"
#include "poly2tri.h"

#include <stddef.h>
#include <assert.h>


/*
 * P2tPointWithId
 * --------------
 * This structure is like a "P2tPoint" but has an extra "id" identifier field,
 * that is used to make the link with JavaScript Points.
 * As a precaution (should not be needed given the logic of poly2tri), 
 * we use an extra "canary"  field to assert that a "P2tPoint" 
 * is indeed a "P2tPointWithId".
 */

static const gint CANARY = 0xcac0bee1;

typedef struct _P2tPointWithId P2tPointWithId;

struct _P2tPointWithId {
    P2tPoint p;
    gint id;
    gint canary;
};

_Static_assert(offsetof(P2tPointWithId, p) == 0, "P2tPoint* and P2tPointWithId* shall be equal");

void p2text_point_with_id_init_ddi(P2tPointWithId* THIS, double x, double y, gint id) {
    p2t_point_init_dd(&THIS->p, x, y);
    THIS->id = id;
    THIS->canary = CANARY;
}

P2tPointWithId* p2text_point_with_id_new_ddi(double x, double y, gint id) {
    P2tPointWithId* THIS = g_slice_new(P2tPointWithId);
    p2text_point_with_id_init_ddi(THIS, x, y, id);
    return THIS;
}

void p2text_point_with_id_destroy(P2tPointWithId* THIS) {
    assert(THIS->canary == CANARY);
    p2t_point_destroy(&THIS->p);
}

void p2text_point_with_id_free(P2tPointWithId* THIS) {
    p2text_point_with_id_destroy(THIS);
    g_slice_free(P2tPointWithId, THIS);
}

P2tPointWithId* p2text_point_with_id_from_point(P2tPoint* point) {
    P2tPointWithId* pid = (P2tPointWithId*) point;
    assert(pid->canary == CANARY);
    return pid;
}

gint p2text_triangle_get_point_id(const P2tTriangle* THIS, const int index) {
    P2tPoint* point = THIS->points_[index];
    return p2text_point_with_id_from_point(point)->id;
}

/**
 * Free all the points allocated by the user for the calls to "p2t_cdt_new", 
 * "p2t_cdt_add_hole" and "p2t_cdt_add_point" : all these points 
 * are accumulated in the "struct SweepContext_.points_" g_ptr_array
 * (see the poly2tri-c code).
 */
void p2text_cdt_free_input_points(P2tCDT* THIS) {
    P2tPointPtrArray points = THIS->sweep_context_->points_;
    gint i;
    for (i = 0; i < points->len; i++) {
        p2text_point_with_id_free(g_ptr_array_index(points, i));
    }
}
