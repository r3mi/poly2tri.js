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
FUNCS=`${here}/exported_functions.js ${here}/*.js`

# emscripten shall be in PATH
emcc \
    -Wall \
    -I ${here} \
    -I ${src} \
    -O2 \
    --llvm-lto 3 \
    -s ASM_JS=1 \
    --closure 1 \
    -s CLOSURE_ANNOTATIONS=1 \
    -s FORCE_ALIGNED_MEMORY=1 \
    -s EXPORTED_FUNCTIONS="${FUNCS}" \
    ${here}/*.c ${src}/common/*.c ${src}/sweep/*.c  -o ${build}/c.js 


exit


# break compilation -> investigate !!
    -s CHECK_SIGNS=1 \


#debug
    -s LIBRARY_DEBUG=1 \
    -s VERBOSE=1 \
    -v \
    -s ASSERTIONS=2 \
    -s DOUBLE_MODE=0 \
    -s CHECK_HEAP_ALIGN=1 \

