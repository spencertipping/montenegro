// Hello world Montenegro test.

caterwaul.clone('std seq montenegro')(function () {
  server(8080) /se[_.on('/', 'GET', fn[request, response][response /se[_.writeHead(200), _.end('Hello world!')]]),
                   _.rpc('/sayhi', 'Call this with your name to get a personalized greeting.', fn[name][this('Hi there, #{name}')]),
                   _.html('/page', qs[$('body').append('Hello world!')])],

  where[server(port) = caterwaul.montenegro.server(port)];
})();

// Generated by SDoc 