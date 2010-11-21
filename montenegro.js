// Montenegro server library | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// Montenegro extends Caterwaul (http://spencertipping.com/caterwaul) to operate in a node.js environment and provide REST web services. It provides asynchronous connectors, stream transformers,
// URL routing, and some other utilities that make non-blocking servers easier to develop.

  caterwaul.

// Node.js variables and Montenegro reference.
// Caterwaul has a problem with node.js variables. Specifically, code that it compiles can't reach the 'require' variable, which ends up being really important. To fix this, Montenegro binds that
// variable within any compiled function by using a macro.

   configuration('montenegro.core',           function () {this.field('montenegro', {require: require})}).
  tconfiguration('std', 'montenegro.require', function () {this.configure('montenegro.core').macro(qs[require],    let[ref = new this.ref(this.montenegro.require)] in fn_[ref])}).
  tconfiguration('std', 'montenegro.ref',     function () {this.configure('montenegro.core').macro(qs[montenegro], let[ref = new this.ref(this.montenegro)]         in fn_[ref])}).

// REST wrapper.
// Most applications do (or should) use a REST API for data management. Standard resources can be addressed by Montenegro clients using wrapper functions; this interface provides the server-side
// HTTP interface to make that happen. You can define a service with the http[] macro, or longhand with the 'montenegro.http.service()' constructor.

//   Defining services.
//   The most obvious case is to provide a GET/POST service that is tied to a database (Montenegro doesn't use PUT or DELETE, though I may add them later). Here's what that looks like:

//   | var db = caterwaul.db.file('some-directory');
//     var service = http['/people/_'][get  = db($[1])(ok),
//                                     post = db($[1])(post_json())(ok)];
//     require('http').createServer(fn[req, res][service(req, res)]).listen(8080);

//   Equivalently, you can use the value-space constructor to get a first-class path (which may be more useful if you want to create a bunch of services with similar behaviors):

//   | var service = montenegro.http.service('/people/_',
//                     {get: fn[context][db(context.$[1])(context.ok)],
//                     post: fn[context][db(context.$[1])(context.post_json())(context.ok)]});

//   You get these variables within the context of a service definition:

//   | 1. The URL match-group variable, $ -- the value returned from the constructed regexp's .exec() method. Each '_' in the URL is a wildcard.
//     2. ok(): a function that returns 200 OK with the JSON object given.
//     3. error(): a function that replies with 500 and a string message if you give it one.
//     4. not_found(): a function that replies with 404 and a string message if you give it one.
//     5. post_data and post_json() (for POSTs) -- a variable and a function that return the original string POST-data and JSON-decoded POST-data, respectively.
//     6. request: the original HTTP request object.
//     7. response: the original HTTP response object.

//   You can compose services by calling each one in succession:

//   | var s1 = http[...][...], s2 = http[...][...];
//     require('http').createServer(fn[req, res][s1(req, res), s2(req, res)]).listen(8080);

//   Because writing this code gets old quickly, you can use the variadic service-composition function:

//   | var s1 = http[...][...], s2 = http[...][...];
//     var service = montenegro.http.compose(s1, s2);
//     require('http').createServer(service).listen(8080);

    tconfiguration('std seq', 'montenegro.class.http', function () {
      this.configure('montenegro.core').montenegro.http = {compose: fn_[let[as = sa<< arguments] in fn[request, response][x(request, response) <se< as]]};
      this.montenegro.http.service(path, handlers) =
        let*[path_pattern = new RegExp('^#{path.replace(/[*+?()\[\]]/g, "\\$1").replace(/_/g, "([^/=?&]+)")}/?$')] in
        fn[request, response][match && handlers[method] && let[pieces = []][request.on('data', fn[piece][pieces.push(piece)]), request.on('end', fn_[cc(pieces.join(''))])],
          where*[cc(data)          = handlers[method](context_for(data)), match = path_pattern.exec(request.url), method = request.method.toLowerCase(),
                 context_for(data) = {request: request, response: response, post_data: data, post_json: fn_[JSON.parse(data)], $: match,
                                           ok: fn[json]  [response.writeHead(200, {'content-type': 'application/json'}), response.end(JSON.stringify(json))],
                                        error: fn[reason][response.writeHead(500, {'content-type': 'text/plain'}),       response.end(reason)],
                                    not_found: fn[reason][response.writeHead(404, {'content-type': 'text/plain'}),       response.end(reason)]}]]}).

    tconfiguration('std error', 'montenegro.http', function () {
      let[hash_pair = this.parse('_name: _value')] in
      this.configure('montenegro.class.http').rmacro(qs[http[_][_]],
        fn[path, methods][qs[_service(_path, _handlers)].replace({_service: service(), _path: path, _handlers: handlers()}),
          where*[service  = fb_[new this.ref(this.montenegro.http.service)],
                 handlers = fb_[new this.syntax('{', methods.flatten(',').map(fn[m][hash_pair.replace(method(m))]))],
                 method   = fb[m][match ? {_name: match[0], _value: context(match[1])} : error.fail[new Error('montenegro.http: invalid service: #{m.serialize()}')],
                   where[match         = m.match(qs[_ = _]),
                         context(tree) = qs[fn[context][_tree, where[$ = context.$, ok = context.ok, error = context.error, not_found = context.not_found, post_data = context.post_data,
                                                                     post_json = context.post_json, request = context.request, response = context.response]]].replace({_tree: tree})]]]])}).

// Final configuration.
// This configuration bundles all of the configurations together.

  configuration('montenegro', function () {this.configure('montenegro.require montenegro.ref montenegro.http')});

// Generated by SDoc 
