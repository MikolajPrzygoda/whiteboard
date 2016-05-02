var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static('public'));

var onlineUsers = [];

io.on('connection', function(socket){

  socket.on('login', function(nick){
    if(onlineUsers.indexOf(nick) == -1){
      socket.emit('loginResponse', true);
      onlineUsers.push(nick);
      console.log(onlineUsers);
      io.emit('updateUsers', onlineUsers);
    }
    else{
      socket.emit('loginResponse', false);
    }
  });

  socket.on('getUsers', function(){
    socket.emit('getUsers', onlineUsers);
  })

  socket.on('logout', function(nick){
    if(onlineUsers.indexOf(nick) != -1)
      onlineUsers.splice(onlineUsers.indexOf(nick), 1);
      console.log(onlineUsers);
      socket.broadcast.emit('updateUsers', onlineUsers);
  });

  socket.on('drawing', function(data){
    io.emit('drawing', data);
  });
  socket.on('startPoint', function(data){
    io.emit('startPoint', data);
  });
  socket.on('endPoint', function(data){
    io.emit('endPoint', data);
  });

});

http.listen(20000, function(){
  console.log('listening on *:20000');
});
