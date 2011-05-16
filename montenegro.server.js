// Montenegro server library | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// Montenegro extends Caterwaul (http://spencertipping.com/caterwaul) to operate in a node.js environment and provide an RPC endpoint.

  caterwaul.

// Node.js variables and Montenegro reference.
// Caterwaul has a problem with node.js variables. Specifically, code that it compiles can't reach the 'require' variable, which ends up being really important. To fix this, Montenegro binds that
// variable within any compiled function by using a macro.

   configuration('montenegro.core', function () {this.shallow('montenegro', {require: require})}).

// URL router.
// Montenegro gives you a quick proxy function to route requests based on URL patterns. This makes a suitable server if you want to promote it into one (and in fact it is the function you get
// back when you create a new server). Configuration is done like this:

// | var router = caterwaul.montenegro.route.url();
//   router.on('/foo', 'GET', fn[request, response][response /se[_.writeHead(200), _.end('bar')]]);
//   router.not_found(request, response) = response /se[_.writeHead(404), _.end('Bummer dude, not found')];
//   router.on('/services', 'GET', router.service_listing);        // Show a list of registered URLs

// Because routers provide the same interface they accept, you can nest them and create proxies. The last matching pattern is the one that handles the URL, so you can always refine URL matches
// (or override them) by adding new on() handlers.

// Each service built with this interface exposes a list of methods. You can enable it by using the server.service_listing method as the target of an 'on' invocation. You may not want to do this,
// but if exposing the request handlers is a security flaw then there is probably a larger problem with the design of the application.

  tconfiguration('std seq', 'montenegro.route.url', function () {
    this.configure('montenegro.core').montenegro /se[(_.route = _.route || {}) /se[
      _.url() = l*[result(request, response) = result.route(request, response)] in
                result /se[_.handlers                     = seq[~[]],
                           _.on(pattern, method, handler) = this /se[_.handlers.push({url: pattern, method: method, handler: handler})],
                           _.route(request, response)     = this /se[(_.handler_for(request.url, request.method) || _.not_found).call(_, request, response)],

                           _.not_found(request, response) = response /se[_.writeHead(404), _.end('#{request.url} was not found.')],

                           _.service_listing(req, res)    = res /se.r[r.writeHead(200), r.end(seq[_.handlers *['#{_.url} (#{_.method})']].join('\n'))],

                           _.handlers_for(url, method)    = seq[this.handlers %[(_.url.test ? _.url.test(url) : _.url === url) && (! _.method || _.method === method)] *[_.handler]],
                           _.handler_for(url, method)     = this.handlers_for(url, method).pop()]]]}).

// Server construction.
// You construct a Montenegro server instance by calling montenegro.server(port). The server starts running immediately. Each server has an internal routing table that maps URL patterns to
// request handlers. (A request handler is just a function that Node's createServer would accept.)

  tconfiguration('std seq', 'montenegro.server', function () {
    l[require = this.configure('montenegro.core').montenegro.require] in this.configure('montenegro.route.url').montenegro /se[
      _.server(port)      = caterwaul.util.merge(_.route.url(), _.server.extensions) /se[require('http').createServer(_).listen(port || 8080, '0.0.0.0')],
      _.server.extensions = {}]}).

// Trivial HTML construction.
// This gives you a quick way to throw a page together. The key here is that you quote a syntax tree that will end up being executed on the client-side when jQuery loads. For example, to say
// hello world:

// | response /se[_.writeHead(200, {'content-type': 'text/html'}),
//                _.end(montenegro.html(qs[$('body').append(html[h1('Hello world!')])]))];

// This builds a client page that loads caterwaul.all.js, montenegro.client.js, and jQuery. By default, caterwaul.all.js and montenegro.client.js come from my webserver (which sometimes is down),
// but you can change where it requests these scripts by setting _.html.caterwaul_path, _.html.montenegro_path, and _.html.jquery_path.

  tconfiguration('std', 'montenegro.html', function () {
    this.configure('montenegro.core').montenegro /se[
      _.html(t) = l*[html_header()       = l[s(src) = '<script src="#{src}"></script>'] in
                                           '<!doctype html><html><head>#{s(_.html.jquery_path)}#{s(_.html.caterwaul_path)}#{s(_.html.montenegro_path)}',
                     wrap_initializer(s) = '<script>$(caterwaul.clone("std opt continuation seq parser montenegro")(#{s}))</script>',
                     html_footer()       = '</head><body></body></html>'] in
                  html_header() + wrap_initializer(qs[function () {return _t}].replace({_t: t}).serialize()) + html_footer(),

      _.html /se[_.caterwaul_path  = 'http://spencertipping.com/caterwaul/caterwaul.all.js',
                 _.montenegro_path = 'http://spencertipping.com/montenegro/montenegro.client.js',
                 _.jquery_path     = 'http://ajax.googleapis.com/ajax/libs/jquery/1.5.0/jquery.min.js']]}).

// RPC endpoints.
// You can create an RPC service on a URL. The RPC endpoint wraps the function in a CPS-converted HTTP request/response proxy that listens for POST requests on a given URL, expects a JSON array
// in the body, and converts the body into a list of parameters for the function you specify. Your function can access the reply continuation by either returning normally or invoking 'this' on
// the reply object.

// All listeners are CPS-converted, so you can have coroutine-based communication between the client and server. For example, this is a broadcast chat server (which relies on singly re-entrant
// continuations for replies, if you want to think about it as a regular procedure call):

// | var clients = seq[~[]];
//   caterwaul.montenegro.server(8080) /se[_.rpc('/chat',      fn_[clients.push(this)]).
//                                           rpc('/chat/send', fn[message][seq[clients *![_(message)]], clients = seq[~[]], this('OK')])];

// The client code for this example is in montenegro.client.js.sdoc.

// RPC services can provide documentation. This is an optional second parameter, e.g:

// | chat_service.rpc('/chat', 'Clients should long-loop this URL to be notified of messages that are sent.', fn_[...]);

// Any clients who GET the URL will be served the documentation string as plain text. If you don't specify any documentation, GET requests will be sent a generic 'there's a service here, but no
// documentation for it' message as plain text. The service will also send potentially useful diagnostic messages with 400 error codes if you're using it incorrectly.

  tconfiguration('std continuation', 'montenegro.server.rpc', function () {
    l*[html = this.configure('montenegro.html').montenegro.html] in

    this.configure('montenegro.server').montenegro.server.extensions /se[
      _.rpc(url, _documentation, _fn) =
        this /se.t[install_json_post_handler(t),
                   install_documentation_handler(t),
                   install_test_page(t),

                   where*[documentation = _fn ? _documentation : '#{url} service (no documentation provided)',
                          fn            = _fn || _documentation,

                          rpc           = _.rpc,

                          install_json_post_handler(server)     = server.on(url,          'POST', fn[req, res][json_from(req)(fn[json][fn.apply(json_to(res), json)])]),
                          install_documentation_handler(server) = server.on('#{url}/doc', 'GET',  fn[req, res][res /se[_.writeHead(200, {'content-type': 'text/plain'}), _.end(doc)]]),
                          install_test_page(server)             = server.on(url,          'GET',  fn[req, res][res /se[_.writeHead(200, {'content-type': 'text/html'}),  _.end(rpc.testpage())]]),

                          json_from(request)(cc) = l[pieces = []] in request /se[_.on('data', pieces/mb/push),
                                                                                 _.on('end', fn_[unwind_protect[rpc.error(e)][cc(JSON.parse(pieces.join('')))]])],

                          error_to (response)(e) = response /se[_.writeHead(400, {'content-type': 'text/plain'}), _.end(e.toString())],
                          json_to  (response)()  = l[as = Array.prototype.slice.call(arguments)] in
                                                   response /se[_.writeHead(200, {'content-type': 'application/json'}), _.end(JSON.stringify(as))]]],

//   Error trapping.
//   If an error occurs, the client receives the toString() produced by the error object and a stack trace is logged to the console. However, you may want to do something different. If you do,
//   change montenegro.server.rpc.error(e).

      _.rpc.error(e) = e /se[console.log(_)],

//   Test pages.
//   If you use the server as shown above, you'll get a test page for each RPC endpoint. For example, the test page for the '/chat' URL is '/chat'. You can navigate to this page and send requests
//   to the RPC to verify that it's working correctly. This is enabled in production-mode as well as development mode; it's my attempt to encode Kerckhoffs' principle
//   (http://en.wikipedia.org/wiki/Kerckhoffs'_principle) into the framework to prevent bad security decisions.

      _.rpc.testpage() = html(qs[$('head').append(html[link *rel('stylesheet') *href('http://fonts.googleapis.com/css?family=Droid+Sans+Mono&subset=latin'),
                                                       link *rel('stylesheet') *href('http://spencertipping.com/montenegro/style/testpage.css')]),

                                 $('body').append(html[div(div.header(h1('RPC shell'), h2.documentation(span.loading('loading documentation...'))),
                                                           p('You can evaluate code below. ', code('rpc()'), ' is the RPC connector function for the API, and ', code('log()'),
                                                             ' can be used to log values. Your code will be macroexpanded under std, seq, opt, parser, montenegro, and continuation.'),
                                                           div(button.run('Run')),
                                                           textarea.code /val('l/cps[x <- rpc("Hello world", _)][log(x)]'),
                                                           div.log)]),

                                 window.rpc = caterwaul.montenegro.rpc(url),
                                 $('.run').click(fn_[unwind_protect[error(e)][caterwaul.clone('std seq continuation opt montenegro')('(function () {#{$("textarea.code").val()}})')()]]),
                                 $.get('#{url}/doc', fn[doc][$('.documentation').empty().append(doc)]),

                                 where*[entry(x) = html[div.entry(code(x), ' ', a('[x]')/click(fn_[$(this).parent().remove()]))],
                                        log      = window.log(x)   = $('div.log').append(entry(JSON.stringify(x))),
                                        error    = window.error(x) = $('div.log').append(entry(x.toString()).addClass('error')),
                                        url      = document.location.href]])]}).

// HTML server configuration.
// You can send HTML pages to the client by writing initialization functions. To send a hello world page, for example:

// | montenegro.server(8080).html('/hello', qs[$('body').append(html[h1('Hello world!')])]);

// The client file contains full documentation for the html[] macro (the client ends up macroexpanding the code above).

  tconfiguration('std', 'montenegro.server.html', function () {
    l[html = this.configure('montenegro.html').montenegro.html] in
    this.configure('montenegro.server').montenegro.server.extensions /se[
      _.html(url, t) = l[s = html(t)] in this /se[_.on(url, 'GET', fn[req, res][res /se[_.writeHead(200, {'content-type': 'text/html'}), _.end(s)]])]]}).

// Proxy configuration.
// Forwards headers both ways, changing only the 'host' header for sending. You can specify functions to intercept the request/response data to transform it in some way.

  tconfiguration('std seq continuation', 'montenegro.server.proxy', function () {
    l[http = this.configure('montenegro.core').montenegro.require('http')] in
    this.configure('montenegro.server').montenegro.server.extensions /se[
      _.proxy(url, options) = l/cps[(req, res) <- this.on(new RegExp('^#{url}'), null, _)]
                                   [l[req0 = proxy_request_for(req, url)]
                                     [req.pipe(req0),
                                      l/cps[res0 <- req0.on('response', _)]
                                           [res.writeHead(res0.statusCode, res0.headers), res0.pipe(res)]]],

      where*[parts_for(url) = /^\/?([^:\/]+)(:?\d*)(\/?.*)$/.exec(url), host_for(parts) = parts && parts[1], port_for(parts) = parts && Number(parts[2].substring(1)) || 80,
             proxy_request_for(req, base_url) = l*[parts = parts_for(req.url.replace(base_url, '')), host = host_for(parts), port = port_for(parts)] in
                                                http.createClient(port, host).request(req.method, parts && parts[3] || '/', caterwaul.util.merge({}, req.headers, {host: host}))]]}).

// File server configuration.
// Sometimes you want to serve files from a directory. This is a fairly simple service to do that. I imagine there are security problems with it.

  tconfiguration('std continuation', 'montenegro.server.file', function () {
    l[sanitize(s) = s.replace(/\.\+/g, '.'), fs = this.configure('montenegro.core').montenegro.require('fs')] in
    this.configure('montenegro.server').montenegro.server.extensions /se.e[
      e.file_extension_mimetypes = {css: 'text/css', html: 'text/html', js: 'application/javascript', '': 'text/plain'},

      e.file(url, filename) = this /se[l/cps[(req, res) <- this.on(new RegExp('^#{url.replace(/\/$/, "")}(/|$)'), 'GET', _)]
                                            [res.writeHead(200, {'content-type': content_type_for(new_url)}), read_stream.pipe(res),
                                             where*[new_url               = req.url.replace(/\?.*$/, ''),
                                                    read_stream           = fs.createReadStream('#{filename}#{sanitize(new_url.substring(url.length))}'),
                                                    content_type_for(url) = /\.(\w+)$/.exec(url) /re[_ && _[1] /re[e.file_extension_mimetypes[_] || e.file_extension_mimetypes['']]]]]]]}).

// Alias configuration.
// Gives you the ability to alias content with or without redirects. For example:

// | some_server.alias('/', '/index.html');                        // A server-side redirect (no 30x return code)
//   some_server.alias('/foo', '/bar', 'POST');                    // Alias POST requests instead of everything
//   some_server.alias(/^\/foo/(.*)$/, '/bar/$1');                 // Alias all URLs starting with /foo/ to /bar/whatever
//   some_server.redirect('/', '/index.html');                     // A client-side redirect (301 error code)
//   some_server.redirect('/', '/index.html', {code: 302});        // A client-side redirect with a custom code
//   some_server.redirect('/foo', '/bar', {method: 'POST'});       // Issue redirect for POSTs instaed of GETs

// Specifying a method of null indicates that all methods should be aliased.

  tconfiguration('std continuation', 'montenegro.server.alias', function () {
    this.configure('montenegro.server').montenegro.server.extensions /se[
      _.alias(from, to, method)     = this /se[_.on(from, method, fn[req, res][_(req /se[_.url = from.test ? _.url.replace(from, to) : to], res)])],
      _.redirect(from, to, options) = this /se[l/cps[(req, res) <- this.on(from, options /re[_ && _.method], _)] in
                                               res /se[_.writeHead(options /re[_ && _.code] || 301, {location: to}), res.end()]]]}).

// Final configuration.
// This configuration bundles all of the configurations together.

  configuration('montenegro', function () {this.configure('montenegro.html montenegro.route.url montenegro.server montenegro.server.rpc montenegro.server.html montenegro.server.file',
                                                          'montenegro.server.alias montenegro.server.proxy')});
// Generated by SDoc 
