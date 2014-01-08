/*
 * glib.c
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
#include <assert.h>


/*
 * "gmessages.c" 
 * ----------
 * (minimal replacement)
 */

// store last fatal message
static gchar* g_last_error = NULL;

void g_error(const gchar* msg) {
    if (msg) {
        g_last_error = g_malloc(strlen(msg) + 1);
        if (g_last_error) {
            strcpy(g_last_error, msg);
        }
    }
    abort();
}

/*
 * "garray.c" 
 * ----------
 * (minimal replacement)
 */

static gint next_pow_of_two(gint num) {
    guint n = 16; // MIN_ARRAY_SIZE
    while (n < num) {
        n <<= 1;
    }
    return n;
}

static void ptr_array_ensure_room(GPtrArray* array, gint len) {
    if ((array->len + len) > array->_allocated) {
        array->_allocated = next_pow_of_two(array->len + len);
        array->pdata = g_realloc(array->pdata, sizeof (gpointer) * array->_allocated);
        assert(array->pdata != NULL);
    }
    assert(array->_allocated >= array->len);
}

GPtrArray* g_ptr_array_new() {
    return g_ptr_array_sized_new(0);
}

GPtrArray* g_ptr_array_sized_new(guint reserved_size) {
    GPtrArray* array = g_slice_new(GPtrArray);
    assert(array != NULL);
    *array = (GPtrArray){.pdata = NULL, .len = 0, ._allocated = 0};
    if (reserved_size > 0) {
        ptr_array_ensure_room(array, reserved_size);
    }
    return array;
}

gpointer* g_ptr_array_free(GPtrArray* array, gboolean free_seg) {
    gpointer* pdata = NULL;
    if (array) {
        if (free_seg) {
            g_free(array->pdata);
        } else {
            pdata = array->pdata;
        }
        g_slice_free(GPtrArray, array);
    }
    return pdata;
}

void g_ptr_array_add(GPtrArray* array, gpointer data) {
    if (array) {
        ptr_array_ensure_room(array, 1);
        array->pdata[array->len++] = data;
    }
}

void g_ptr_array_set_size(GPtrArray* array, gint length) {
    if (array && length >= 0) {
        if (length > array->len) {
            gint i;
            ptr_array_ensure_room(array, length - array->len);
            for (i = array->len; i < length; i++) {
                array->pdata[i] = NULL;
            }
        }
        array->len = length;
    }
}

//XXX

void xxxxg_ptr_array_sort(GPtrArray* array, GCompareFunc compare_func) {
    if (array) {
        qsort(array->pdata, array->len, sizeof (gpointer), compare_func);
    }
}

#ifdef G_PTR_ARRAY_INDEX_CHECK

gpointer g_ptr_array_index(GPtrArray* array, guint index_) {
    assert(index_ < array->len);
    return (array->pdata)[index_];
}
#endif

/*
 * "glist.c" 
 * ----------
 * (minimal replacement)
 */

void g_list_free(GList* list) {
    while (list) {
        GList* next = list->next;
        g_slice_free(GList, list);
        list = next;
    }
}

GList* g_list_append(GList* list, gpointer data) {
    GList* new_node = g_slice_new(GList);
    *new_node = (GList){.data = data, .next = NULL};
    GList* last = g_list_last(list);
    if (last) {
        last->next = new_node;
        new_node->prev = last;
        return list;
    } else {
        new_node->prev = NULL;
        return new_node;
    }
}


// Implementation not needed for poly2tri
// GList* g_list_remove(GList *list, gconstpointer data) { }

GList* g_list_first(GList* list) {
    if (list) {
        while (list->prev) {
            list = list->prev;
        }
    }
    return list;
}

GList* g_list_last(GList* list) {
    if (list) {
        while (list->next) {
            list = list->next;
        }
    }
    return list;
}

/*
 * "gqueue.c" 
 * ----------
 * (minimal replacement)
 */

void g_queue_push_tail(GQueue* queue, gpointer data) {
    if (queue) {
        GList* list = g_list_append(queue->tail, data);
        queue->tail = g_list_last(list);
        if (queue->head == NULL) {
            queue->head = list;
        }
        queue->length++;
    }
}

gpointer g_queue_pop_tail(GQueue* queue) {
    if (queue && queue->tail) {
        GList* node = queue->tail;
        gpointer data = node->data;
        queue->tail = node->prev;
        if (queue->tail) {
            queue->tail->next = NULL;
        } else {
            queue->head = NULL;
        }
        queue->length--;
        g_slice_free(GList, node);
        return data;
    }
    return NULL;
}

gboolean g_queue_is_empty(GQueue* queue) {
    return (queue ? (queue->head == NULL) : TRUE);
}

