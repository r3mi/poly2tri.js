#!/bin/sh

# This is an updated version of the autogen script from BABL
# See http://gegl.org/babl/ for the source code and more information

# This script does all the magic calls to automake/autoconf and
# tools that are needed to configure a Git checkout. As described in
# the file README, you need a couple of extra tools to run this script
# successfully.
#
# If you are compiling from a released code distribution and not
# directly from the source tree, you don't need these tools or this
# script. Instead, just call ./configure directly.

# Check for the directory containing the source files - try either the
# 'srcdir' environment variable, the full path to the current directory,
# or finally just settle for the relative path '.'
test -n "$srcdir" || srcdir=`dirname "$0"`
test -n "$srcdir" || srcdir=.

# Save the directory in which we started the execution, so that to
# return to it at the end
ORIGDIR=`pwd`

# Now enter the source directory
cd $srcdir

# Try to find an autoreconf tool. If none found, show an error message
AUTORECONF=`which autoreconf`
if test -z $AUTORECONF; then
        echo "*** No autoreconf found, please intall it ***"
        exit 1
fi

# Now invoke autoreconf which will invoke all the gnu auto tools in the
# right order. It works on the current directory and that is why we had
# to enter the source directory
$AUTORECONF --force --install --verbose

# Go back to the original directory
cd $ORIGDIR

# Now, unless the NOCONFIGURE environment variable is set, run the
# configure script with the parameters passed to this script
test -n "$NOCONFIGURE" || "$srcdir/configure" "$@"
