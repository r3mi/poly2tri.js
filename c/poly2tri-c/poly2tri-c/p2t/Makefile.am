SUBDIRS = sweep common

noinst_LTLIBRARIES = libp2tc.la

P2TC_P2T_publicdir = $(P2TC_publicdir)/p2t
export P2TC_P2T_publicdir
P2TC_P2T_public_HEADERS = poly2tri.h

libp2tc_la_LIBADD = common/libp2tc-common.la sweep/libp2tc-sweep.la
libp2tc_la_SOURCES =
