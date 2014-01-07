/*
 * bindings.c
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



// Extra functions, not in glib. They can't be macros because they need
// to be exported by emscripten.

guint g_ptr_array_length(GPtrArray* array) {
    return array->len;
}

gpointer g_ptr_array_get(GPtrArray* array, guint index_) {
    return g_ptr_array_index(array, index_);
}


static const gint CANARY = 0xcac0bee1;

typedef struct _P2tPointWithId P2tPointWithId;

struct _P2tPointWithId {
    P2tPoint p;
    gint id;
    gint canary;
};

_Static_assert(offsetof(P2tPointWithId, p) == 0, "P2tPoint* and P2tPointWithId* shall be equal");

P2tPointWithId* p2t_point_new_dd_with_id(double x, double y, gint id) {
    P2tPointWithId* THIS = g_slice_new(P2tPointWithId);
    p2t_point_init_dd(&(THIS->p), x, y);
    THIS->id = id;
    THIS->canary = CANARY;
    return THIS;
}

P2tPointWithId* p2t_point_with_id_from_point(P2tPoint* point) {
    P2tPointWithId* pid = (P2tPointWithId*) point;
    assert(pid->canary == CANARY);
    return pid;
}

gint p2t_triangle_get_point_id(P2tTriangle* THIS, const int index) {
    P2tPoint* point = THIS->points_[index];
    return p2t_point_with_id_from_point(point)->id;
}


// XXXX

void g_ptr_array_sort(GPtrArray* array, GCompareFunc compare_func) {
    if (array) {
        gpointer raw = g_ptr_array_index(array, 0);
        P2tPointWithId* pid = (P2tPointWithId*) raw;
        assert(pid->canary == CANARY);

        raw = g_ptr_array_index(array, array->len - 1);
        pid = (P2tPointWithId*) raw;
        assert(pid->canary == CANARY);

        qsort(array->pdata, array->len, sizeof (gpointer), compare_func);

        raw = g_ptr_array_index(array, 0);
        pid = (P2tPointWithId*) raw;
        assert(pid->canary == CANARY);

        raw = g_ptr_array_index(array, array->len - 1);
        pid = (P2tPointWithId*) raw;
        assert(pid->canary == CANARY);
    }
}
