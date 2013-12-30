[demo]: http://r3mi.github.io/poly2tri.js

- provide a minified build in `dist/poly2tri.min.js`, 
  using [UglifyJS 2](https://github.com/mishoo/UglifyJS2).

<a name="1.3.1"></a>
# 1.3.1 (2013-12-24)

- add Pan and Zoom capability to the [demo], using [KineticJS](http://kineticjs.com/).
- display pointer position in the [demo]
- internal:
    - use `bower` to manage front-end dependencies for the [demo]
    - use [Benchmark.js](http://benchmarkjs.com/) to track performances between releases

<a name="1.3.0"></a>
# 1.3.0 (2013-12-15)

- [Browserify](http://browserify.org/) is used to generate a UMD (universal module definition) 
  bundle, compatible with the various module systems. 
- the released code for browsers is now in the `dist/` directory 
  (the `src/` directory contains the source code for Node.js).
- add a Bower package
- move repository from Google Code to GitHub
- remove deprecated Namespace.js support

<a name="1.2.7"></a>
# 1.2.7 (2013-11-25)

- add additional check from Java version for intersecting constraints (issue #88)
- more test cases

<a name="1.2.6"></a>
# 1.2.6 (2013-11-24)

- publish as an official Node.js module on npm <https://npmjs.org/package/poly2tri>
- use karma for cross browsers testing
