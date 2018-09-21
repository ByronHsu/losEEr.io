var express = require('express');
var unique = require('node-uuid');
var uuid = require('uuid/v4');
var app = express();
var serv = require('http').Server(app);
app.get('/',function(req, res) {
	res.sendFile(__dirname, 'public/index.html');
});

app.use(express.static('public'));

serv.listen(process.env.PORT || 8000);
console.log("Server started.");

const Util = {
    /**
     * Generate a random number within a closed range
     * @param  {Integer} min Minimum of range
     * @param  {Integer} max Maximum of range
     * @return {Integer}     random number generated
     */
    randomInt: function(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    /**
     * Calculate distance between two points
     * @param  {Number} x1 first point
     * @param  {Number} y1 first point
     * @param  {Number} x2 second point
     * @param  {Number} y2 second point
     */
    distanceFormula: function(x1, y1, x2, y2) {
        var withinRoot = Math.pow(x1-x2, 2) + Math.pow(y1-y2, 2);
        var dist = Math.pow(withinRoot, 0.5);
        return dist;
    }
};
 // io connection 
const width = 500;
const height = 500;
const cornerWidth=110;
const cornerHeight = 110;
var io = require('socket.io')(serv,{});
var snakeArr = [];
var foodArr = [];
var foodAmount = 200;
for(var i=0; i<foodAmount; i++){
    foodArr.push({id: uuid(), x: Util.randomInt(-width + cornerWidth ,width - cornerWidth), y: Util.randomInt(-height + cornerHeight ,height - cornerHeight)});
}
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
   socket.on('playerMove', data => {
      var snake = snakeArr.find(e => e.id == data.id);
      if(snake == null) return;
      snake.headPath = data.headPath;
      snake.headAngle = data.headAngle;
    //   console.log("playerMove", data)
      socket.broadcast.emit('enemyMove', data);
   });
   socket.on('on_food_init', function(){  
      socket.emit('on_get_food', foodArr);
   });
   socket.on('food_destroy', function(id){  
     console.log(`Received request to destroy food id=${id} @ app.js:anonymous/food_destroy`)
       for(var i = 0;i<foodArr.length;i++){
           if(foodArr[i].id === id){
               foodArr.splice(i, 1);
               break;
           }
       }
       socket.broadcast.emit('destroy_food', id);
   });
   //Client send idRequest @ game.js: Game.prototype.snakeDestroyed
   socket.on('idRequest', (numOfIdNeeded, ack) => {
      //console.log(`Received request to generate ${numOfIdNeeded} uuids @ app.js: anonymous/idRequest`);
      //Send uuid array of size numOfIdNeeded to client via ack
      ack([...Array(numOfIdNeeded)].map(() => uuid())); // cannot use .map(uuid)
   });
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
