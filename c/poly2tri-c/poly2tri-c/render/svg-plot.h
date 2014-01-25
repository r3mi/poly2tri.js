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

#ifndef __P2TC_RENDER_SVG_PLOT_H__
#define __P2TC_RENDER_SVG_PLOT_H__

#include <poly2tri-c/refine/refine.h>

typedef guint8 P2trSVGColor[4];

typedef struct
{
  gboolean     stroke;
  gdouble      stroke_width;
  P2trSVGColor stroke_color;
  gboolean     fill;
  P2trSVGColor fill_color;
  gdouble      opacity;
} P2trSVGContext;

void p2tr_render_svg_init          (FILE              *out,
                                    const P2trVector2 *bottom_left,
                                    const P2trVector2 *top_right);

void p2tr_render_svg_draw_line     (FILE              *out,
                                    P2trSVGContext    *context,
                                    const P2trVector2 *start,
                                    const P2trVector2 *end);

void p2tr_render_svg_draw_triangle (FILE              *out,
                                    P2trSVGContext    *context,
                                    const P2trVector2 *p1,
                                    const P2trVector2 *p2,
                                    const P2trVector2 *p3);

void p2tr_render_svg_draw_circle   (FILE              *out,
                                    P2trSVGContext    *context,
                                    const P2trVector2 *center,
                                    gdouble            radius);

void p2tr_render_svg_finish        (FILE              *out);

void p2tr_render_svg               (P2trMesh          *mesh,
                                    FILE              *out);

#endif
