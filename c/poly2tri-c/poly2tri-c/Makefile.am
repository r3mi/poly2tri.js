SUBDIRS = p2t refine render

AM_LDFLAGS = -version-info $(P2TC_LIBRARY_VERSION)

P2TC_publicdir = $(includedir)/poly2tri-c-$(P2TC_API_VERSION)/poly2tri-c
export P2TC_publicdir
P2TC_public_HEADERS =

lib_LTLIBRARIES = libpoly2tri-c-@P2TC_API_VERSION@.la

libpoly2tri_c_@P2TC_API_VERSION@_la_LIBADD = p2t/libp2tc.la refine/libp2tc-refine.la render/libp2tc-render.la
libpoly2tri_c_@P2TC_API_VERSION@_la_SOURCES =
