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

/* The file format:
 * P <X> <Y> - Specify a Point (the default is that it belongs to the
 *             outline). The second line in the file must be of this type!
 * H <X> <Y> - Specify that all points from here on (including this one)
 *             belong to a new Hole. This will stop only on the next 'H'
 *             directive (which will create a new hole)
 * S <X> <Y> - Specify a Steiner point. Can appear anywhere.
 */
#include <stdlib.h>
#include <stdio.h>
#include <glib.h>

#include <poly2tri-c/p2t/poly2tri.h>

#include <poly2tri-c/refine/refine.h>
#include <poly2tri-c/render/svg-plot.h>
#include <poly2tri-c/render/mesh-render.h>

#include <string.h>

static gint refine_max_steps = 1000;
static gboolean debug_print = TRUE;
static gboolean verbose = TRUE;
static gchar *input_file = NULL;
static gchar *output_file = NULL;
static gboolean render_mesh = FALSE;
static gboolean render_svg = FALSE;
static gint mesh_width = 100;
static gint mesh_height = 100;

static GOptionEntry entries[] =
{
  { "refine-max-steps", 'r', 0, G_OPTION_ARG_INT,      &refine_max_steps, "Set maximal refinement steps to N", "N" },
  { "verbose",          'v', 0, G_OPTION_ARG_NONE,     &verbose,          "Print output?",                     NULL },
  { "debug",            'd', 0, G_OPTION_ARG_NONE,     &debug_print,      "Enable debug printing",             NULL },
  { "input",            'i', 0, G_OPTION_ARG_FILENAME, &input_file,       "Use input file at FILE_IN",         "FILE_IN" },
  { "output",           'o', 0, G_OPTION_ARG_FILENAME, &output_file,      "Use output file at FILE_OUT",       "FILE_OUT" },
  { "render-mesh",      'm', 0, G_OPTION_ARG_NONE,     &render_mesh,      "Render a color mesh of the result", NULL },
  { "mesh-width",       'w', 0, G_OPTION_ARG_INT,      &mesh_width,       "The width of the color mesh image", NULL },
  { "mesh-height",      'h', 0, G_OPTION_ARG_INT,      &mesh_height,      "The height of the color mesh iamge",NULL },
  { "render-svg",       's', 0, G_OPTION_ARG_NONE,     &render_svg,       "Render an outline of the result",   NULL },
  { NULL }
};

typedef enum {
  PTS_POINTS  = 'P',
  PTS_HOLE    = 'H',
  PTS_STEINER = 'S'
} PtsFilePartType;

typedef struct
{
  PtsFilePartType type;
  union {
    GPtrArray *points;
    P2tPoint  *point;
  } data;
} PtsFilePart;

/**
 * read_points_file:
 * @param path The path to the points & colors file
 * @param points An pointer to an array of pointers to @ref P2RrPoint will be returned
 *          here. NULL can be passed.
 * @param colors An pointer to an array of colors will be returned here. NULL can be
 *          passed.
 */
GQueue*
read_points_file (const gchar       *path)
{
  int line;
  FILE *f = fopen (path, "r");

  PtsFilePart *current_part, *temp_part;
  GPtrArray   *current_points;
  GQueue      *file_parts = g_queue_new ();

  if (f == NULL)
    {
      g_print ("Error! Could not read input file!");
      exit (1);
    }

  if (verbose)
    g_print ("Now parsing \"%s\"\n", path);

  current_part = g_slice_new (PtsFilePart);
  current_part->type = PTS_POINTS;
  current_points = current_part->data.points = g_ptr_array_new ();
  g_queue_push_tail (file_parts, current_part);

  line = 0;

  while (! feof (f))
    {
      char type;
      float x, y;
      int read_size;
      gboolean error = FALSE;

      ++line;

      read_size = fscanf (f, " %[a-zA-Z]", &type);

      if (read_size != 1)
        {
          g_error ("Expected a command type!");
          exit (1);
        }

      switch (type)
        {
          case PTS_HOLE:
            if (verbose) g_print ("Found a hole on directive %d\n", line);
            current_part = g_slice_new (PtsFilePart);
            current_part->type = PTS_HOLE;
            current_points = current_part->data.points = g_ptr_array_new ();
            g_queue_push_tail (file_parts, current_part);
            /* Intentionally no break! */

          case PTS_POINTS:
            read_size = fscanf (f, "%f %f", &x, &y);
            if ((error = (read_size != 2))) break;
            g_ptr_array_add (current_points, p2t_point_new_dd (x, y));
            break;

          case PTS_STEINER:
            if (verbose) g_print ("Found a steiner point on directive %d\n", line);
            temp_part = g_slice_new (PtsFilePart);
            temp_part->type = PTS_STEINER;
            g_queue_push_tail (file_parts, temp_part);
            read_size = fscanf (f, "%f %f", &x, &y);
            if ((error = (read_size != 2))) break;
            temp_part->data.point = p2t_point_new_dd (x, y);
            break;

          default:
            error = TRUE;
            break;
        }

      if (error)
        {
          g_error ("Bad directive number %d!", line);
          exit (1);
        }

      /* Consume additional spaces, to detect EOF properly */
      read_size = fscanf (f, " ");
    }

  fclose (f);

  return file_parts;
}

void
free_read_results (GQueue *file_parts)
{
  while (! g_queue_is_empty (file_parts))
    {
      PtsFilePart *temp = (PtsFilePart*) g_queue_pop_head (file_parts);
      GPtrArray *pts;
      gint i;
      switch (temp->type)
        {
          case PTS_HOLE:
          case PTS_POINTS:
            pts = temp->data.points;
            for (i = 0; i < pts->len; ++i)
              p2t_point_free (point_index (pts, i));
            g_ptr_array_free (pts, TRUE);
            break;

          case PTS_STEINER:
            p2t_point_free (temp->data.point);
            break;
        }
      g_slice_free (PtsFilePart, temp);
    }
  g_queue_free (file_parts);
}

/* Calculate a "deterministic random" color for each point
 * based on its memory address. Since we know that least-significant bytes
 * of the point address will change more than the mor-important ones, we
 * make sure to take them into consideration in all the color channels.
 */
static void
test_point_to_color (P2trPoint* point, guint8 *dest, gpointer user_data)
{
  gulong value = (gulong) point;
  guchar b1 = value & 0xff, b2 = (value & 0xff00) >> 2, b3 = (value & 0xff0000) >> 4;
  dest[0] = b1;
  dest[1] = (b1 ^ b2);
  dest[2] = (b1 ^ b3);
}

void
p2tr_write_rgb_ppm (FILE            *f,
                    guint8          *dest,
                    P2trImageConfig *config)
{
  gint x, y;
  guint8 *pixel;

  fprintf (f, "P3\n");
  fprintf (f, "%d %d\n", config->x_samples, config->y_samples);
  fprintf (f, "255\n");

  pixel = dest;

  for (y = 0; y < config->y_samples; y++)
    {
      for (x = 0; x < config->x_samples; x++)
        {
          if (pixel[3] <= 0.5)
            fprintf (f, "  0   0   0");
          else
            fprintf (f, "%3d %3d %3d", pixel[0], pixel[1], pixel[2]);

          if (x != config->x_samples - 1)
            fprintf (f, "   ");

          pixel += 4;
        }
      fprintf (f, "\n");
    }
}

gint main (int argc, char *argv[])
{
  FILE *svg_out = NULL, *mesh_out = NULL;
  gchar *svg_out_path, *mesh_out_path;

  GError *error = NULL;
  GOptionContext *context;

  GQueue *pts_parts;
  GList *pts_iter;
  PtsFilePart *cur_part;

  P2tCDT *cdt;
  P2trCDT *rcdt;
  P2trRefiner *refiner;

  context = g_option_context_new ("- Create a fine mesh from a given PSLG");
  g_option_context_add_main_entries (context, entries, NULL);

  if (!g_option_context_parse (context, &argc, &argv, &error))
    {
      g_print ("option parsing failed: %s\n", error->message);
      exit (1);
    }

  g_option_context_free (context);

  if (input_file == NULL)
    {
      g_print ("No input file given. Stop.");
      exit (1);
    }

  if (! g_file_test (input_file, G_FILE_TEST_EXISTS))
    {
      g_print ("Input file does not exist. Stop.");
      exit (1);
    }

  if (output_file == NULL && (render_svg || render_mesh))
    {
      g_print ("No output file given. Stop.");
      exit (1);
    }

  if (render_svg)
    {
      svg_out_path = g_newa (gchar, strlen (output_file) + 4);
      sprintf (svg_out_path, "%s.svg", output_file);

      if ((svg_out = fopen (svg_out_path, "w")) == NULL)
        {
          g_print ("Can't open the svg output file. Stop.");
          exit (1);
        }
    }

  if (render_mesh)
    {
      mesh_out_path = g_newa (gchar, strlen (output_file) + 4);
      sprintf (mesh_out_path, "%s.ppm", output_file);

      if ((mesh_out = fopen (mesh_out_path, "w")) == NULL)
        {
          g_print ("Can't open the mesh output file. Stop.");
          exit (1);
        }
    }

  pts_parts = read_points_file (input_file);

  for (pts_iter = pts_parts->head; pts_iter != NULL; pts_iter = pts_iter->next)
    {
      cur_part = (PtsFilePart*) pts_iter->data;
      switch (cur_part->type)
        {
          case PTS_POINTS:
          case PTS_HOLE:
            if (cur_part->data.points->len < 3)
              {
                g_error ("Expected at least 3 points in eahc point sequence!");
                exit (1);
              }
            break;

          default:
            break;
        }
    }

  pts_iter = pts_parts->head;
  cdt = p2t_cdt_new (((PtsFilePart*)pts_iter->data)->data.points);
  for (pts_iter = pts_iter->next; pts_iter != NULL; pts_iter = pts_iter->next)
    {
      cur_part = (PtsFilePart*) pts_iter->data;
      switch (cur_part->type)
        {
          case PTS_STEINER:
            p2t_cdt_add_point (cdt, cur_part->data.point);
            break;

          case PTS_HOLE:
            p2t_cdt_add_hole (cdt, cur_part->data.points);
            break;

          case PTS_POINTS:
            g_assert_not_reached ();
            break;

          default:
            break;
        }
    }

  p2t_cdt_triangulate (cdt);

  rcdt = p2tr_cdt_new (cdt);
  p2t_cdt_free (cdt);

  if (refine_max_steps > 0)
    {
      g_print ("Refining the mesh!\n");
      refiner = p2tr_refiner_new (G_PI / 6, p2tr_refiner_false_too_big, rcdt);
      p2tr_refiner_refine (refiner, refine_max_steps, NULL);
      p2tr_refiner_free (refiner);
    }

  if (render_svg)
    {
      g_print ("Rendering SVG outline!");
      p2tr_render_svg (rcdt->mesh, svg_out);
      fclose (svg_out);
    }

  if (render_mesh)
    {
      P2trImageConfig imc;
      guint8 *im;
      gdouble min_x, min_y, max_x, max_y;

      g_print ("Rendering color interpolation!");

      p2tr_mesh_get_bounds (rcdt->mesh, &min_x, &min_y, &max_x, &max_y);

      imc.cpp = 3;
      imc.min_x = min_x;
      imc.min_y = min_y;
      imc.step_x = (max_x - min_x) / ((gfloat) mesh_width - 1);
      imc.step_y = (max_y - min_y) / ((gfloat) mesh_height - 1);
      imc.x_samples = mesh_width;
      imc.y_samples = mesh_height;
      imc.alpha_last = TRUE;

      im = g_new (guint8, (1 + imc.cpp) * imc.x_samples * imc.y_samples);

      p2tr_mesh_render_b (rcdt->mesh, im, &imc, test_point_to_color, NULL);

      p2tr_write_rgb_ppm (mesh_out, im, &imc);
      fclose (mesh_out);

      g_free (im);
    }

  p2tr_cdt_free (rcdt);
  free_read_results (pts_parts);

  return 0;
}
