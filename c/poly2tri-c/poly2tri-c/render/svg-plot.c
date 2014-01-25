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

#include <stdlib.h>
#include <stdio.h>
#include <math.h>
#include <glib.h>

#include <poly2tri-c/refine/triangulation.h>

#include "svg-plot.h"

#define P2TR_SVG_NEWLINE "\n"

void
p2tr_render_svg_init (FILE              *out,
                      const P2trVector2 *bottom_left,
                      const P2trVector2 *top_right)
{
  gdouble real_width = top_right->x - bottom_left->x;
  gdouble real_height = top_right->y - bottom_left->y;

  /* Begin with the header of the document */
  fprintf (out, "<?xml version=\"1.0\" standalone=\"no\"?>%s",
      P2TR_SVG_NEWLINE);
  fprintf (out, "<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\"%s",
      P2TR_SVG_NEWLINE);
  fprintf (out, "\"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">%s",
      P2TR_SVG_NEWLINE);

  fprintf (out, "<svg xmlns=\"http://www.w3.org/2000/svg\""
                "     version=\"1.1\"%s", P2TR_SVG_NEWLINE);

  fprintf (out, "     viewBox=\"%f %f %f %f\"%s",
      + bottom_left->x, - (bottom_left->y + real_height),
      + real_width,     + real_height,
      P2TR_SVG_NEWLINE);

  fprintf (out, "     preserveAspectRatio=\"xMidYMid meet\"%s",
      P2TR_SVG_NEWLINE);

  /* Close the SVG tag */
  fprintf (out, ">%s", P2TR_SVG_NEWLINE);

  fprintf (out, "<g transform=\"scale(1,-1)\">%s",
      P2TR_SVG_NEWLINE);
}

void
p2tr_render_svg_finish (FILE *out)
{
  fprintf (out, "</g>%s", P2TR_SVG_NEWLINE);
  fprintf (out, "</svg>%s", P2TR_SVG_NEWLINE);
}

static void
p2tr_render_svg_style (FILE           *out,
                       P2trSVGContext *context,
                       gboolean        no_fill)
{
  fprintf (out, "style=\"");
    {
      if (context->stroke)
        {
          fprintf (out, "stroke: #%02x%02x%02x; stroke-opacity: %f; ",
              context->stroke_color[0], context->stroke_color[1],
              context->stroke_color[2], context->stroke_color[3] / 255.0);
          fprintf (out, "stroke-:width: %f; stroke-linejoin: round; ",
              context->stroke_width);
        }

      if (context->fill && ! no_fill)
        fprintf (out, "fill: #%02x%02x%02x; fill-opacity: %f; ",
            context->fill_color[0], context->fill_color[1],
            context->fill_color[2], context->fill_color[3] / 255.0);

      if (context->opacity != 1)
        fprintf (out, "opacity: %f; ", context->opacity);
    }
  fprintf (out, "\"");
}

void
p2tr_render_svg_draw_line (FILE              *out,
                           P2trSVGContext    *context,
                           const P2trVector2 *start,
                           const P2trVector2 *end)
{
  fprintf (out, "<line x1=\"%f\" y1=\"%f\" x2=\"%f\" y2=\"%f\" ",
      start->x, start->y, end->x, end->y);
  p2tr_render_svg_style (out, context, TRUE);
  fprintf (out, " />%s", P2TR_SVG_NEWLINE);
}

void
p2tr_render_svg_draw_triangle (FILE              *out,
                               P2trSVGContext    *context,
                               const P2trVector2 *p1,
                               const P2trVector2 *p2,
                               const P2trVector2 *p3)
{
  fprintf (out, "<polygon points=\"%f,%f %f,%f %f,%f\" ",
      p1->x, p1->y, p2->x, p2->y, p3->x, p3->y);
  p2tr_render_svg_style (out, context, FALSE);
  fprintf (out, " />%s", P2TR_SVG_NEWLINE);
}

void
p2tr_render_svg_draw_circle (FILE              *out,
                             P2trSVGContext    *context,
                             const P2trVector2 *center,
                             gdouble            radius)
{
  fprintf (out, "<circle cx=\"%f\" cy=\"%f\" r=\"%f\" ",
      center->x, center->y, radius);
  p2tr_render_svg_style (out, context, FALSE);
  fprintf (out, " />%s", P2TR_SVG_NEWLINE);
}

void
p2tr_render_svg (P2trMesh *mesh,
                 FILE     *out)
{
  P2trHashSetIter  siter;
  P2trTriangle    *tr;
  P2trPoint       *pt;

  /* Colors taken from the Tango Icon Theme color palette */
  P2trSVGContext  TRI = {
      TRUE,
      1,
      /* Sky Blue 3 */
      { 32, 74, 135, 255 },
      TRUE,
      /* Sky Blue 1 */
      { 114, 159, 207, 255 },
      1
  };

  P2trSVGContext PT = {
      FALSE,
      0,
      /* Orange 3 */
      { 206, 92, 0, 1 },
      TRUE,
      /* Orange 1 */
      { 245, 121, 0, 255 },
      1
  };

  P2trVector2 bottom_left, top_right;

  p2tr_mesh_get_bounds (mesh,
      &bottom_left.x, &bottom_left.y,
      &top_right.x,   &top_right.y);

  bottom_left.x -= 10;
  bottom_left.y -= 10;
  top_right.x += 10;
  top_right.y += 10;
  p2tr_render_svg_init (out, &bottom_left, &top_right);

  p2tr_hash_set_iter_init (&siter, mesh->triangles);
  while (p2tr_hash_set_iter_next (&siter, (gpointer*)&tr))
    p2tr_render_svg_draw_triangle (out, &TRI,
        &P2TR_TRIANGLE_GET_POINT(tr, 0)->c,
        &P2TR_TRIANGLE_GET_POINT(tr, 1)->c,
        &P2TR_TRIANGLE_GET_POINT(tr, 2)->c);

  p2tr_hash_set_iter_init (&siter, mesh->points);
  while (p2tr_hash_set_iter_next (&siter, (gpointer*)&pt))
    p2tr_render_svg_draw_circle (out, &PT, &pt->c, 1);

  p2tr_render_svg_finish (out);
}
