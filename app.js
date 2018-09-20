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
let socketToSnakeID = {}

io.sockets.on('connection', function(socket){
    // console.log(socket.id)
   socket.on('createPlayer', (data) => {
      console.log('createPlayer', data.id);
    //   for (i = 0; i < snakeArr.length; i++) {
    //      //send to the new player about everyone who is already connected. 	
    //      socket.emit("enemyPlayers", snakeArr[i]);
    //   }
      socket.emit("enemyPlayers", snakeArr)
      snakeArr.push(data);
    //   console.log(typeof(socket.id))
      socketToSnakeID[socket.id] = data.id
      console.log(socketToSnakeID)
      //send message to every connected client except the sender
      socket.broadcast.emit('new_enemyPlayer', data);
   });
   socket.on('playerMove', (data) => {
      var snake = snakeArr.find((e) => e.id == data.id);
      if(snake == null) return;
      snake.headPath = data.headPath;
      snake.headAngle = data.headAngle;
    //   console.log("playerMove", data)
      socket.broadcast.emit('enemyMove', data);
   })
   socket.on('snakeDestroyed', (id) => {
        for (let i = 0;i < snakeArr.length; i++) {
            if (snakeArr[i].id == id) {
                snakeArr.splice(i, 1);
                break;
            }
        }
        console.log("snakeDied", id)
        socket.broadcast.emit('enemyDestroy', id)
   })

   socket.on("playerIncrease", data => {
        let snake = snakeArr.find((e) => e.id == data.id);
        if (snake == null) return
        // console.log("playerIncrease", data)
        snake.scale = data.scale
        snake.snakeLength = data.snakeLength
        snake.headAngle = data.headAngle
        socket.broadcast.emit('enemyIncrease', data)
   })

   socket.on("spaceKeyEvent", data => {
       let snake = snakeArr.find(e => e.id == data.id)
       if (snake == null) return
       snake.isLightingUp = data.isLightingUp
       socket.broadcast.emit('enemySpaceKeyEvent', data)
   })

   socket.on("disconnect", () => {
       let snakeId = socketToSnakeID[socket.id]
    //    console.log("user disconnect", snakeId)
       if (!snakeId) return;
       for (let i = 0;i < snakeArr.length; i++) {
           if (snakeArr[i].id === snakeId) {
               console.log("disconnect snake", snakeId)
               snakeArr.splice(i, 1)
               delete socketToSnakeID[socket.id]
               break;
           }
       }
       socket.broadcast.emit('enemyDisconnect', snakeId)
   })
});