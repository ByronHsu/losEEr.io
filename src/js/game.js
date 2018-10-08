import io from 'socket.io-client';
import EnemySnake from './enemySnake';
import PlayerSnake from './playerSnake';
import Food from './food';
import Util from './util';
import uuid from 'uuid/v1';

var Game = function (game) { }

Game.prototype = {
    preload: function () {
        //load assets
        this.game.load.image('circle', 'asset/circle.png');
        this.game.load.image('shadow', 'asset/white-shadow.png');
        this.game.load.image('background', 'asset/tile.png');

        this.game.load.image('eye-white', 'asset/eye-white.png');
        this.game.load.image('eye-black', 'asset/eye-black.png');

        this.game.load.image('food', 'asset//canada_flag.png');

        this.game.load.image('earth', 'asset/heads/地球.png');
        this.game.load.image('bloody', 'asset/heads/血絲.png');
        this.game.load.image('crown', 'asset/heads/皇冠.png');
        this.game.load.image('southPark', 'asset/heads/南方公園.png');
        this.game.load.image('leaf', 'asset/heads/葉子.png');
        this.game.load.image('sushi', 'asset/heads/壽司.png');
        this.game.load.image('leaf', 'asset/heads/葉子.png');
        this.game.load.image('headband', 'asset/heads/頭帶.png');

        this.game.availableHeads = ['earth', 'bloody', 'crown', 'southPark', 'leaf', 'sushi', 'leaf', 'headband']
        // this.game.socket = io('http://localhost:8000');
        this.game.socket = io(window.document.URL);

        // set world width & height
        this.worldWidth = 2000;
        this.worldHeight = 2000; // actually twice
        this.game.worldWidth = this.worldWidth
        this.game.worldHeight = this.worldHeight
        this.game.world.setBounds(-this.worldWidth, -this.worldHeight, this.worldWidth * 2, this.worldHeight * 2)
        this.game.stage.backgroundColor = '#000033';
        this.game.stage.disableVisibilityChange = true;

        //add tilesprite background
        this.cornerWidth = 100
        this.game.cornerWidth = this.cornerWidth

        this.game.snakes = [];
        //callbacks
        this.game.socket.on('on_get_food', this.onGetFood.bind(this));
        this.game.socket.on('destroy_food', this.remove_food_by_id.bind(this));
        this.game.socket.on('enemyPlayers', this.onEnemyPlayers.bind(this));
        this.game.socket.on('new_enemyPlayer', this.onNewEnemy.bind(this));
        this.game.socket.on('enemyMove', this.onEnemyMove.bind(this));
        this.game.socket.on('enemyDestroy', this.onEnemyDestroy.bind(this));
        this.game.socket.on('enemyIncrease', this.onEnemyIncrease.bind(this));
        this.game.socket.on('enemySpaceKeyEvent', this.onEnemySpaceKeyEvent.bind(this));
        this.game.socket.on('enemyDisconnect', this.onEnemyDisconnect.bind(this));
        this.game.socket.on('dashboardUpdate', this.onDashboardUpdate.bind(this))
        this.game.socket.on('highestScoreUpdate', this.onHighestScoreUpdate.bind(this))
    },
    create: function () {
        this.game.globalScale = { x: 0.99, y: 0.99 };
        if (this.game.socket.disconnected)
            this.game.socket.connect();

        this.background = this.game.add.tileSprite(-this.worldWidth + this.cornerWidth, -this.worldHeight + this.cornerWidth,
            this.game.world.width - this.cornerWidth * 2, this.game.world.height - this.cornerWidth * 2, 'background');

        //initialize physics and groups
        this.game.physics.startSystem(Phaser.Physics.P2JS);
        this.foodGroup = this.game.add.group();
        this.snakeHeadCollisionGroup = this.game.physics.p2.createCollisionGroup();
        this.foodCollisionGroup = this.game.physics.p2.createCollisionGroup();

        //add food from server
        this.game.socket.emit('on_food_init');
        this.game.snakes = [];

        //create player
        var snake = new PlayerSnake(this.game, 'circle', Util.randomInt(-this.worldWidth + this.cornerWidth * 5, this.worldWidth - this.cornerWidth * 5),
            Util.randomInt(-this.worldHeight + this.cornerWidth * 5, this.worldHeight - this.cornerWidth * 5), uuid(),
            this.game.availableHeads[Math.floor(Math.random() * this.game.availableHeads.length)]);
        snake.head.body.collideWorldBounds = true
        this.game.camera.follow(snake.head);
        this.game.player = snake;

        //dashboard visible
        document.getElementById("dashboard").style.visibility = "visible"

        //initialize snake groups and collision
        for (var i = 0; i < this.game.snakes.length; i++) {
            var snake = this.game.snakes[i];
            snake.head.body.setCollisionGroup(this.snakeHeadCollisionGroup);
            snake.head.body.collides([this.foodCollisionGroup]);
            //callback for when a snake is destroyed
            snake.addDestroyedCallback(this.snakeDestroyed, this);
        }

        // setInterval(function () {
        //     console.log(new Date())
        // }, 3000)
    },
    onGetFood: function (data) {
        for (var i = 0; i < data.length; i++) {
            this.initFood(data[i].x, data[i].y, data[i].id);
        }
    },
    onEnemyPlayers: function (data) {
        console.log("onEnemyPlayers", data)
        for (let i = 0; i < data.length; i++) {
            let snake = new EnemySnake(this.game, 'circle', data[i].secDetails[0].x, data[i].secDetails[0].y, data[i], data[i].spriteKey)
        }
    },
    onNewEnemy: function (data) {
        console.log("onNewEnemyData", data)
        let snake = new EnemySnake(this.game, 'circle', data.secDetails[0].x, data.secDetails[0].y, data, data.spriteKey);
        // console.log("onNewEnemy", snake)
        // snake.remote_headPath = data.headPath;
        // snake.headAngle = data.headAngle
        //   console.log('onNewPlayerSnakes', this.game.snakes);
    },
    onEnemyMove: function (data) {
        // console.log('onEnemyMove', data);
        var snake = this.game.snakes.find((e) => e.id == data.id);
        if (!snake) return;
        // snake.headPath = data.headPath;
        snake.headAngle = data.headAngle
        snake.secDetails = data.secDetails
    },
    onEnemyDestroy: function (id, foodDrop) {
        // console.log(`Received signal to destroy snake of id ${id} @ game.js: onEnemyDestroy`);
        for (let snake of this.game.snakes) {
            if (id === snake.id) {
                // console.log(`Snake of id ${id} found @ game.js: onEnemyDestroy`);
                snake.destroy();
            }
        }
        for (let food of foodDrop) {
            this.initFood(food.x, food.y, food.id);
        }
        // console.log('Received foodDrop @ game.js: onEnemyDestroy');
    },
    onEnemyIncrease: function (data) {
        // console.log("onEnemyIncrease", data)
        let snake = this.game.snakes.find(e => e.id == data.id)
        if (snake) {
            snake.scale = data.scale
            snake.setScale(data.scale)
        }
    },
    onEnemySpaceKeyEvent: function (data) {
        // console.log("onEnemySpaceKeyEvent", data)
        let snake = this.game.snakes.find(e => e.id == data.id)
        if (snake)
            snake.shadow.isLightingUp = data.isLightingUp
    },
    onEnemyDisconnect: function (snakeId) {
        // console.log("onEnemyDisconnect", snakeId)
        let snake = this.game.snakes.find(e => e.id == snakeId)
        if (snake)
            snake.destroy()
    },
    onDashboardUpdate: function (data) {
        // console.log("onDashboardUpdate", data)
        let table = document.getElementById("table_data")
        if (data.length > table.rows.length) {
            for (let i = table.rows.length; i < Math.min(data.length, 10); i++) {
                let row = table.insertRow(i)
                let c1 = row.insertCell(0)
                let c2 = row.insertCell(1)
                let c3 = row.insertCell(2)
                c1.classList.add("table_rank")
                c2.classList.add("table_name")
                c3.classList.add("table_score")
            }
        }
        else if (data.length < table.rows.length) {
            for (let i = table.rows.length - 1; i >= data.length; i--) {
                table.deleteRow(i)
            }
        }
        for (let i = 0; i < Math.min(10, data.length); i++) {
            table.rows[i].cells[0].innerHTML = "#" + (i + 1).toString()
            let textlength = 40
            if (data[i].name.length > textlength) {
                table.rows[i].cells[1].innerHTML = data[i].name.substring(0, textlength) + "..."
            } else {
                table.rows[i].cells[1].innerHTML = data[i].name
            }
            // table.rows[i].cells[1].innerHTML = data[i].name
            table.rows[i].cells[2].innerHTML = data[i].score
            if (data[i].socketId === this.game.socket.id) {
                table.rows[i].style.color = "#ff8533"
            }
            else {
                table.rows[i].style.color = "black"
            }
        }
    },
    onHighestScoreUpdate: function (data) {
        let table = document.getElementById("leader_data")
        // console.log(data)
        let textlength = 40
        if (data.name && data.name.length > textlength) {
            table.rows[0].cells[1].innerHTML = data.name.substring(0, textlength) + "..."
        } else {
            table.rows[0].cells[1].innerHTML = data.name || ""
        }
        // table.rows[0].cells[1].innerHTML = data.name
        table.rows[0].cells[2].innerHTML = data.score
        table.rows[0].style.color = "#cc0000"
    },
    /**
     * Main update loop
     */
    update: function () {
        //update game components
        for (var i = this.game.snakes.length - 1; i >= 0; i--) {
            this.game.snakes[i].update();
        }
        for (var i = this.foodGroup.children.length - 1; i >= 0; i--) {
            var f = this.foodGroup.children[i];
            f.food.update();
        }
    },

    render: function () {
        // for (let snake of this.game.snakes) {
        //     if (snake.render) snake.render()
        // }
    },
    /**
     * Create a piece of food at a point
     * @param  {number} x x-coordinate
     * @param  {number} y y-coordinate
     * @return {Food}   food object created
     */
    initFood: function (x, y, id) {
        var f = new Food(this.game, x, y, id);
        f.sprite.body.setCollisionGroup(this.foodCollisionGroup);
        this.foodGroup.add(f.sprite);
        f.sprite.body.collides([this.snakeHeadCollisionGroup]);
        return f;
    },
    snakeDestroyed: function (snake) {
        //place food where snake was destroyed
        let increment = Math.round(snake.secDetails.length / snake.snakeLength) * 2,
            len = snake.secDetails.length;
        let foodDrop = [];
        // for (var i = 0; i < len; i += increment) should run Math.ceil(len/increment) times,
        // which generates one food on each iteration, thus send a request for that many uuids
        // Then send back the newly added food to server
        this.game.socket.emit('idRequest', Math.ceil(len / increment), IDArray => {
            // console.log('Received new IDs @ game.js: snakeDestroyed: arrow_function (idRequest ack)');
            for (var i = 0, j = 0; i < len; i += increment, j++) {
                let x = snake.secDetails[i].x + Util.randomInt(-10, 10);
                let y = snake.secDetails[i].y + Util.randomInt(-10, 10);
                this.initFood(x, y, IDArray[j]);
                if (!IDArray[j])
                    console.error(`IDArray[${j}] is undefined, len = ${len}, increment = ${increment} @ game.js: snakeDestroyed`);
                foodDrop.push({ x: x, y: y, id: IDArray[j] });
            }
            // console.log('Sending id and foodDrop to server @ game.js: snakeDestroyed');
            this.game.socket.emit("snakeDestroyed", { id: snake.id, drop: foodDrop });
            this.game.socket.disconnect();

            this.game.state.start('Login');
        });
        // return to login after 2 second after died
        // todo died page & count down
        // let cntDown = 3
        // let diedPage = null
        // let ele = document.getElementById("diedPage")
        // let h1 = document.createElement("h1")
        // let h3 = document.createElement("h3")
        // h1.innerHTML = "You Are Died!"
        // h3.innerHTML = cntDown.toString()
        // ele.appendChild(h1)
        // ele.appendChild(h3)
        // diedPage = setInterval(() => {
        //     console.log(cntDown)
        //     cntDown--;
        //     h3.innerHTML = cntDown.toString()
        //     if (cntDown === 0) {
        //         this.game.state.start('Login')
        //         clearInterval(diedPage)
        //         ele.removeChild(h1)
        //         ele.removeChild(h3)
        //    }
        // }, 10000);
    },
    remove_food_by_id: function (id) {
        // console.log(`Received Request of Removing food ${id} @ game.js: remove_food_by_id`);
        for (var i = 0; i < this.foodGroup.children.length; i++) {
            if (this.foodGroup.children[i].id == id) {
                // console.log("Found the food to destroy @ game.js: remove_food_by_id")
                this.foodGroup.children[i].food.remote_destroy();
                return;
            }
        }
        console.error(`[Error]: food ${id} not found @ game.js: remove_food_by_id`);
    }
};

export default Game;