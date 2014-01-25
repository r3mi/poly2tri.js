# Bump on major changes to the library which should not even be
# compatiable with earlier versions
m4_define([p2tc_major_version], [0])

# Bump on new features and interface changes (feature releases)
m4_define([p2tc_minor_version], [1])

# Bump on revisions that do not break the interface (bug-fix releases)
m4_define([p2tc_micro_version], [0])

# A version string containing all three version numbers
m4_define([p2tc_real_version],
          [p2tc_major_version.p2tc_minor_version.p2tc_micro_version])
m4_define([p2tc_version], [p2tc_real_version])

# The version number used when linking with -llibpoly2tri-c-X.Y
m4_define([p2tc_api_version], [p2tc_major_version.p2tc_minor_version])

# The version number of the currently implemented interface (bump on
# every interface change)
m4_define([lt_current], [1])

# The revision number of the current interface (reset to 0 on every
# interface change)
m4_define([lt_revision], [0])

# Number of interfaces implemented minus one. The library should
# support all interfaces between current minus age and current.
# Increment by 1 on every new feature addition
# Reset to 0 if backwards compatiability is broken
m4_define([lt_age], [1])

# Declare the package details
AC_INIT([poly2tri-c],[p2tc_real_version],[lightningismyname@gmail.com])

P2TC_MAJOR_VERSION=p2tc_major_version
P2TC_MINOR_VERSION=p2tc_minor_version
P2TC_MICRO_VERSION=p2tc_micro_version
P2TC_VERSION=p2tc_version
P2TC_REAL_VERSION=p2tc_real_version
P2TC_API_VERSION=p2tc_api_version
AC_SUBST(P2TC_MAJOR_VERSION)
AC_SUBST(P2TC_MINOR_VERSION)
AC_SUBST(P2TC_MICRO_VERSION)
AC_SUBST(P2TC_VERSION)
AC_SUBST(P2TC_REAL_VERSION)
AC_SUBST(P2TC_API_VERSION)

P2TC_RELEASE=p2tc_api_version
AC_SUBST(P2TC_RELEASE)

P2TC_LIBRARY_VERSION="lt_current:lt_revision:lt_age"
AC_SUBST(P2TC_LIBRARY_VERSION)

# Output the auxilary build scripts to a subdirectory
AC_CONFIG_AUX_DIR([build-aux])

# Tell autoconf where to look for macros
AC_CONFIG_MACRO_DIR([m4])

# Initialize Automake with the following settings:
# Relax some of the GNU requirements
# Report all potential warnings and report all warnings as errors
AM_INIT_AUTOMAKE([foreign -Wall -Werror])

# Enable silent rules is available
m4_ifdef([AM_SILENT_RULES], [AM_SILENT_RULES([yes])])

# Define maintainer mode
AM_MAINTAINER_MODE

# On automake 1.12 we will need to call AM_PROG_AR
# However, on some old versions it does not exist, so use and ifdef
m4_ifdef([AM_PROG_AR], [AM_PROG_AR])

# Initialize libtool
LT_INIT

# Find a C compiler
AC_PROG_CC

# Finding a function which may be built-in in GCC is known to fail when using
# -Werror, so we will only add that option afterwards. For more information, see
# the discussion at http://lists.gnu.org/archive/html/bug-autoconf/2010-01/msg00031.html

# Pedantic errors please
CFLAGS="$CFLAGS -Wall -ansi -pedantic"

# Find the standard math functions
# Taken from http://www.flameeyes.eu/autotools-mythbuster/autoconf/finding.html
AC_CHECK_HEADERS([math.h])
AC_SEARCH_LIBS([log10], [m], [], [
  AC_MSG_ERROR([unable to find the log10() function])
])

# Warnings as errors please
CFLAGS="$CFLAGS -Werror"

# Find GLib support via pkg-config
PKG_CHECK_MODULES([GLIB], [glib-2.0 >= 2.28])

CFLAGS="$CFLAGS $GLIB_CFLAGS"
LDFLAGS="$LDFLAGS $GLIB_LIBS"
LIBS="$LIBS $GLIB_LIBS"

# Allow building with debugging symbols
AC_MSG_CHECKING([whether to turn on debugging])
AC_ARG_ENABLE(debug,
              AS_HELP_STRING([--enable-debug],[turn on debugging (default=no)]),
              if eval "test x$enable_debug = xyes"; then
                DEBUGFLAG="-g"
              fi)

if test -n "$DEBUGFLAG"; then
  AC_MSG_RESULT([yes])
  CFLAGS="$DEBUGFLAG $CFLAGS"
else
  AC_MSG_RESULT([no])
fi

# Allow forcing a validation of the CDT after each refinement step
AC_MSG_CHECKING([whether to enable CDT validation during refinement])
AC_ARG_ENABLE(cdt-validation,
              AS_HELP_STRING([--enable-cdt-validation],[turn on CDT validation during refinement (WARNING: SLOW!, default=no)]),
              if eval "test x$enable_cdt_validation = xyes"; then
                P2TR_ENABLE_CDT_VALIDATION="TRUE"
              fi)

if test -n "$P2TR_ENABLE_CDT_VALIDATION"; then
  CDTVFLAG="-DP2TR_CDT_VALIDATE=TRUE"
  AC_MSG_RESULT([yes])
else
  CDTVFLAG="-DP2TR_CDT_VALIDATE=FALSE"
  AC_MSG_RESULT([no])
fi

CFLAGS="$CDTVFLAG $CFLAGS"

# Output this configuration header file
AC_CONFIG_HEADERS([config.h])

# Output these files
AC_CONFIG_FILES([
	poly2tri-c.pc			\
	bin/Makefile			\
	poly2tri-c/Makefile		\
	poly2tri-c/p2t/sweep/Makefile	\
	poly2tri-c/p2t/common/Makefile	\
	poly2tri-c/p2t/Makefile		\
	poly2tri-c/render/Makefile	\
	poly2tri-c/refine/Makefile	\
	Makefile			\
	])

# Now really output
AC_OUTPUT
