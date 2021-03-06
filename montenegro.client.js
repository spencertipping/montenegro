// Montenegro client-side bindings | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// Montenegro works with jQuery to add structure to user interfaces and define useful shorthands for common cases. It also provides a Javascript markup language that you can use to build
// interfaces instead of going the HTML route. For logic-heavy applications this may make more sense than separating the layout.

// JQuery extension methods.
// These are used throughout Montenegro. up() takes either a selector or a number. If you give it a selector, it grabs the nearest matching parent; if you give it a number, it traverses up that
// many parents. The nearest() method lets you do approximate matching. For example, suppose you have this setup:

// | div.foo(div > textarea, div > button.save)

// If you want the save button to see the textarea (e.g. from inside a click handler), the obvious solution is $(this).parent().find('textarea'). However, that's a lot of work and doesn't scale
// well if the DOM layout changes. Better is to say $(this).nearest('textarea'). Note that it doesn't actually return just the single nearest one. It just goes up until it starts finding
// textareas. Note that .nearest() is O(n^2) and average-case n log n in the number of nodes in the document.

// The cval() method returns and then clears the value of a component. If you give it a parameter, the value will be cleared to that value rather than set to the empty string.

  caterwaul.tconfiguration('std', 'montenegro.methods', function () {jQuery.fn /se[_.up(s)      = s instanceof Number ? s ? this.parent().up(s - 1) : this : this.parents(s).eq(0),
                                                                                   _.cval(nv)   = l[v = this.val()] in this.val(nv || '') /re[v],
                                                                                   _.nearest(s) = this.length ? this.find(s) /re[_.length ? _ : this.parent().nearest(s)] : jQuery([])]}).

//   Event extensions.
//   Some events are common enough that it's useful to have a handler for them. Hitting the enter key is one of those. Another is getting a link to have a click action and look active, but not
//   actually go anywhere.

    tconfiguration('std', 'montenegro.events', function () {jQuery.fn /se[_.enter_key(f)  = this.keyup(fn[e][f.call(this, e), when[e.which === 13]]),
                                                                          _.escape_key(f) = this.keyup(fn[e][f.call(this, e), when[e.which === 27]]),
                                                                          _.clickable(f)  = this.attr('href', 'javascript:void(0)').click(f)]}).

//   Fixes.
//   These are fixes for places where jQuery is somehow suboptimal. Examples include extensions to support variadic/pluralized append(), prepend(), before(), and after(), and various fixes for
//   the clone() method. These fixes are still maintained in other Github repositories:

//   | http://github.com/spencertipping/jquery.fix.append-multiple
//     http://github.com/spencertipping/jquery.fix.select-clone
//     http://github.com/spencertipping/jquery.fix.textarea-clone

    tconfiguration('std seq continuation', 'montenegro.fixes', function () {
      $.from_many() = l[as = arguments] in $([]) /se.r[seq[~as *![_ instanceof Array || _ instanceof jQuery ? seq[~_ *![r.push(_)]] : r.push(_)]]],

      $.fn.clone() = original_clone.call(this) /se[clone_values_of_components(this, _)],

      $.fn.after   = make_variadic_and_plural($.fn.after),
      $.fn.before  = make_variadic_and_plural($.fn.before),
      $.fn.append  = make_variadic_and_plural($.fn.append),
      $.fn.prepend = make_variadic_and_plural($.fn.prepend),

      where*[$                                               = jQuery,
             original_clone                                  = $.clone,
             make_variadic_and_plural(f)()                   = l[xs = arguments] in
                                                               this /se.t[seq[~xs *![_ instanceof Array ? make_variadic_and_plural(f).apply(t, _.slice()) : f.call(t, _), unless[_ == null]]]],

             clone_values_of_components(source, destination) = l*[needs_filling = 'select, textarea',
                                                                  paired        = seq[~source.find(needs_filling) *+$ ^ destination.find(needs_filling) *+$]] in
                                                               seq[paired *![_[1].val(_[0].val())]]]}).

// RPC tunneling.
// You can connect to a server endpoint with a CPS-converted proxy function. You can also send opaque references to the server (presumably so that it can send them back). Here's an example of
// passing a DOM node:

// | var identity = montenegro.rpc('/identity-function');
//   var body     = $('body');
//   identity(montenegro.rpc.ref(body), fn[result][montenegro.rpc.ref(result).append('Got the body element back')]);
//   // alternatively:
//   l/cps[result <- identity(montenegro.rpc.ref(dom_node), _)][montenegro.rpc.ref(result).append('Got the body element back')];

// Assuming that the server replies with the data it was given, this will append some text to the document body when the server replies. The mechanism for this is actually really simple;
// montenegro.rpc.ref() just assigns a new gensym to each value you alias; that string goes to the server and is later resolved back into the client-side value. (This is why the server won't be
// able to do anything useful with the value.) Montenegro automatically garbage-collects the reference table by deallocating a reference when you dereference it. (So you can't dereference
// something more than once; if you do this it will create a new reference instead.)

//   Example: Building a chat client.
//   In montenegro.server.js.sdoc there's an example of a broadcast chat server. Here's the corresponding client code and some DOM nodes to make it work:

//   | var send = caterwaul.montenegro.rpc('/chat/send');
//     caterwaul.montenegro.rpc('/chat')(fn[message][$('.log').append(html[div.message(message)]), this()]);
//     $('body').append(html[div(div.log, button('Send'), input]));         // This just builds the UI. You could also do this with regular HTML.
//     l/cps[_ <- $('button').click(_)][send($('#input').cval())];

//   The 'this()' invocation inside the callback is used when you want to send something back and reuse the callback function. I'm using it here to avoid having to refer to the callback function
//   in a first-class way (which would normally be necessary to set the cycle up again).

    tconfiguration('std seq', 'montenegro.rpc', function () {
      this.namespace('montenegro') /se[
        _.rpc(url)() = l[as = seq[~arguments]][l*[callback = as.length && as[as.length - 1] /re[_.constructor === Function && as.pop()]] in
                                               $.ajax({url: url, type: 'POST', contentType: 'application/json', data: JSON.stringify(as.slice()), dataType: 'json',
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

//   Attributes.
//   You can define attributes by using one form of the * syntax:

//   | html[a.foo *href('http://www.google.com')]

//   As usual, underscores are replaced by hyphens -- most HTML attributes don't contain underscores.

//   Context inference.
//   There's a little bit of guessing that goes on about what's what. Usually the guesser gets things right, but there are some older HTML nodes that it doesn't detect. For example:

//   | html[div.foo > people.map(person)]          // div.foo is an element, people.map(person) is a function call -- its return value will be appended to the div
//     html[a.code > b.code > 'foo']               // a.code is a link with class 'code' that contains the Javascript value 'b.code' and the text 'foo'
//     html[div, foo, bar(bif), code('bar')]       // a div, the value 'foo', the function 'bar' called on bif, and a <code> element containing the text 'bar'

//   The complete list is in caterwaul.montenegro.dom.elements; setting additional keys in this hash to truthy values causes those identifiers to be treated as valid HTML elements. (I mention
//   this because at the moment the HTML5 standard isn't completely listed.)

//     Caveats.
//     Sometimes context inference doesn't quite work right. One particular case is when you embed the seq[] macro inside html[] -- in this case, the html[] macro happily dives through the seq[]
//     shell and into the expressions, interpreting things like seq[xs *[_ + 1]] as HTML invocations with attributes called []. (Obviously not the right thing to do.)

//     To prevent this from happening, use forcing contexts such as >= and []. For example:

//     | html[table(seq[~rows *[tr(td(_.name), td(_.value))]])]                    // This fails at compile-time
//       html[table[seq[~rows *[html[tr(td(_.name, td(_.value))]]]]]               // Forced context; this one works

//   Subtleties of this macroexpander.
//   There's only one thing that's particularly subtle and crucial to how this works. That's the detail of the qs[_] matcher, which is the first macro defined for the DOM expander. This macro
//   isn't written as a conditional because we never want the macroexpansion to descend as it normally would. Rather, we drive the descent using explicit calls to macroexpand(). Therefore, qs[_]
//   must always claim to have replaced the syntax with something; thus the failure case is just identity, indicating a success and no macro-driven descent.

    tconfiguration('std seq continuation', 'montenegro.dom', function () {
      this.configure('montenegro.fixes montenegro.methods').namespace('montenegro').dom = this.global().clone() /se[
        this.rmacro(qs[html[_]], _) /cps.t[qs[jQuery.from_many(_x)].replace({_x: _.macroexpand(t)})],

        _.elements = this.util.qw('html head body meta script style link title div a span input button textarea option select form label iframe blockquote code caption ' +
                                  'table tbody tr td th thead tfoot img h1 h2 h3 h4 h5 h6 li ol ul noscript p pre samp sub sup var canvas audio video') /re[seq[!(~_ *[[_, _]])]],

        l*[ref(x) = new this.ref(x), expand = _.macroexpand, is_an_element(tree) = _.elements[tree.data] || tree[0] && is_an_element(tree[0]), htmlify(s) = s.replace(/_/g, '-')] in

        _.macro /se[_(qs[_], fn[x][e ? qs[jQuery(document.createElement(_tag))].replace({_tag: '"#{e}"'}) : x, where[e = is_an_element(x)]]),

                    _(qs[_(_)], appender(expand, expand)), _(qs[_[_]], appender(expand, id)), _(qs[_ > _], appender(expand, expand)), _(qs[_ >= _], appender(expand, id)),
                    where[id(x) = x, appender(f, g)(t1, t2) = is_an_element(t1) && qs[_e.append(_c)].replace({_e: f(t1), _c: g(t2)})],

                    _(qs[[_]],  fn     [t][qs[[_e]]  .replace({_e: expand(t)})]),          _(qs[_, _], fn[t1, t2][qs[_1, _2].replace({_1: expand(t1), _2: expand(t2)})]),
                    _(qs[_ %_], fn[t1, t2][qs[_f(_e)].replace({_e: expand(t1), _f: t2})]), _(qs[_ /_], fn[t1, t2][qs[_e._f] .replace({_e: expand(t1), _f: t2})]),

                    _(qs[_ *_(_)], fn[e, a, v][qs[_e.attr(_a, _v)].replace({_e: expand(e),  _a: '"#{htmlify(a.data)}"', _v: v}), when[is_an_element(e)]]),
                    _(qs[_._],     fn [t1, t2][qs[_e.addClass(_c)].replace({_e: expand(t1), _c: '"#{htmlify(t2.data)}"'}),       when[is_an_element(t1)]])]]}).

// Final configuration.
// This one loads all of the others (though it lets you specify whether you want indirected references or not).

  configuration('montenegro', function () {this.configure('montenegro.methods montenegro.events montenegro.fixes montenegro.rpc montenegro.dom')});
// Generated by SDoc 
