"use strict";

var ClosureCompiler = require("closurecompiler");

ClosureCompiler.compile([
    "src/advancingfront.js",
    "src/point.js",
    "src/pointerror.js",
    "src/poly2tri.js",
    "src/sweep.js",
    "src/sweepcontext.js",
    "src/triangle.js",
    "src/utils.js",
    "src/xy.js"
], {
    // Options in the API exclude the "--" prefix
    compilation_level: "ADVANCED_OPTIMIZATIONS",
    warning_level: "VERBOSE",
    common_js_entry_module: 'src/poly2tri.js',
    common_js_module_path_prefix: 'src/',
    language_in: "ECMASCRIPT5_STRICT",
    module: "auto",
    process_common_js_modules: true,
    use_types_for_optimization: true,
    // externs: "node",
    externs: ["node_modules/closurecompiler/node_modules/closurecompiler-externs/core.js"],
    module_output_path_prefix: "temp/closure/",
    generate_exports: true,
    create_name_map_files: true
},
function(error, result) {
    if (error instanceof Error) {
        throw(error);
    }
    process.stderr.write(error);
    process.stdout.write(result);
});
