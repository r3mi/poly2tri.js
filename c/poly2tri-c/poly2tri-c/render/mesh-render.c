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

#include <glib.h>
#include <stdlib.h>
#include <stdio.h>
#include <poly2tri-c/refine/refine.h>
#include "mesh-render.h"

/* This function implements box logic to see if a point is contained in a
 * triangles bounding box. This is very useful for cases where there are many
 * triangles to test against a single point, and most of them aren't even near
 * it.
 *
 * Instead of finding the Xmin, Xmax, Ymin, Ymax and checking if the the point
 * is outside, just check if the point is on the SAME SIDE compared to all the
 * points of the triangle.
 * See http://lightningismyname.blogspot.com/2011/08/quickboxa-quick-point-in-triangle-test.html
 */
gboolean
p2tr_triangle_quick_box_test (P2trTriangle *self,
                               gdouble       Px,
                               gdouble       Py)
{
  P2trPoint *A = P2TR_TRIANGLE_GET_POINT (self, 0);
  P2trPoint *B = P2TR_TRIANGLE_GET_POINT (self, 1);
  P2trPoint *C = P2TR_TRIANGLE_GET_POINT (self, 2);

  register gboolean xPBorder = B->c.x <= Px;
  register gboolean yPBorder = B->c.y <= Py;

  return (((A->c.x <= Px) == xPBorder) && (xPBorder == (C->c.x <= Px)))
          || (((A->c.y <= Py) == yPBorder) && (yPBorder == (C->c.y <= Py)));
}

void
p2tr_mesh_render_cache_uvt (P2trMesh        *T,
                            P2trUVT         *dest,
                            P2trImageConfig *config)
{
  p2tr_mesh_render_cache_uvt_exact (T, dest, config->x_samples * config->y_samples, config);
}

void
p2tr_mesh_render_cache_uvt_exact (P2trMesh        *T,
                                  P2trUVT         *dest,
                                  gint             dest_len,
                                  P2trImageConfig *config)
{
  gint x, y, n = dest_len;
  P2trUVT *uvt = dest;
  P2trTriangle *tr_prev = NULL;
  P2trVector2 pt;
  
  pt.x = config->min_x;
  pt.y = config->min_y;

  uvt->tri = p2tr_mesh_find_point_local2 (T, &pt, NULL, &uvt->u, &uvt->v);
  if (uvt->tri) p2tr_triangle_unref (uvt->tri);
  tr_prev = uvt->tri;
  
  for (y = 0, pt.y = config->min_y; y < config->y_samples; ++y, pt.y += config->step_y)
    for (x = 0, pt.x = config->min_x; x < config->x_samples; ++x, pt.x += config->step_x)
      {
        if (n-- == 0) return;
        uvt->tri = p2tr_mesh_find_point_local2 (T, &pt, tr_prev, &uvt->u, &uvt->v);
        if (uvt->tri) p2tr_triangle_unref (uvt->tri);
        tr_prev = uvt->tri;
        ++uvt;
      }
}

#define P2TR_USE_BARYCENTRIC(u, v, A, B, C)                            \
    ((A) + (v) * ((B) - (A)) + (u) * ((C) - (A)))

/**
 * This is a general macro for using a UVT cache in order to render a
 * color interpolation triangular mesh. The reason this is a macro and
 * not a function is to allow using different numeric types for
 * representing colors
 * @param uvt_cache The buffer containing the UVT cache of the area to
 *        render. Should be of type  @ref P2trUVT*
 * @param uvt_cache_w The width of the area for which the UVT cache was
 *        created. Should be a positive integer.
 * @param uvt_cache_h The height of the area for which the UVT cache was
 *        created. Should be a positive integer.
 * @param dest The buffer in which the rendering result should be saved.
 *        Should be of type @ref cformat*
 * @param n The amount of pixels to render into dest. Should be a
 *        positive integer.
 * @param cformat The type of the data inside @ref dest. This can be any
 *        numeric type (double, float, int, ...)
 * @param cpp The amount of color channels per pixel, not including the
 *        alpha channel. Should be a positive integer.
 * @param pt2col The function which maps mesh points into colors. This
 *        function should be deterministic!
 * @param pt2col_user_data An additional parameter to @ref pt2col
 * @param alpha_last Specifies whether the alpha component should come
 *        after or before the other color channels. Should be a boolean.
 */
#define P2TR_MESH_RENDER_FROM_CACHE(uvt_cache,                         \
                                    uvt_cache_w,                       \
                                    uvt_cache_h,                       \
                                    dest,                              \
                                    n,                                 \
                                    cformat,                           \
                                    cpp,                               \
                                    pt2col,                            \
                                    pt2col_user_data,                  \
                                    alpha_last)                        \
G_STMT_START                                                           \
{                                                                      \
  P2trUVT *uvt_p = (uvt_cache);                                        \
  guint remain = n;                                                    \
                                                                       \
  P2trTriangle *tr_prev = NULL;                                        \
  guint x, y, i;                                                       \
  P2trPointToColorFuncC pt2col_c = (P2trPointToColorFuncC) (pt2col); \
                                                                       \
  cformat *colA = g_newa (cformat, (cpp));                             \
  cformat *colB = g_newa (cformat, (cpp));                             \
  cformat *colC = g_newa (cformat, (cpp));                             \
                                                                       \
  cformat *pixel = dest;                                               \
                                                                       \
  for (y = 0; y < (uvt_cache_w) && remain > 0; ++y)                    \
    for (x = 0; x < (uvt_cache_h) && remain > 0; ++x, --remain, ++uvt_p) \
      {                                                                \
        P2trTriangle *tr_now = uvt_p->tri;                             \
                                                                       \
        /* If we are outside of the triangulation, set alpha to   */   \
        /* zero and continue */                                        \
        if (tr_now == NULL)                                            \
          {                                                            \
            /* Remember that cpp does not include the alpha! */        \
            pixel[(alpha_last) ? (cpp) : 0] = 0;                       \
            pixel += cpp + 1;                                          \
          }                                                            \
        else                                                           \
          {                                                            \
            gdouble u = uvt_p->u;                                      \
            gdouble v = uvt_p->v;                                      \
            /* If the triangle hasn't changed since the previous  */   \
            /* pixel, then don't sample the color at the vertices */   \
            /* again, since that is an expensive process!         */   \
            if (tr_now != tr_prev)                                     \
              {                                                        \
                /* Get the points of the triangle in some fixed   */   \
                /* order, just to make sure that the computation  */   \
                /* goes the same everywhere                       */   \
                P2trPoint *A = P2TR_TRIANGLE_GET_POINT (tr_now, 0);    \
                P2trPoint *B = P2TR_TRIANGLE_GET_POINT (tr_now, 1);    \
                P2trPoint *C = P2TR_TRIANGLE_GET_POINT (tr_now, 2);    \
                /* At each point 'X' sample the color into 'colX' */   \
                pt2col_c (A, (gpointer) colA, pt2col_user_data);       \
                pt2col_c (B, (gpointer) colB, pt2col_user_data);       \
                pt2col_c (C, (gpointer) colC, pt2col_user_data);       \
                /* Set the current triangle */                         \
                tr_now = tr_prev;                                      \
              }                                                        \
                                                                       \
            /* We are inside the mesh, so set as opaque */             \
            if (! alpha_last) *pixel++ = (cformat) 1;                  \
            /* Interpolate the color using barycentric coodinates */   \
            for (i = 0; i < cpp; ++i)                                  \
              *pixel++ = (cformat) P2TR_USE_BARYCENTRIC (u, v,         \
                  colA[i], colB[i], colC[i]);                          \
            /* We are inside the mesh, so set as opaque */             \
            if (alpha_last) *pixel++ = (cformat) 1;                    \
          }                                                            \
      }                                                                \
}                                                                      \
G_STMT_END

#define P2TR_MESH_RENDER(mesh,                                         \
                         dest,                                         \
                         config,                                       \
                         pt2col,                                       \
                         pt2col_user_data,                             \
                         cache_render_func)                            \
G_STMT_START                                                           \
{                                                                      \
  gint n = (config)->x_samples * (config)->y_samples;                  \
  P2trUVT *uvt_cache = g_new (P2trUVT, n);                             \
                                                                       \
  p2tr_mesh_render_cache_uvt_exact ((mesh), uvt_cache, n, (config));   \
  cache_render_func (uvt_cache, (dest), n, (config), (pt2col),         \
      (pt2col_user_data));                                             \
                                                                       \
  g_free (uvt_cache);                                                  \
}                                                                      \
G_STMT_END

void
p2tr_mesh_render_from_cache_f (P2trUVT               *uvt_cache,
                               gfloat                *dest,
                               gint                   n,
                               P2trImageConfig       *config,
                               P2trPointToColorFuncF  pt2col,
                               gpointer               pt2col_user_data)
{
  P2TR_MESH_RENDER_FROM_CACHE (uvt_cache,
      config->x_samples, config->y_samples,
      dest, n, gfloat, config->cpp,
      pt2col, pt2col_user_data,
      config->alpha_last);
}

void
p2tr_mesh_render_f (P2trMesh              *mesh,
                    gfloat                *dest,
                    P2trImageConfig       *config,
                    P2trPointToColorFuncF  pt2col,
                    gpointer               pt2col_user_data)
{
  P2TR_MESH_RENDER (mesh, dest, config, pt2col, pt2col_user_data,
      p2tr_mesh_render_from_cache_f);
}

void
p2tr_mesh_render_from_cache_b (P2trUVT               *uvt_cache,
                               guint8                *dest,
                               gint                   n,
                               P2trImageConfig       *config,
                               P2trPointToColorFuncB  pt2col,
                               gpointer               pt2col_user_data)
{
  P2TR_MESH_RENDER_FROM_CACHE (uvt_cache,
      config->x_samples, config->y_samples,
      dest, n, guint8, config->cpp,
      pt2col, pt2col_user_data,
      config->alpha_last);
}

void
p2tr_mesh_render_b (P2trMesh              *mesh,
                    guint8                *dest,
                    P2trImageConfig       *config,
                    P2trPointToColorFuncB  pt2col,
                    gpointer               pt2col_user_data)
{
  P2TR_MESH_RENDER (mesh, dest, config, pt2col, pt2col_user_data,
      p2tr_mesh_render_from_cache_b);
}
