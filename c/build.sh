#!/bin/sh
# 
# Build script for for the emscripten C build of poly2tri.js
# 
# (c) 2014, Rémi Turboult
# All rights reserved.
# Distributed under the 3-clause BSD License, see LICENSE.txt
#

here=`dirname $0`
src=${here}/poly2tri-c/poly2tri-c/p2t
build=${here}/../build

mkdir -p ${build}


# Extract C functions to export
FUNCS=`awk -F "'" -vORS="," -vOFS="" -vq="'" '/cwrap/{print q, "_", $2, q}' ${here}/*.js | sed "s/,$/\n/"`
FUNCS="[${FUNCS}]"


# emscripten shall be in PATH
emcc \
    -I ${here} \
    -I ${src} \
    -O0 \
    -s EXPORTED_FUNCTIONS="${FUNCS}" \
    ${here}/*.c ${src}/common/*.c ${src}/sweep/*.c  -o ${build}/c.js 



exit


    --closure 1 \
    --llvm-lto 3 \
    -s FORCE_ALIGNED_MEMORY=1 \
    -s CLOSURE_ANNOTATIONS=1 \

# -s EXPORT_NAME='CDTModule';
# -s LIBRARY_DEBUG=1 \
# -s VERBOSE=1


