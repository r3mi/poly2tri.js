/*
 * glib.h
 * Minimal glib-2.0 replacement necessary to compile poly2tri-c with emscripten.
 * 
 * (c) 2014, Rémi Turboult
 * All rights reserved.
 * Distributed under the 3-clause BSD License, see LICENSE.txt
 * 
 * This implementation does not share code with the official glib:
 * it is a simplified implementation of the glib API.
 */


#ifndef __G_LIB_H__
#define __G_LIB_H__

#ifdef	__cplusplus
extern "C" {
#endif

    /*
     * "gtypes.h" 
     * ----------
     * (minimal replacement)
     */

#include <stdbool.h>
    typedef bool gboolean;
#ifndef FALSE
#   define FALSE false
#endif
#ifndef TRUE
#   define TRUE false
#endif

typedef char            gchar;
typedef int             gint;
typedef unsigned int    guint;
typedef double          gdouble;
typedef void*           gpointer;
typedef const void*     gconstpointer;

typedef gint(*GCompareFunc) (gconstpointer a, gconstpointer b);

#define G_PI    M_PI
#define G_PI_2  M_PI_2


    /*
     * "gmessages.h" 
     * ----------
     * (minimal replacement)
     */

// varargs version not needed for poly2tri
//      void g_error(const gchar *format, ...);
void g_error(const gchar* msg);


    /*
     * "gmem.h" 
     * ----------
     * (minimal replacement)
     */

#include <stdlib.h>

#define g_malloc            malloc
#define g_realloc           realloc
#define g_free              free
#define g_new(type,num)     ((type *)g_malloc((sizeof(type)) * ((size_t)(num))))


    /*
     * "gslice.h" 
     * ----------
     * (minimal replacement)
     */

#define g_slice_alloc(size)                 g_malloc(size)
#define g_slice_new(type)                   ((type*)g_slice_alloc(sizeof(type)))
#define g_slice_free1(mem_size,mem_block)   g_free(mem_block)

    // TBD XXX code copied from gslice.h ??
    
/* we go through extra hoops to ensure type safety */
#define g_slice_free(type,mem)				do {	\
    if (1) g_slice_free1 (sizeof (type), (mem));    \
    else   (void) ((type*) 0 == (mem));             \
} while (0)


    /*
     * "garray.h" 
     * ----------
     * (minimal replacement)
     */

typedef struct _GPtrArray	GPtrArray;
struct _GPtrArray {
    /* public: */
    gpointer*   pdata;
    guint       len;
    /* private: */
    guint       _allocated;
};

#define G_PTR_ARRAY_INDEX_CHECK     1

#ifdef G_PTR_ARRAY_INDEX_CHECK
gpointer g_ptr_array_index(GPtrArray* array, guint index_);
#else
#define g_ptr_array_index(array,index_)     ((array)->pdata)[index_]
#endif

GPtrArray* g_ptr_array_new();
gpointer* g_ptr_array_free(GPtrArray *array, gboolean free_seg);
void g_ptr_array_add(GPtrArray *array, gpointer data);
void g_ptr_array_sort(GPtrArray *array, GCompareFunc compare_func);
void g_ptr_array_set_size(GPtrArray *array, gint length);
GPtrArray* g_ptr_array_sized_new(guint reserved_size);


    /*
     * "glist.h" 
     * ----------
     * (minimal replacement)
     */

typedef struct _GList GList;
struct _GList {
    gpointer    data;
    GList*      next;
    GList*      prev;
};

void g_list_free(GList *list);
GList* g_list_append(GList *list, gpointer data);
GList* g_list_remove(GList *list, gconstpointer data);
GList* g_list_first(GList *list);
#define g_list_next(list)	        ((list) ? (((GList *)(list))->next) : NULL)
GList* g_list_last(GList *list);


    /*
     * "gqueue.h" 
     * ----------
     * (minimal replacement)
     */

typedef struct _GQueue GQueue;
struct _GQueue {
    GList*      head;
    GList*      tail;
    guint       length;
};

#define G_QUEUE_INIT    ((GQueue){.head = NULL, .tail = NULL, .length = 0})
void g_queue_push_tail(GQueue *queue, gpointer data);
gpointer g_queue_pop_tail(GQueue *queue);
gboolean g_queue_is_empty(GQueue *queue);



#ifdef	__cplusplus
}
#endif

#endif /* __G_LIB_H__ */
