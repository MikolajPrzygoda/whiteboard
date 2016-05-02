var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static('public'));

io.on('connection', function(socket){
  console.log(socket.id);

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
