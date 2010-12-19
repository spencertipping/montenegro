// Montenegro client-side bindings | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// Montenegro works with jQuery to add structure to user interfaces and define useful shorthands for common cases. It also provides a Javascript markup language that you can use to build
// interfaces instead of going the HTML route. For logic-heavy applications this may make more sense than separating the layout.

  caterwaul.

// Core extension.
// This just takes care of initializing the montenegro object on Caterwaul. We also close over the jQuery object so that the user can set noConflict() later on without disrupting the HTML
// constructors. You can also replace this jQuery function with a different one, maybe to trace the calls or some such. You can also replace the document, though the only reasons I can imagine
// for that are somewhat nefarious.

  configuration('montenegro.core', function () {this.shallow('montenegro', {$: jQuery, document: document})}).

// JQuery extension methods.
// These are used throughout Montenegro. se() is used to create side-effects on elements, which can be useful in the middle of long chains (this works better with the precedence than /se[] does).
// up() takes either a selector or a number. If you give it a selector, it grabs the nearest matching parent; if you give it a number, it traverses up that many parents.

// The nearest() method lets you do approximate matching. For example, suppose you have this setup:

// | div.foo(div > textarea, div > button.save)

// If you want the save button to see the textarea (e.g. from inside a click handler), the obvious solution is $(this).parent().find('textarea'). However, that's a lot of work and doesn't scale
// well. Better is to say $(this).nearest('textarea'). Note that it doesn't actually return just the single nearest one. It just goes up until it starts finding textareas. Note that .nearest() is
// O(n^2) and average-case n log n in the number of nodes in the document.

// The cval() method returns and then clears the value of a component. If you give it a parameter, the value will be cleared to that value rather than set to the empty string.

  tconfiguration('std', 'montenegro.methods', function () {this.configure('montenegro.core').montenegro.$.fn /se[
    _.se(f)      = this /se[f.call(_, _)],
    _.up(s)      = s instanceof Number ? s ? this.parent().up(s - 1) : this : this.parents(s).eq(0),
    _.cval(nv)   = let[v = this.val()] in this.val(nv || '') /re[v],
    _.nearest(s) = this.length ? this.find(s) /re[_.length ? _ : this.parent().nearest(s)] : $([])]}).

//   Event extensions.
//   Some events are common enough that it's useful to have a handler for them. Hitting the enter key is one of those. Another is getting a link to have a click action and look active, but not
//   actually go anywhere.

    tconfiguration('std', 'montenegro.events', function () {this.configure('montenegro.core').montenegro.$.fn /se[
      _.enter(f)     = this.keyup(fn[e][e.which === 13 && f.call(this, e)]),
      _.clickable(f) = this.attr('href', 'javascript:void(0)').click(f)]}).

// RPC tunneling.
// You can connect to a server endpoint with a CPS-converted proxy function. You can also send opaque references to the server (presumably so that it can send them back). Here's an example of
// passing a DOM node:

// | var identity = montenegro.rpc('/identity-function');
//   var body     = $('body');
//   identity(montenegro.rpc.ref(body), fn[result][montenegro.rpc.ref(result).append('Got the body element back')]);
//   // alternatively:
//   let/cps[result <- identity(montenegro.rpc.ref(dom_node), _)][montenegro.rpc.ref(result).append('Got the body element back')];

// Assuming that the server replies with the data it was given, this will append some text to the document body when the server replies. The mechanism for this is actually really simple;
// montenegro.rpc.ref() just assigns a new gensym to each value you alias; that string goes to the server and is later resolved back into the client-side value. (This is why the server won't be
// able to do anything useful with the value.) Montenegro automatically garbage-collects the reference table by deallocating a reference when you dereference it. (So you can't dereference
// something more than once; if you do this it will create a new reference instead.)

//   Example: Building a chat client.
//   In montenegro.server.js.sdoc there's an example of a broadcast chat server. Here's the corresponding client code and some DOM nodes to make it work:

//   | var send = caterwaul.montenegro.rpc('/chat/send');
//     caterwaul.montenegro.rpc('/chat')(fn[message][$('.log').append(html[div.message(message)]), this()]);
//     $('body').append(html[div(div.log, button('Send'), input]));         // This just builds the UI. You could also do this with regular HTML.
//     let/cps[_ <- $('button').click(_)][send($('#input').val())];

//   The 'this()' invocation inside the callback is used when you want to send something back and reuse the callback function. I'm using it here to avoid having to refer to the callback function
//   in a first-class way (which would normally be necessary to set the cycle up again).

    tconfiguration('std seq', 'montenegro.rpc', function () {
      this.configure('montenegro.core').montenegro /se[
        _.rpc(url)() = let[as = seq[~arguments]][let*[callback = as.length && as[as.length - 1] /re[_.constructor === Function && as.pop()]] in
                                                 $.ajax({url: url, type: 'POST', contentType: 'application/json', data: JSON.stringify(as.slice()),
                                                     success: fn[reply][callback && callback.apply(fn_[_.rpc(url).apply(null, seq[~arguments].slice().concat([callback]))], reply)]})]]}).

// DOM construction.
// You can build elements using a CSS-selector-style syntax. (Alternatively, you can provide an element in the markup; if you do it this way, the template element's ID should match the model
// name.) So, for example, suppose we're modeling a person with a name and e-mail address. Here's what the markup might look like in HTML:

// | <div id='person' class='person'>
//     <label for='name1'>Name:</label>
//     <input id='name1' class='name nonempty' />
//     <label for='email1'>Email:</label>
//     <input id='email1' class='email' />
//     <a class='facebook' href='http://facebook.com/someone'>A Facebook Page</a>
//   </div>

// | html[div.person(input.name.nonempty, input.email, a.facebook /attr('href', 'http://facebook.com/someone') > 'A Facebook Page')]

// Note that you can't use hyphens in the class names in Javascript, but if you type underscores they'll be converted into dashes. For example:

// | html[div.first_name]          // becomes <div class='first-name'></div>

//   Automation and event handlers.
//   You can get the jQuery shell for an element by using the '/' operator. The right-hand side is an invocation on the jQuery shell; for example:

//   | $('<a>').addClass('foo').click(fn_[...]).mouseover(fn_[...])
//     // can be written as:
//     html[a.foo /click(fn_[...]).mouseover(fn_[...])]

//   Anything after a '/' for an element is not considered to be HTML, so you'll have to use another html[] if you want to create elements to pass into a jQuery function. For example:

//   | html[a.foo /append(span('some text'))]              // won't do what you want
//     html[a.foo /append(html[span('some text')])]        // this is the right way to do it
//     html[a.foo > span('some text')]                     // even better

//   Evaluating subexpressions.
//   Going back to the person example, suppose you have a list of people that you want to insert into a div. Here's what that looks like:

//   | var people = seq[...];
//     var person = fn[p][html[div.person(input.name.nonempty /val(p.name))]];
//     var ui     = html[div.people(people.map(person), button.save('Save'), button.cancel('Cancel'))];

//   Here, the expression 'people.map(person)' gets evaluated as a Javascript expression rather than as markup. Montenegro knows to do this because 'people' isn't one of the HTML elements it
//   knows about. Javascript expressions should return strings, sequences, arrays, or jQuery objects. Strings get promoted into text nodes, so you don't have to worry about HTML escaping.

//   Mapping.
//   You can map an element through a function using the '%' shorthand. For example:

//   | var nonempty = fn_[this.instavalidate(/^.+$/)];
//     var ui = html[div(input.name %nonempty, input.title %nonempty)]

//   This isn't quite the same thing as side-effecting. Using the map shorthand replaces the element with whatever your map function returns, which may or may not be desirable.

//   Note that tempting as it is, you can't say this:

//   | html[div((input.name, input.title) %nonempty)]       // can't do this, even though it would be awesome

//   I considered adding a distributive property, but Javascript's syntax is restrictive enough that I don't think it makes sense. It also makes you think too hard about your markup, which isn't
//   a good thing. The markup should be simple and local, and your modifier functions should be short enough to type several times. (This can be achieved by using a let-binding or similar.)

//   Evaluation contexts.
//   Containment can be specified either as div(x) or by div > x. If you want 'x' to be evaluated as Javascript code rather than HTML, you can use >=, for instance div >= x. (Think of <% vs. <%=
//   in ERB or ASP.) Specifying multiple children is possible too; you use div >= [x, y, z]. (Using div >= (x, y, z) will evaluate (x, y, z) as JS, which returns just z.)

//   Note that because > and >= are left-associative, a > b > c will add b and c to a rather than adding c to b, then b to a.

//   Context inference.
//   There's a little bit of guessing that goes on about what's what. Usually the guesser gets things right, but there are some older HTML nodes that it doesn't detect. For example:

//   | html[div.foo > people.map(person)]          // div.foo is an element, people.map(person) is a function call -- its return value will be appended to the div
//     html[a.code > b.code > 'foo']               // a.code is a link with class 'code' that contains the Javascript value 'b.code' and the text 'foo'

//   The complete list is in caterwaul.montenegro.dom.elements; setting additional keys in this hash to truthy values causes those identifiers to be treated as valid HTML elements.

    tconfiguration('std seq continuation opt', 'montenegro.dom', function () {
      this.configure('montenegro.core montenegro.methods').montenegro /se[
      let[$ = _.$, document = _.document, ps = seq[~[]]][_.dom = {} /se[
        _.define_pattern(pattern, expansion) = _.define_pattern /se[ps.push([pattern, expansion])],

        this.rmacro(qs[html[_]], fn[x][_.expand(x)]),

        _.elements = caterwaul.util.qw('html head body meta script style link title div a span input button textarea option select form label iframe blockquote code caption ' +
                                       'table tbody tr td th thead tfoot img h1 h2 h3 h4 h5 h6 li ol ul noscript p pre samp sub sup var canvas audio video') /re[seq[!(~_ *[[_, true]])]],

        let*[ref(x)                 = new caterwaul.ref(x),
             expand = _.expand(t)   = call/cc[fn[cc][opt.unroll[i, ps.length][let*[p = ps[ps.length - (i + 1)], m = t && t.match(p[0])][cc(p[1].apply(t, m) || t), when[m]], t]]],
             is_an_element(tree)    = _.elements[tree.data] || tree[0] && is_an_element(tree[0]),
             append_single(node, c) = node.append(c.constructor === String ? document.createTextNode(c) : c),
             append_multiple(node)  = let[as = seq[~arguments].slice(1)] in node /se[seq[~as *![_ !== null && _ !== undefined && append_single(node, _)]]]] in

        _.define_pattern /se[_(qs[_], fn[x][qs[_$(_document.createElement(_tag))].replace({_$: ref($), _document: ref(document), _tag: ref(x.data)}), when[is_an_element(x)]]),

                             _(qs[_(_)], append)(qs[_ > _], append)(qs[_ >= _], append_eval),
                             where[append(t1, t2)      = is_an_element(t1) && qs[_f(_e, _c)].replace({_f: ref(append_multiple), _e: expand(t1), _c: expand(t2)}),
                                   append_eval(t1, t2) = is_an_element(t1) && qs[_f(_e, _c)].replace({_f: ref(append_multiple), _e: expand(t1), _c: t2})],

                             _(qs[[_]],  fn     [t][qs[[_e]].replace({_e: expand(t)})]),
                             _(qs[_ %_], fn[t1, t2][qs[_f(_e)].replace({_e: expand(t1), _f: t2})]),
                             _(qs[_._],  fn[t1, t2][qs[_e.addClass(_c)].replace({_e: expand(t1), _c: ref(t2.data.replace(/_/g, '-'))}), when[is_an_element(t1)]]),
                             _(qs[_ /_], fn[t1, t2][qs[_e._f].replace({_e: expand(t1), _f: t2})]),
                             _(qs[_, _], fn[t1, t2][qs[_1, _2].replace({_1: expand(t1), _2: expand(t2)})])]]]]}).

// Final configuration.
// This one loads all of the others.

  configuration('montenegro', function () {this.configure('montenegro.events montenegro.methods montenegro.rpc montenegro.dom')});

// Generated by SDoc 
