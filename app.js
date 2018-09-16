var express = require('express');
var unique = require('node-uuid')
var app = express();
var serv = require('http').Server(app);
const bodyParser = require('body-parser');

app.get('/',function(req, res) {
	res.sendFile(__dirname, 'public/index.html');
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));

serv.listen(process.env.PORT || 8000);
console.log("Server started.");

 // io connection 
var io = require('socket.io')(serv,{});
var snakeArr = [];

io.sockets.on('connection', function(socket){
   socket.on('createPlayer', (data) => {
      console.log('createPlayer');
      for (i = 0; i < snakeArr.length; i++) {
         //send to the new player about everyone who is already connected. 	
         socket.emit("new_enemyPlayer", snakeArr[i]);
      }
      snakeArr.push(data);
      //send message to every connected client except the sender
      socket.broadcast.emit('new_enemyPlayer', data);
   });
   socket.on('playerMove', (data) => {
      var snake = snakeArr.find((e) => e.id == data.id);
      if(snake == null) return;
      snake.path = data.path;
      socket.broadcast.emit('enemyMove', data);
   })
   socket.on('snakeDestroyed', (id) => {
        for (let i = 0;i < snakeArr.length; i++) {
            if (snakeArr[i].id == id) {
                snakeArr.splice(i, 1);
                break;
            }
        }
        socket.broadcast.emit('enemyDestroy', id)
   })

   socket.on("playerIncrease", data => {
        let snake = snakeArr.find((e) => e.id == data.id);
        if (snake == null) return
        console.log("playerIncrease", data)
        snake.scale = data.scale
        socket.broadcast.emit('enemyIncrease', data)
   })
});