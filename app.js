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
        var withinRoot = Math.pow(x1-x2,2) + Math.pow(y1-y2,2);
        var dist = Math.pow(withinRoot,0.5);
        return dist;
    }
};
 // io connection 
const width = 5000;
const height = 5000;
var io = require('socket.io')(serv,{});
var snakeArr = [];
var foodArr = [];
var foodamount = 1000;
for( var i = 0;i<foodamount;i++){
    foodArr.push({id: uuid(), x:Util.randomInt(-width,width),y:Util.randomInt(-height,height)});
}
// console.log(foodArr);
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
   });
   socket.on('on_food_init', function(){  
    socket.emit('on_get_food',foodArr);
   });
   socket.on('food_destroy', function(id){  
     console.log(`Received request to destroy food id=${id} @ app.js:anonymous/food_destroy`)
       for(var i = 0;i<foodArr.length;i++){
           if(foodArr[i].id === id){
               foodArr.splice(i,1);
               break;
           }
       }
       socket.broadcast.emit('destroy_food',id);
   });
});
