$(document).ready(function(){
  var socket = io();
  var nick;
  var users = {};
  var lineDrawing;
  var rectDrawing, rectStartX, rectStartY, rectOffSetX, rectOffSetY, rectEnd, invert;
  var circleDrawing, circleStartX, circleStartY, circleOffSetX, circleOffSetY;
  var circleData = {x:0, y:0, r:0};
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
        users[element] = { x: 0, y: 0};
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
        ctx.strokeRect(data.startx, data.starty, data.width, data.height);
      });
      data.circles.forEach(function(data){
        ctx.beginPath();
        ctx.arc(data.x, data.y, data.r, 0, 2*Math.PI);
        ctx.stroke();
        ctx.closePath();
      });

    });

    $(window).on('beforeunload', function(){
      socket.emit('logout', nick);
    });

    $('#canvas').on('mousedown', mouseStart);
    function mouseStart(){
      if(mode == "line"){
        lineDrawing = true;
        socket.emit('startLine', { 'nick': nick, 'mode': "line", x: event.offsetX, y: event.offsetY });
      }
      else if(mode == 'rect'){
        rectDrawing = true;
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
      else if(mode == 'circle'){
        circleDrawing = true;
        circleStartX = event.clientX;
        circleStartY = event.clientY;
        circleOffSetX = event.offsetX;
        circleOffSetY = event.offsetY;
        circleData.x = circleOffSetX;
        circleData.y = circleOffSetY;
        $('#content').append( $("<div>").attr("id", "circleHelper") );
        $('#circleHelper').css({
          'left': event.offsetX,
          'top': event.offsetY
        })
        .on('mousemove', mouseMove);
      }
    }


    $('#canvas').on('mousemove', mouseMove);
    function mouseMove() {
      if(mode == 'line' && lineDrawing){
        socket.emit('drawingLine', { 'nick': nick, 'mode': "line", x: event.offsetX, y: event.offsetY} );
      }
      else if(mode == 'rect' && rectDrawing){
        invert = 0;
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
          rectEnd = { x: event.offsetX, y: event.offsetY };
      }
    }

    $(window).on('mousemove', function(){
      if(mode == 'circle' && circleDrawing){
        var dx = Math.pow( (event.clientX - circleStartX), 2);
        var dy = Math.pow( (event.clientY - circleStartY), 2);
        var r = Math.sqrt( dx + dy );
        circleData.r = r;

        $('#circleHelper').css({
          'left': circleOffSetX - r,
          'top': circleOffSetY - r,
          'width': 2*r,
          'height': 2*r
        });
      }
    });

    $(window).on('mouseup', function(){
      if(mode == "line"){
        lineDrawing = false;
      }
      else if(mode == "rect" && rectDrawing){
        $('#rectHelper').remove();
        rectDrawing = false;

        if(invert == 0){
          var startx = rectOffSetX;
          var starty = rectOffSetY;
        }
        else if(invert == 1){
          var startx = rectOffSetX - Math.abs(rectEnd.x - rectOffSetX);
          var starty = rectOffSetY;
        }
        else if(invert == 2){
          var startx = rectOffSetX;
          var starty = rectOffSetY - Math.abs(rectEnd.y - rectOffSetY);
        }
        else if(invert == 3){
          var startx = rectOffSetX - Math.abs(rectEnd.x - rectOffSetX);
          var starty = rectOffSetY - Math.abs(rectEnd.y - rectOffSetY);
        }
        var width = Math.abs(rectEnd.x - rectOffSetX);
        var height = Math.abs(rectEnd.y - rectOffSetY);

        socket.emit('drawRect', { 'startx': startx, 'starty': starty, 'width': width, 'height': height });
      }
      else if(mode == "circle" && circleDrawing){
        $('#circleHelper').remove();
        circleDrawing = false;

        socket.emit('drawCircle', circleData);
      }
    });

    socket.on("startLine", function(data){
      users[data.nick].x = data.x;
      users[data.nick].y = data.y;
    });
    socket.on("drawingLine", function(data){
      ctx.beginPath();
      ctx.moveTo(users[data.nick].x, users[data.nick].y);
      ctx.lineTo(data.x, data.y);
      ctx.stroke();
      ctx.closePath();
      users[data.nick].x = data.x;
      users[data.nick].y = data.y;
    });

    socket.on('drawRect', function(data){
      ctx.strokeRect(data.startx, data.starty, data.width, data.height);
    });
    socket.on('drawCircle', function(data){
      ctx.beginPath();
      ctx.arc(data.x, data.y, data.r, 0, 2*Math.PI);
      ctx.stroke();
      ctx.closePath();
    });

    $('#resetBtn').click(function(){
      socket.emit('resetBoard');
    });
    socket.on('resetBoard', function(){
      lineDrawing = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height); // clean everything
    });

    $(".modeButton").click(function(){
      $(".active").removeClass("active");
      $(this).addClass("active");
      mode = this.id;
    });


  }//end of init()

});
