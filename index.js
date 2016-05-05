var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static('public'));

var onlineUsers = [];
var board = {
  'lines': [],
  'rectangles': [],
  'circles': []
}
/*

board = {
  lines: [
    {
      start: {x: , y: },
      points: [{x: , y: },{x: , y: },{x: , y: }, ... ]
    },
    {
      start: {x: , y: },
      points: [{x: , y: },{x: , y: },{x: , y: }, ... ]
    },
    ...
  ],
  rectangles:[
    {
      startx: ,
      starty: ,
      width: ,
      height:
    },
    ...
  ],
  circles: [
    {
      centerx: ,
      centery: ,
      radius:
    }
  ]
  ... (triangles, ...)
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

  socket.on('updateBoard', function(){
    socket.emit('updateBoard', board);
  });

  socket.on('resetBoard', function(){
    io.emit('resetBoard');
    board = {
      'lines': [],
      'rectangles': [],
      'circles': []
    }
  });

  socket.on('drawRect', function(data){
    io.emit('drawRect', data);
    board.rectangles.push(data);
  });
  socket.on('drawCircle', function(data){
    io.emit('drawCircle', data);
    board.circles.push(data);
  });

});

http.listen(20000, function(){
  console.log('starting on port 20000');
});
