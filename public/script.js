$(document).ready(function(){
  var socket = io();
  var interval;
  var nick;

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

    var c = $('#canvas')[0];
    var ctx = c.getContext("2d");
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    socket.emit('updateUsers');
    socket.on('updateUsers', function(data){
      $('#onlineUsers').html('');
      data.forEach(function(element, index){
      $('#onlineUsers').append( $('<li>').html(element) );
      });
    });

    $(window).on('beforeunload', function(){
      socket.emit('logout', nick);
    })

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

    // $()
  }
});
