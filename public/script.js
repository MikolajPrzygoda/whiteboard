$(document).ready(function(){
  var socket = io();
  var nick;
  var drawing;
  var resizeHelper, rectStartX, rectStartY, rectOffSetX, rectOffSetY, rectEnd;
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
          alert('That nick is already chosen');
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

      data.rectangles.forEach(function(data){
        if(data.e.invert == 0)
          ctx.strokeRect(data.s.x, data.s.y, Math.abs(data.e.x - data.s.x), Math.abs(data.e.y - data.s.y));
        if(data.e.invert == 1)
          ctx.strokeRect(data.s.x - Math.abs(data.e.x - data.s.x), data.s.y, Math.abs(data.e.x - data.s.x) , Math.abs(data.e.y - data.s.y));
        if(data.e.invert == 2)
          ctx.strokeRect(data.s.x, data.s.y - Math.abs(data.e.y - data.s.y), Math.abs(data.e.x - data.s.x), Math.abs(data.e.y - data.s.y));
        if(data.e.invert == 3)
          ctx.strokeRect(data.s.x - Math.abs(data.e.x - data.s.x), data.s.y - Math.abs(data.e.y - data.s.y), Math.abs(data.e.x - data.s.x), Math.abs(data.e.y - data.s.y));
      });

    });

    $(window).on('beforeunload', function(){
      socket.emit('logout', nick);
    });

    $('#canvas').on('mousedown', mouseStart);
    function mouseStart(){
      if(mode == "line"){
        drawing = true;
        socket.emit('startLine', { 'nick': nick, 'mode': "line", x: event.offsetX, y: event.offsetY });
      }
      else if(mode = 'rect'){
        resizeHelper = true;
        rectStartX = event.clientX;
        rectStartY = event.clientY;
        rectOffSetX = event.offsetX;
        rectOffSetY = event.offsetY;
        $('#content').append( $("<div>").attr("id", "rectHelper") );
        $('#rectHelper').css({
          'left': event.offsetX,
          'top': event.offsetY
        })
        .on('mousemove', mouseMove);
      }
    }


    $('#canvas').on('mousemove', mouseMove);
    function mouseMove() {
      if(mode == 'line' && drawing){
        socket.emit('drawingLine', { 'nick': nick, 'mode': "line", x: event.offsetX, y: event.offsetY} );
      }
      else if(mode == 'rect' && resizeHelper){
        var invert = 0;
        if(event.clientX - rectStartX < 0){
          $('#rectHelper').css({
            'left': rectOffSetX + event.clientX - rectStartX,
          });
          invert += 1;
        }
        else
          $('#rectHelper').css({ 'left': rectOffSetX });

        if(event.clientY - rectStartY < 0){
          $('#rectHelper').css({
            'top': rectOffSetY + event.clientY - rectStartY,
          });
          invert += 2;
        }
        else
          $('#rectHelper').css({ 'top': rectOffSetY });

        $('#rectHelper').css({
          'width': Math.abs(event.clientX - rectStartX) - 1,
          'height': Math.abs(event.clientY - rectStartY) - 1
        });
        // invert = 0 - normal, invert = 1 - invert X, invert = 2 - invert Y, invert = 3 - invert both
        if(this.id == "canvas")
          rectEnd = { x: event.offsetX, y: event.offsetY, 'invert': invert };
      }
    }

    $(window).on('mouseup', function(){
      if(mode == "line"){
        drawing = false;
      }
      else if(mode == "rect" && resizeHelper){
        $('#rectHelper').remove();
        resizeHelper = false;
        socket.emit('drawRect', { 's': { x: rectOffSetX, y: rectOffSetY }, 'e': rectEnd });
      }

    });

    socket.on("startLine", function(data){
      ctx.beginPath();
      ctx.moveTo(data.x, data.y);
    });
    socket.on("drawingLine", function(data){
      ctx.lineTo(data.x, data.y);
      ctx.stroke();
    });

    socket.on('drawRect', function(data){
      if(data.e.invert == 0)
        ctx.strokeRect(data.s.x, data.s.y, Math.abs(data.e.x - data.s.x), Math.abs(data.e.y - data.s.y));
      if(data.e.invert == 1)
        ctx.strokeRect(data.s.x - Math.abs(data.e.x - data.s.x), data.s.y, Math.abs(data.e.x - data.s.x) , Math.abs(data.e.y - data.s.y));
      if(data.e.invert == 2)
        ctx.strokeRect(data.s.x, data.s.y - Math.abs(data.e.y - data.s.y), Math.abs(data.e.x - data.s.x), Math.abs(data.e.y - data.s.y));
      if(data.e.invert == 3)
        ctx.strokeRect(data.s.x - Math.abs(data.e.x - data.s.x), data.s.y - Math.abs(data.e.y - data.s.y), Math.abs(data.e.x - data.s.x), Math.abs(data.e.y - data.s.y));
    });

    $('#resetBtn').click(function(){
      socket.emit('resetBoard');
    });
    socket.on('resetBoard', function(){
      drawing = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height); // clean everything
    });

    $("#line").click(function(){
      $(".active").removeClass("active");
      $("#line").addClass("active");
      mode = "line";
    });
    $("#rect").click(function(){
      $(".active").removeClass("active");
      $("#rect").addClass("active");
      mode = "rect";
    });

  }//end of init()

});
