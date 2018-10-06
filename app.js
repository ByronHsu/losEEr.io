var express = require('express');
var unique = require('node-uuid');
var uuid = require('uuid/v4');
var app = express();
var serv = require('http').Server(app);
app.get('/', function(req, res) {
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
        var withinRoot = Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2);
        var dist = Math.pow(withinRoot, 0.5);
        return dist;
    }
};
// io connection 
const width = 2000;
const height = 2000;
const cornerWidth = 110;
const cornerHeight = 110;
const limitFoodAmount = 1000;
var io = require('socket.io')(serv, {});
var snakeArr = [];
var foodArr = [];
var foodAmount = 10;
for (var i = 0; i < foodAmount; i++) {
    foodArr.push({ id: uuid(), x: Util.randomInt(-width + cornerWidth, width - cornerWidth), y: Util.randomInt(-height + cornerHeight, height - cornerHeight) });
}
let socketToSnakeID = {}
let dashboardData = []
let highestScoreSnake = {
    // name: "",
    id: "",
    socketId: "",
    score: 0
}

let dashboardCompare = (a, b) => b.score - a.score

io.sockets.on('connection', function(socket) {
    // console.log(socket.id)
    socket.on('createPlayer', (data) => {
        socket.emit("enemyPlayers", snakeArr)
        snakeArr.push(data);
        // socketId <=> snakeId
        socketToSnakeID[socket.id] = data.id
            // console.log(socketToSnakeID)
            //send message to every connected client except the sender
        socket.broadcast.emit('new_enemyPlayer', data);
        // dashboard update
        dashboardData.push({
            name: data.name,
            id: data.id,
            socketId: socket.id,
            score: data.snakeLength
        })
        updateDashboard()
    });
    socket.on('playerMove', data => {
        var snake = snakeArr.find(e => e.id == data.id);
        if (snake == null) return;
        // snake.headPath = data.headPath;
        snake.headAngle = data.headAngle;
        snake.secDetails = data.secDetails
        // console.log("playerMove", data.secDetails)
        socket.broadcast.emit('enemyMove', data);
    });
    socket.on('on_food_init', function() {
        socket.emit('on_get_food', foodArr);
    });
    socket.on('food_destroy', function(id) {
        // console.log(`Received request to destroy food id=${id} @ app.js:anonymous/food_destroy`)
        for (var i = 0; i < foodArr.length; i++) {
            if (foodArr[i].id === id) {
                foodArr.splice(i, 1);
                foodAmount--;
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
    socket.on('snakeDestroyed', data => {
        for (let i = 0; i < snakeArr.length; i++) {
            if (snakeArr[i].id === data.id) {
                snakeArr.splice(i, 1);
                break;
            }
        }
        // console.log(`Snake ${data.id} died @ app.js: anonymous/snakeDestroyed`)
        // console.log('Received id and foodDrop @ app.js: anonymous/snakeDestroyed');
        foodArr.push(...data.drop); // Otherwise the newly added snake won't see food dropped from dead snake
        foodAmount += data.drop.length;
        socket.broadcast.emit('enemyDestroy', data.id, data.drop);
        // update dashboard
        for (let i = 0;i < dashboardData.length; i++) {
            if (dashboardData[i].id == data.id) {
                dashboardData.splice(i, 1)
                break;
            }
        }
        updateDashboard()

    });

    socket.on("playerIncrease", data => {
        let snake = snakeArr.find((e) => e.id == data.id);
        if (snake == null) return
        // console.log("playerIncrease", data)
        snake.scale = data.scale
        snake.snakeLength = data.snakeLength
        snake.headAngle = data.headAngle
        socket.broadcast.emit('enemyIncrease', data)
        //update dashboard
        for (let i = 0;i < dashboardData.length; i++) {
            if (dashboardData[i].id == data.id) {
                dashboardData[i].score = data.snakeLength
                break;
            }
        }
        updateDashboard()
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
        for (let i = 0; i < snakeArr.length; i++) {
            if (snakeArr[i].id === snakeId) {
                // console.log("disconnect snake", snakeId)
                snakeArr.splice(i, 1)
                delete socketToSnakeID[socket.id]
                break;
            }
        }
        socket.broadcast.emit('enemyDisconnect', snakeId)
        // update dashboard
        for (let i = 0;i < dashboardData.length; i++) {
            if (dashboardData[i].id == snakeId) {
                dashboardData.splice(i, 1)
                break;
            }
        }
        updateDashboard()
    })
});

function genfood() {
    // console.log(foodAmount);
    var newfoods = [];
    while (foodAmount < limitFoodAmount) {
        foodAmount++;
        var newfood = { id: uuid(), x: Util.randomInt(-width + cornerWidth, width - cornerWidth), y: Util.randomInt(-height + cornerHeight, height - cornerHeight) }
        newfoods.push(newfood);
        foodArr.push(newfood);
    }
    io.emit('on_get_food', newfoods);
}

function updateDashboard() {
    dashboardData.sort(dashboardCompare)
    if (dashboardData[0] && highestScoreSnake.score < dashboardData[0].score) highestScoreSnake = dashboardData[0]
    // console.log("disconnect", dashboardData)
    io.emit('dashboardUpdate', dashboardData)
    io.emit('higestScoreUpdate', highestScoreSnake)
}
setInterval(genfood, 2000);