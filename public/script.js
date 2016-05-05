$(document).ready(function(){
  var socket = io();
  var nick;
  var drawing;
  var mode = "line";

  $('#loginCover').width(window.innerWidth);
  $('#loginCover').height(window.innerHeight);
  $('#onlineUsers').height(window.innerHeight);

  $('form').submit(function(){
    nick = $('#nick').val();
    if(nick != ""){
      socket.emit('login', nick);

      socket.on('loginResponse', function(data){
        if(data){
          $('#loginCover').slideUp(700);
          $('#onlineUsers').css('right', '0px');
          $('#content').css('right', 'calc(50% + 100px)');
          init();
        }
        else{
          alert('That nick is already chosen')
        }
      });
    }

    return false;
  });


  function init(){

    var canvas = $('#canvas')[0];
    ctx = canvas.getContext("2d");
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    socket.emit('updateUsers');
    socket.emit('updateBoard');

    socket.on('updateUsers', function(data){
      $('#onlineUsers').html('');
      data.forEach(function(element, index){
      $('#onlineUsers').append( $('<li>').html(element) );
      });
    });
    socket.on('updateBoard', function(data){
      ctx.clearRect(0, 0, canvas.width, canvas.height); // clean everything

      data.lines.forEach(function (element, index, array){
        ctx.beginPath();
        ctx.moveTo(element.start.x, element.start.y);

        element.points.forEach(function(element, index, array){
          ctx.lineTo(element.x, element.y);
          ctx.stroke();
        });

        ctx.closePath();
      });
    });

    $(window).on('beforeunload', function(){
      socket.emit('logout', nick);
    });

    $('#canvas').on('mousedown', function(){
      if(mode == "line"){
        drawing = true;
        socket.emit('startLine', { 'nick': nick, 'mode': "line", x: event.offsetX, y: event.offsetY });
      }
    });

    $('#canvas').on('mousemove', function(){
      if(drawing)
        socket.emit('drawingLine', { 'nick': nick, 'mode': "line", x: event.offsetX, y: event.offsetY} );
    });

    $(window).on('mouseup', function(){
      if(mode == "line"){
        drawing = false;

        socket.emit('endLine', { 'nick': nick, 'mode': "line", x: event.offsetX, y: event.offsetY });
      }
    });

    // socket.emit("drawing", data);
    socket.on("startLine", function(data){
      ctx.beginPath();
      ctx.moveTo(data.x, data.y);
    });
    socket.on("drawingLine", function(data){
      ctx.lineTo(data.x, data.y);
      ctx.stroke();
    });
    socket.on("endLine", function(data){
      ctx.lineTo(data.x, data.y);
      ctx.stroke();
      ctx.closePath();
    });
  }

});
