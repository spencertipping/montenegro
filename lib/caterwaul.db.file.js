// Indexed flat-file database | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// This is a simple database designed for prototyping and perhaps small-scale production use. The goals are to be (1) indestructible (i.e. you can't lose data), (2) easily managed, (3) instant to
// setup, and (4) reasonably quick (in case you do need to use it for real applications). It doesn't provide any sort of transactions, record locking, etc -- it's just a key-value store that is
// easily inspected and backed up with rsync.

// All records are stored as plain-text with JSON values. This means that you can write an adapter to the database in just a few lines of code in a language with good regexp support. It also
// enables very easy recovery in case something goes wrong.

caterwaul.node_require || caterwaul.field('node_require', require);
caterwaul.tconfiguration('std continuation opt seq', 'db.file', function () {

// Interface.
// The interface is almost completely idiot-proof. Here's how you get a database given a directory (the directory will be created if it doesn't exist and reused if it does):

// | var db = caterwaul.db.file('some-directory');

// You can also create a database without a directory; by default it uses 'db'.

// Now db is a function that you can use to get record shells:

// | var record1 = db('record1');                  // record1 if it exists, otherwise creates a new one with that ID
//   var record2 = db('record2');                  // same for record2
//   var record3 = db();                           // creates a record with a new ID

// And each record shell is an accessor function:

// | record1({foo: 'bar', bif: 1})                 // Updates the 'foo' and 'bif' fields asynchronously
//   record1(function (value) {...})               // Asynchronous retrieval -- calls your callback on the assembled object
//   record1('foo')                                // Adds record1 to the 'foo' index (all indexing is manual)
//   record1()                                     // Returns the ID of the record

// | record1(function (value, changes) {...})      // Callbacks also get the changelog
//   record1({bar: [1, 2, 3]}, function () {...})  // Callback is invoked when the write queue for the record is empty

// Records are created if they don't exist already, and the database doesn't support deletion.

//   Database options.
//   You can change the mode of the database directories that get created. By default 0755 is used. To change this, you can pass in a different mode:

//   | var db = caterwaul.db.file('directory-name', {mode: 0700});

//   Other options include the maximum number of filehandles you want the database to use at once under load (by default 128):

//   | var db = caterwaul.db.file('directory', {filehandles: 128});

//   Backups and merging.
//   Backups can be made by using rsync, tar, git, or your favorite archiver. All files are regular text.

//   Databases can be merged, too. The way this works is that the last change to a field wins if the databases have objects with the same IDs (objects with different IDs are fine). Here's how you
//   would merge databases, for instance (provided that the servers use the same clock!):

//   | #!/bin/bash
//     for file in $(find database1-dir/ -type f); do
//       cat database1-dir/$file >> database2-dir/$file          # Or the other way, it doesn't matter
//     done

//   This operation is idempotent, though if you do it too much you'll have a slow database. Every file is (1) plain text, and (2) append-only with timestamped records -- this means that you can
//   use version control on your database with reasonable compression and meaningful history. I recommend this if you have staging/production/development environments that you need to manage.

// Object model and file format.
// Every object is append-only. An object's lifecycle comes in two stages. First, it is created (this is done when someone creates a reference to it) and then it is modified any number of times.
// Objects are always stored in delta format, one record per line. Each record signifies an edit of some sort, and loading an object is done by replaying the edit log (this is done on the client
// to reduce server load, though it should be a trivial enough operation even on the server).

// Each update marks a simple value of a field, which is JSON-encoded. If you're going to have lots of data in a single field, it's probably best to allocate separate objects. That way your
// changelogs don't get huge, which they easily can if you have large arrays of JSON objects or some such.

//   Field updates.
//   Field updates are all done individually and are optimistically indexed. Later on when searches are performed the relevance-sorting stage culls entries that are no longer relevant. This
//   enatils space usage of O(n) for n edits, and not substantially worse than storing the objects without indexes. Indexes are also append-only. So, for example, here is the content of an object
//   file:

//   | time:field=value

//   The file name is something like /objects/195_/_gensym_foo_bar195_, where _gensym_foo_bar195_ is the object ID. Times are stored as numbers -- whatever new Date().getTime() returns. For
//   consistency, all times are assigned by the server.

//   Indexes.
//   Indexes are constructed by tagging particular words. For example, a field edit of 'title' to 'foo bar bif' would probably want to create entries to the object for 'title:foo', 'title:bar',
//   and 'title:bif'. This would update each of the files /indexes/title:foo, /indexes/title:bar, and /indexes/title:bif. The database provides an interface for indexing things (which is always
//   done manually and is asynchronous):

//   | db('id')('title:foo')('title:bar')('title:bif');

//   You can later retrieve things based on those indexes:

//   | db.index('title:foo', function (ids) {...});        // the IDs of everything in the 'title:foo' index

//   The log.
//   The database keeps a log of every update as it is requested. Each entry is timestamped when it gets added to this log, which makes this log an authoritative data source. Because it is likely
//   to become quite large, it is rotated daily. Here is an example of one such log file, /log/objects-2010-10-30:

//   | _object_id_@time:field=value

//   Logs are also kept for indexes. An example index log, /log/index-2010-10-30:

//   | _object_id_@time:index1
//     _object_id_@time:index2

//   Notice that the index file is not stored in compiled form; it's stored to mirror the arguments of the db('id')('index') call.

//   Properties of objects.
//   Algebraically speaking, objects have some useful properties. Obviously changes are not commutative, but they are associative. They also are independent in the sense that you can remove any
//   change or set of changes and still have a valid object definition. (This isn't true of a textual diff, for instance, since text diffs don't have well-defined slots.) Because log-replay
//   involves sorting by time, you can also merge databases by appends; the exact technique is mentioned in 'Backups and merging'.

// Implementation.
// The database centers around a rate-limiting queue. Whenever a file operation needs to be performed, it has to first reserve a filehandle slot. (This prevents the database from eating up
// filehandles and causing the HTTP server to bomb out.) Requests are serviced in the order made.

  (this.db || this.shallow('db', {}).db).file(directory, options) =
  let*[settings = caterwaul.util.merge({mode: 0755, filehandles: 128}, options || {}),
       fh_queue = caterwaul.clone('queue.blocking').queue.blocking(settings.filehandles),

       unique_id = let[n1 = +new Date(), n2 = Math.random() * (1 << 32), n3 = 0] in fn_['#{n1.toString(36)}_#{n2.toString(36)}_#{(++n3).toString(36)}'],
       path = caterwaul.node_require('path'), fs = caterwaul.node_require('fs'),

       read(file, cc)         = fh_queue(fn[free_cc][fs.readFile(file, 'utf8', fn[err, data][cc(data || err), free_cc()])]),
       append(file, data, cc) = let*[mkdir_p(dir, cc)    = path.exists(dir, fn[b][b ? cc && cc() : mkdir_p(path.dirname(dir), fn_[fs.mkdir(dir, settings.mode, cc)])]),
                                     write_data(free_cc) = let[w = fs.createWriteStream(file, {flags: 'a+'})] in (w.write(data, 'utf8'), w.end(fn_[free_cc(), cc && cc()]))]
                                [mkdir_p(path.dirname(file), fn_[fh_queue(write_data)])],

       with_partition(id)  = '#{id.substring(id.length - 2)}/#{id}',
       todays_log_suffix() = let[zero(n) = n < 10 ? '0#{n}' : n, now = new Date()] in '#{zero(now.getFullYear())}-#{zero(now.getMonth() + 1)}-#{zero(now.getDate())}',

       object_file(id) = '#{directory}/objects/#{with_partition(id)}',
       index_file(id)  = '#{directory}/indexes/#{id}',

       object_append(id, field, value, cc) = (append(object_file(id),                                   '#{+new Date()}:#{field}=#{JSON.stringify(value)}\n', cc),
                                              append('#{directory}/log/objects-#{todays_log_suffix()}', '#{id}@#{+new Date()}:#{field}=#{JSON.stringify(value)}\n')),
       index_append(id, object_id, cc)     = (append(index_file(id),                                    '#{object_id}\n', cc),
                                              append('#{directory}/log/index-#{todays_log_suffix()}',   '#{id}@#{+new Date()}:#{id}')),

       object_changes(id, cc) = read(object_file(id), fn[data][cc(data.constructor !== String ? [] : data.split(/\n/).map(
                                  fn[s][let[parts = /^([^:]+):([^=]+)=(.*)$/.exec(s)][parts ? {time: Number(parts[1]), field: parts[2], value: JSON.parse(parts[3])} : {bogus: s}]]))]),
       object_value(changes) = let[o = {}, c = null][opt.unroll[i, changes.length][(c = changes[i]) && (o[c.field] = c.value)], o],

       index_entries(id, cc) = read(index_file(id), fn[data][cc(data.constructor !== String ? [] : data.split(/\n/))]),
       result(id) = (id = id || unique_id(), let*[result = fn[x][x === undefined ? id : (x.constructor === String   ? index_append(x, id) :
                                                                                         x.constructor === Function ? object_changes(id, fn[changes][x(object_value(changes), changes)]) :
                                                                                                                      seq[sk[x] *![object_append(id, _, x[_])]], result)]][result])]
      [result.index = index_entries, result]});

// Generated by SDoc 
