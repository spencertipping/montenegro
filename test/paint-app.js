// Collaborative paint test application

caterwaul.clone('std seq montenegro')(function () {
  let[connections = seq[~[]]] in
  caterwaul.montenegro.server(8080) /se[
    _.rpc('/listen', fn_[connections.push(this)]).rpc('/send', fn[message][seq[connections *![_(message)]], connections = seq[~[]], this('OK')]),

    _.html('/', qs[caterwaul.montenegro.rpc('/listen')(fn[message][this() /se[$('canvas')[0].getContext('2d') /se[_.moveTo(message.x1, message.y1), _.strokeStyle = message.color || '#35a',
                                                                                                                  _.lineTo(message.x2, message.y2), _.stroke()]]]),
                   let[send = caterwaul.montenegro.rpc('/send')] in
                   $('body').append(let[x = 0, y = 0, adjust(e) = let[o = $('canvas').offset()] in e /se[_.real_x = _.pageX - o.left, _.real_y = _.pageY - o.top]] in 
                     html[canvas /css({border: 'solid 1px #888'})
                                 /mousedown(fn[e][adjust(e), x = e.real_x, y = e.real_y])
                                 /mousemove(fn[e][adjust(e), send({x1: x, y1: y, x2: x = e.real_x, y2: y = e.real_y}), when[x || y]])
                                 /mouseup  (fn[e][x = y = 0])])])]})();

// Generated by SDoc 