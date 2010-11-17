// Montenegro server library | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// Montenegro extends Caterwaul (http://spencertipping.com/caterwaul) to operate in a node.js environment and provide REST web services. It provides asynchronous connectors, stream transformers,
// URL routing, and some other utilities that make non-blocking servers easier to develop.

  montenegro =

// Node.js variables.
// Caterwaul has a problem with node.js variables. Specifically, code that it compiles can't reach the 'require' variable, which ends up being really important. To fix this, Montenegro binds that
// variable within any compiled function by using a macro.

  caterwaul.configuration('montenegro.require_reference', function () {this.attribute('node_require', require)}).
           tconfiguration('std', 'montenegro.require',    function () {this.macro(qs[require], fn_[new this.ref(caterwaul.node_require)])}).

// Asynchronous connectors.
// Node programs often stream things, but sometimes convert those streams to whole pieces of data. This macro/function layer provides relatively simple ways of doing that. The idea is that there
// are a bunch of small combinators to transform streams in various ways. By composing them you can construct stream operators that let you do most things in point-free style.

// Final configuration.
// This configuration bundles together all of the modules to form the 'montenegro' function.

  configuration('montenegro', function () {this.configure('montenegro.require_reference montenegro.require')}).clone('montenegro');

// Generated by SDoc 
