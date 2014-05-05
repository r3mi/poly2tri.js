[demo]: http://r3mi.github.io/poly2tri.js
[Browserify]: http://browserify.org/

<a name="1.3.5"></a>
# 1.3.5 (2014-05-05)

- new `SweepContext.addHoles` method, to add multiple holes with one call
- bower.json now points to the un-minified source, as per the [bower.json spec](https://github.com/bower/bower.json-spec).
  Reported by Matt DesLauriers @mattdesl
- better jsdoc annotations
- add additional test cases and improve unit tests performances

<a name="1.3.4"></a>
# 1.3.4 (2014-04-25)

- performance improvement. Replace all `Math.atan2` calls by dot vectors computations, producing about
  5 to 10% performance improvement on the benchmark.
  [Idea by Andrey Diduh](https://groups.google.com/forum/#!topic/poly2tri/gDpr3lj3p0I)
- add additional test cases

<a name="1.3.3"></a>
# 1.3.3 (2014-01-26)

- upgrade [Browserify]. As a side effect, the generated bundle `dist/poly2tri.js` 
  is more compatible with the buggy `ExtendScript` parser (who chokes on 
  nested ternary operators `?:?:`).
- internal : improve benchmark code to track performances

<a name="1.3.2"></a>
# 1.3.2 (2014-01-11)

- provide a minified build in `dist/poly2tri.min.js`, 
  using [UglifyJS 2](https://github.com/mishoo/UglifyJS2).
- add a `poly2tri.VERSION` string
- merge some code updates from C++ version
- add more tests
- improve code modularity

<a name="1.3.1"></a>
# 1.3.1 (2013-12-24)

- add Pan and Zoom capability to the [demo], using [KineticJS](http://kineticjs.com/).
- display pointer position in the [demo]
- internal:
    - use `bower` to manage front-end dependencies for the [demo]
    - use [Benchmark.js](http://benchmarkjs.com/) to track performances between releases

<a name="1.3.0"></a>
# 1.3.0 (2013-12-15)

- [Browserify] is used to generate a UMD (universal module definition) 
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
