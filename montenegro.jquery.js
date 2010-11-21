// Client-side Montenegro/jQuery bindings | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// Montenegro works with jQuery to add structure to user interfaces and define useful shorthands for common cases. It also provides a Javascript markup language that you can use to build
// interfaces instead of going the HTML route. For logic-heavy applications this may make more sense than separating the layout.

  caterwaul.

// Core extension.
// This just takes care of initializing the montenegro object on Caterwaul. We also close over the jQuery object so that the user can set noConflict() later on without disrupting the HTML
// constructors. You can also replace this jQuery function with a different one, maybe to trace the calls or some such.

  configuration('montenegro.jquery.core', function () {this.montenegro = {$: jQuery}}).

// JQuery extension methods.
// These are used throughout Montenegro.

  tconfiguration('std', 'montenegro.jquery.methods', function () {$.fn.se(f) = (f.call(this, this), this)}).

//   Event extensions.
//   Some events are common enough that it's useful to have a handler for them. Hitting the enter key is one of those:

    tconfiguration('std', 'montenegro.jquery.events', function () {$.fn.enter(f) = this.keyup(fn[e][e.which === 13 && f.call(this, e)])}).

// DOM construction.
// You can build elements using a CSS-selector-style syntax. (Alternatively, you can provide an element in the markup; if you do it this way, the template element's ID should match the model
// name.) So, for example, suppose we're modeling a person with a name and e-mail address. Here's what the markup might look like in HTML:

// | <div id='person' class='person'>
//     <input class='name nonempty' />
//     <input class='email' />
//     <a class='facebook' href='http://facebook.com/someone'>A Facebook Page</a>
//   </div>

// Here's what it looks like using Montenegro markup syntax (triggered with the html<< operator):

// | html<< div.person(input.name.nonempty, input.email, a.facebook[href='http://facebook.com/someone']('A Facebook Page'))

//   Automation and event handlers.
//   You can get the jQuery shell for an element by using the '/' operator. The right-hand side is an invocation on the jQuery shell; for example:

//   | $('<a>').addClass('foo').click(fn_[...]).mouseover(fn_[...])
//     // can be written as:
//     html<< a.foo/click(fn_[...]).mouseover(fn_[...])

//   Anything after a '/' for an element is not considered to be HTML, so you'll have to use another html<< if you want to create elements to pass into a jQuery function. For example:

//   | html<< a.foo/append(span('some text'))              // won't do what you want
//     html<< a.foo/append(html<< span('some text'))       // this is the right way to do it

//   Evaluating subexpressions.
//   Going back to the person example, suppose you have a list of people that you want to insert into a div. Here's what that looks like:

//   | var people = sa<< [...];
//     var person = fn[p][html<< div.person(input.name.nonempty/val(p.name))];
//     var ui     = html<< div.people(!people.map(person), button.save('Save'), button.cancel('Cancel'));

//   Here, the expression 'people.map(person)' gets evaluated as a Javascript expression rather than as markup. The expression should return a string, sequence, array, or jQuery object.

//   Generalized side-effects.
//   Montenegro adds an 'se' method to jQuery shells to allow you to perform generalized side-effects. For example:

//   | html<< div.foo/se(fn_[this.side_effect(), this.other_side_effect()])

//   The se() method passes the its jQuery object into the side-effecting function (both as 'this' and as the first parameter) and returns the original jQuery object (which will be unmodified
//   unless the function explicitly mutates it; importantly, though, the function can use find() and such without modifying the outer state stack).

//   Mapping.
//   You can map an element through a function using the '%' shorthand. For example:

//   | var nonempty = fn_[this.instavalidate(/^.+$/)];
//     var ui = html<< div(input.name%nonempty, input.title%nonempty)

//   This isn't quite the same thing as side-effecting. Using the map shorthand replaces the element with whatever your map function returns, which may or may not be desirable (if it isn't, you
//   should probably use /se(...) instead -- see 'Generalized side-effects').

//   Note that tempting as it is, you can't say this:

//   | html<< div((input.name, input.title)%nonempty)      // can't do this, even though it would be awesome

//   I considered adding a distributive property, but Javascript's syntax is restrictive enough that I don't think it makes sense. It also makes you think too hard about your markup, which isn't
//   a good thing. The markup should be simple and local, and your modifier functions should be short enough to type several times. (This can be achieved by using a let-binding or similar.)

//   Element constructor aliasing.
//   You can define new names for elements if you want to. This can come in handy when you don't know which heading level makes sense, for example. Here's how do define such an alias:

//   | caterwaul.montenegro.html_alias('foo', 'div');
//     // or the shorthand:
//     foo >html(alias)> div;

//   After this definition, these are equivalent:

//   | html<< div.test('stuff')
//     html<< foo.test('stuff')

//   Aliases are transitive, but this dependency is resolved at definition-time instead of as the aliases are used. (So if you do something inadvisable such as changing an alias, the transitivity
//   relation won't make much sense.)

    tconfiguration('std seq iter', 'montenegro.jquery.dom', function () {
      this.configure('montenegro.jquery.core montenegro.jquery.methods');

      let*[as = this.montenegro.html_aliases = {}, a = this.montenegro.html_alias(e, t) = (as[e] = as[t] || t, this), $ = this.montenegro.$]
      [this.macro(qs[_ >html(alias)> _], fn[e, t][qs[_f(_e, _t)].replace({_f: new this.ref(a), _e: new this.ref(e.data), _t: new this.ref(t.data)})]),

       this.rmacro(qs[ html<< _], html_expand),
       where*[ref(x)                 = new caterwaul.ref(x),
              node_create(tag)       = qs[_$(_document.createElement(_as[_tag] || _tag))].replace({_$: ref($), _as: ref(as), _tag: ref(tag), _document: ref(document)}),
              node_attributes(e, as) = qs[_e.se(fn_[_as])].replace({_e: e, _as: as.flatten(',').map(fn[a][qs[this.attr(_name, _value)].replace({_name: ref(a[0].data), _value: a[1]})])}),

              append_single(node, c) = c.force ? node.append(x) <se< c : node.append(c.constructor === String ? document.createTextNode(c) : c),
              append_multiple(node)  = append_single(node, x) <se< sa<< Array.prototype.slice.call(arguments, 1) && node,

              html_expand(tree)      = tree && let[m = tree.match(qs[_/_])][m ? qs[_e._f].replace({_e: html_expand(m[0]), _f: m[1]}) :
                                                  (m = tree.match(qs[_._]))   ? qs[_e.addClass(_c)].replace({_e: html_expand(m[0]), _c: ref(m[1].data)}) :
                                                  (m = tree.match(qs[_%_]))   ? qs[_f(_e)].replace({_e: html_expand(m[0]), _f: m[1]}) :
                                                  (m = tree.match(qs[_(_)]))  ? qs[_f(_e, _c)].replace({_f: ref(append_multiple), _e: html_expand(m[0]), _c: html_expand(m[1])}) :
                                                  (m = tree.match(qs[_[_]]))  ? node_attributes(html_expand(m[0]), m[1]) :
                                                  (m = tree.match(qs[_,_]))   ? tree.map(html_expand) :
                                                  (m = tree.match(qs[!_]))    ? m[0] :
                                                             tree.is_string() ? tree : node_create(tree.data)]]]}).

// AJAX resource transport.
// Resources (i.e. data) are abstracted on the server end by the Caterwaul file database or similar. The interface to this is very simple; each record is a function that, when invoked on an
// object, updates the record with those properties; and when invoked on a function, loads the object and calls the function on it. (A CPS-converted retrieval, just like AJAX.) Given a resource
// exposed via REST API on the server, this function constructs a transport that lets you use it from the client, and with exactly the same interface.

// AJAX resources are organized like this:

// | GET  base/name/id                             // returns the JSON and changelog for an object
//   POST base/name/id (with JSON)                 // updates an object
//   GET  base/name/index/id                       // returns a JSON-encoded array of IDs
//   POST base/name/index/id (with a string)       // adds an ID to an index

  tconfiguration('std', 'montenegro.jquery.resource', function () {
    var $ = this.configure('montenegro.jquery.core').montenegro.$;
    this.montenegro.resource(name, base_path) = let*[path       = '#{base_path || "/"}/#{name}',
                                                     record(id) = let[id = id || caterwaul.gensym()]
                                                                     [fn[x][x.constructor === String   ? $.post('#{path}/index/#{x}', id) :
                                                                            x.constructor === Function ? $.getJSON('#{path}/#{id}', fn[reply][x(reply.object, reply.changelog)]) :
                                                                                                         $.post('#{path}/#{id}', JSON.stringify(x)), record(id)]]]
                                                    [record.index(i, cc) = $.getJSON('#{path}/index/#{i}', cc), record]}).

// Final configuration.
// This one loads all of the others.

  configuration('montenegro.jquery', function () {this.configure('montenegro.jquery.events montenegro.jquery.dom montenegro.jquery.resource')});

// Generated by SDoc 
