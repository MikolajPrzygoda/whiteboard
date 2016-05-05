var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static('public'));

var onlineUsers = [];
var board = {
  'lines': [],
  'rectangles': []
}
/*

board = {
  lines: [
    {
      start: {x:, y:},
      points: [{x: , y: },{x: , y: },{x: , y: }, ... ]
    },
    {
      start: {x:, y:},
      points: [{x: , y: },{x: , y: },{x: , y: }, ... ]
    },
    ...
  ],
  rectangles:[
    {
      start: {x:, y:},
      end: {x: , y: }
    },
    {
      start: {x:, y:},
      end: {x: , y: }
    },
    ...
  ],
  ... (circles, triangles, ...)
}

*/


io.on('connection', function(socket){

  socket.on('login', function(nick){
    if(onlineUsers.indexOf(nick) == -1){
      socket.emit('loginResponse', true);
      onlineUsers.push(nick);
      io.emit('updateUsers', onlineUsers);
    }
    else{
      socket.emit('loginResponse', false);
    }
  });

  socket.on('logout', function(nick){
    if(onlineUsers.indexOf(nick) != -1)
      onlineUsers.splice(onlineUsers.indexOf(nick), 1);
      socket.broadcast.emit('updateUsers', onlineUsers);
  });

  socket.on('startLine', function(data){
    io.emit('startLine', data);

    board['lines'].push({ start: {x: data.x, y: data.y }, points: [] })
  });

  socket.on('drawingLine', function(data){
    if(data.mode == 'line'){
      io.emit('drawingLine', data);

      var last = board['lines'].length - 1;
      board['lines'][last].points.push( {x: data.x, y: data.y } );
    }
  });

  socket.on('endLine', function(data){
    io.emit('endLine', data);

    var last = board['lines'].length - 1
    board['lines'][last].points.push( {x: data.x, y: data.y } );
    logBoard();
  });

  socket.on('updateBoard', function(){
    socket.emit('updateBoard', board);
  });

});

http.listen(20000, function(){
  console.log('starting on port 20000');
});

function logBoard(){
    console.log(board);
}
