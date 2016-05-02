$(document).ready(function(){
  var socket = io();
  var interval;
  var sessionID;

  var c = $('#canvas')[0];
  var ctx = c.getContext("2d");
  ctx.lineWidth = 2;

  $('#canvas').on('mousedown', function(){
    interval = true;
    socket.emit('startPoint', { x: event.offsetX, y: event.offsetY });
  });

  $('#canvas').on('mousemove', function(){
    if(interval)
      socket.emit('drawing', {x: event.offsetX, y: event.offsetY} );
  });

  $(window).on('mouseup', function(){
    interval = false;
    socket.emit('endPoint', { x: event.offsetX, y: event.offsetY });
  });

  socket.on('connect', function(){ sessionID = socket.io.engine.id; });

  // socket.emit("drawing", data);
  socket.on("startPoint", function(data){
    ctx.moveTo(data.x, data.y);
  });
  socket.on("drawing", function(data){
    ctx.lineTo(data.x, data.y);
    ctx.stroke();
  });
  socket.on("endPoint", function(data){
    ctx.moveTo(data.x, data.y);
    ctx.stroke();
  });

  socket.on("info", function(data){
    console.log(data);
  });
});
