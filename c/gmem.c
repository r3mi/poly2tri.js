/*
 * gmem.c
 * Minimal glib-2.0 replacement necessary to compile poly2tri-c with emscripten.
 * 
 * (c) 2014, Rémi Turboult
 * All rights reserved.
 * Distributed under the 3-clause BSD License, see LICENSE.txt
 * 
 * This implementation does not share code with the official glib:
 * it is a simplified implementation of the glib API.
 */

#include "glib.h"
#include <string.h>


/*
 * "gmem.c" 
 * ----------
 * (minimal replacement)
 */

#if GEXT_DEBUG_ALLOC

#include <stdio.h>

typedef enum _AllocType {
    ALLOC_MALLOC,
    ALLOC_REALLOC,
    ALLOC_NB_TYPE
} AllocType;

typedef struct _AllocDebug {
    char typname [32];
    size_t size;
    gint nb[ALLOC_NB_TYPE];
} AllocDebug;
#define NB_ALLOC_DEBUG  30
static AllocDebug alloc_debugs [NB_ALLOC_DEBUG];

void gext_print_alloc_debug() {
    AllocDebug* a;
    for (a = alloc_debugs; a < alloc_debugs + NB_ALLOC_DEBUG; a++) {
        printf("'%s', size=%d, malloc=%d, realloc=%d\n", a->typname,
                (int) a->size, a->nb[ALLOC_MALLOC], a->nb[ALLOC_REALLOC]);
    }
}

static void add_alloc_debug(size_t size, const char* const typname, AllocType alloc_type) {
    AllocDebug* a;
    for (a = alloc_debugs; a < alloc_debugs + NB_ALLOC_DEBUG; a++) {
        if (a->size == size && strcmp(a->typname, typname) == 0) {
            a->nb[alloc_type]++;
            return;
        }
        if (a->size == 0 && a->typname[0] == '\0') {
            a->size = size;
            strcpy(a->typname, typname);
            a->nb[alloc_type] = 1;
            return;
        }
    }
}

gpointer g_malloc(size_t size) {
    add_alloc_debug(size, "", ALLOC_MALLOC);
    return malloc(size);
}

gpointer g_realloc(gpointer ptr, size_t size) {
    add_alloc_debug(size, "", ALLOC_REALLOC);
    return realloc(ptr, size);
}

gpointer _gext_new(size_t size, const char* typname) {
    add_alloc_debug(size, typname, ALLOC_MALLOC);
    return malloc(size);
}
#endif /* GEXT_DEBUG_ALLOC */

