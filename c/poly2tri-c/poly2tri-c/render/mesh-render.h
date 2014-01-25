/*
 * This file is a part of Poly2Tri-C
 * (c) Barak Itkin <lightningismyname@gmail.com>
 * http://code.google.com/p/poly2tri-c/
 *
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *
 * * Redistributions of source code must retain the above copyright notice,
 *   this list of conditions and the following disclaimer.
 * * Redistributions in binary form must reproduce the above copyright notice,
 *   this list of conditions and the following disclaimer in the documentation
 *   and/or other materials provided with the distribution.
 * * Neither the name of Poly2Tri nor the names of its contributors may be
 *   used to endorse or promote products derived from this software without specific
 *   prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#ifndef __P2TR_RENDER_MESH_RENDER_H__
#define __P2TR_RENDER_MESH_RENDER_H__

#include <glib.h>
#include <poly2tri-c/refine/refine.h>

/**
 * A struct containing the necessary information to render a "color
 * image" of a triangular mesh, by interpolating "colors" between its
 * points.
 * This can in fact be used to interpolate any N-Dimensional value set
 * along the triangles of a mesh.
 */
typedef struct {
  /** Minimal X and Y coordinates to start sampling at */
  gdouble min_x, min_y;
  /** Size of a step (distance between samples) in each axis */
  gdouble step_x, step_y;
  /** The amount of samples desired in each axis */
  guint x_samples, y_samples;
  /**
   * The amount of channels per "pixel", both in the destination buffer
   * and in the colors returned from the matching point-to-color
   * function. Note that this does not include the alpha channel!
   */
  guint cpp;
  /**
   * Specifies whether the alpha channel (0 outside the mesh, 1 inside)
   * should come after or before the the channel colors
   */
  gboolean alpha_last;
} P2trImageConfig;

/**
 * A function that maps mesh points into colors
 * @param point The mesh point
 * @param dest The destination buffer for the color components, where
 *        each component is one unsigned byte (guint8)
 * @param user_data Custom data passed as a pointer to the function
 */
typedef void (*P2trPointToColorFuncB)   (P2trPoint            *point,
                                         guint8               *dest,
                                         gpointer              user_data);

/**
 * Similar to @ref P2trPointToColorFuncB, but with floating point data
 * types for each color component
 */
typedef void (*P2trPointToColorFuncF)   (P2trPoint            *point,
                                         gfloat               *dest,
                                         gpointer              user_data);

/**
 * A generalization of all the point-to-color functions. This is used
 * only for type casting inside the library and should not be used
 * externally.
 */
typedef void (*P2trPointToColorFuncC)   (P2trPoint            *point,
                                         void                 *dest,
                                         gpointer              user_data);

/**
 * A struct for caching the barycentric coordinates of a point inside
 * a triangle. A buffer of these structs is referred to as a UVT cache.
 */
typedef struct {
  gdouble       u;
  gdouble       v;
  P2trTriangle *tri;
} P2trUVT;

/**
 * Compute the UVT cache for the given mesh for the area and resolution
 * specified by the image configuration struct. The cache for the point
 * (min_x + i * step_x, min_y + j * step_y) would be at the index
 * j * x_samples + i (assuming of course the point is inside the area
 * described by image configuration struct).
 */
void   p2tr_mesh_render_cache_uvt       (P2trMesh             *mesh,
                                         P2trUVT              *dest,
                                         P2trImageConfig      *config);

/**
 * Similar to @ref p2tr_mesh_render_cache_uvt, but cache only the
 * first @ref dest_len pixels.
 */
void   p2tr_mesh_render_cache_uvt_exact (P2trMesh             *mesh,
                                         P2trUVT              *dest,
                                         gint                  dest_len,
                                         P2trImageConfig      *config);

/**
 * Render a mesh using a UVT cache that was computed for the given
 * area, together with a point-to-color function.
 * @param uvt_cache A cache for the given area, computed with
 *        @ref p2tr_mesh_render_cache_uvt_exact
 * @param dest The destination buffer for the image
 * @param dest_len How many pixels to render from the area. The cache
 *        should contain data for at least this many pixels!
 * @param config The render configuration struct
 * @param pt2col A function that receives points in the mesh and returns
 *        colors. The returned colors should have config->cpp components
 * @param pt2col_user_data Custom data to pass to @ref pt2col
 */
void   p2tr_mesh_render_from_cache_f    (P2trUVT               *uvt_cache,
                                         gfloat                *dest,
                                         gint                   dest_len,
                                         P2trImageConfig       *config,
                                         P2trPointToColorFuncF  pt2col,
                                         gpointer               pt2col_user_data);

/**
 * Render a mesh with the given area and sampling configuration. Same
 * as first caching @ref p2tr_mesh_render_cache_uvt and then calling
 * @ref p2tr_mesh_render_cache_uvt_exact with the cache, and finally
 * freeing the cache
 */
void   p2tr_mesh_render_f               (P2trMesh              *mesh,
                                         gfloat                *dest,
                                         P2trImageConfig       *config,
                                         P2trPointToColorFuncF  pt2col,
                                         gpointer               pt2col_user_data);

/**
 * See @ref p2tr_mesh_render_from_cache_f
 */
void   p2tr_mesh_render_from_cache_b    (P2trUVT               *uvt_cache,
                                         guint8                *dest,
                                         gint                   dest_len,
                                         P2trImageConfig       *config,
                                         P2trPointToColorFuncB  pt2col,
                                         gpointer               pt2col_user_data);

/**
 * See @ref p2tr_mesh_render_f
 */
void   p2tr_mesh_render_b               (P2trMesh              *mesh,
                                         guint8                *dest,
                                         P2trImageConfig       *config,
                                         P2trPointToColorFuncB  pt2col,
                                         gpointer               pt2col_user_data);

#endif
