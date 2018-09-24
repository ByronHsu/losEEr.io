import io from 'socket.io-client';
import EnemySnake from './enemySnake';
import PlayerSnake from './playerSnake';
import Food from './food';
import Util from './util';
import uuid from 'uuid/v1';

var Game = function(game) {}

Game.prototype = {
    preload: function() {
        //load assets
        this.game.load.image('circle', 'asset/circle.png');
        this.game.load.image('shadow', 'asset/white-shadow.png');
        this.game.load.image('background', 'asset/tile.png');

        this.game.load.image('eye-white', 'asset/eye-white.png');
        this.game.load.image('eye-black', 'asset/eye-black.png');

        this.game.load.image('food', 'asset/hex.png');
        this.game.socket = io(window.document.URL);

        // set world width & height
        this.worldWidth = 1000;
        this.worldHeight = 1000; // actually twice
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
    },
    create: function() {
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
            Util.randomInt(-this.worldHeight + this.cornerWidth * 5, this.worldHeight - this.cornerWidth * 5), uuid());
        snake.head.body.collideWorldBounds = true
        this.game.camera.follow(snake.head);

        //initialize snake groups and collision
        for (var i = 0; i < this.game.snakes.length; i++) {
            var snake = this.game.snakes[i];
            snake.head.body.setCollisionGroup(this.snakeHeadCollisionGroup);
            snake.head.body.collides([this.foodCollisionGroup]);
            //callback for when a snake is destroyed
            snake.addDestroyedCallback(this.snakeDestroyed, this);
        }
    },
    onGetFood: function(data) {
        for (var i = 0; i < data.length; i++) {
            this.initFood(data[i].x, data[i].y, data[i].id);
        }
    },
    onEnemyPlayers: function(snakeArr) {
        for (let s of snakeArr) {
            let snake = new EnemySnake(this.game, 'circle', s.headPath[0].x, s.headPath[0].y, s);
            if(s.record) {
                snake.rotateLeft = s.record.rotateLeft;
                snake.forwardSpeed = s.record.forwardSpeed;
                snake.headPos = s.record.headPos;
                snake.rotating = s.record.rotating;
                snake.rotation = s.record.rotation;
            }
        }
    },
    onNewEnemy: function(data) {
        var snake = new EnemySnake(this.game, 'circle', data.headPath[0].x, data.headPath[0].y, data);
        snake.remote_headPath = data.headPath;
        snake.headAngle = data.headAngle
    },
    onEnemyMove: function(data) {
        var snake = this.game.snakes.find((e) => e.id == data.id);
        if (!snake)
            return;
        snake.rotateLeft = data.data.rotateLeft;
        snake.forwardSpeed = data.data.forwardSpeed;
        snake.headPos = data.data.headPos;
        snake.rotating = data.data.rotating;
        snake.rotation = data.data.rotation;
    },
    onEnemyDestroy: function(id, foodDrop) {
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
    onEnemyIncrease: function(data) {
        let snake = this.game.snakes.find(e => e.id == data.id)
        if (snake)
            snake.incrementSize()
    },
    onEnemySpaceKeyEvent: function(data) {
        let snake = this.game.snakes.find(e => e.id == data.id)
        if (snake)
            snake.shadow.isLightingUp = data.isLightingUp
    },
    onEnemyDisconnect: function(snakeId) {
        let snake = this.game.snakes.find(e => e.id == snakeId)
        if (snake)
            snake.destroy()
    },
    /**
     * Main update loop
     */
    update: function() {
        //update game components
        for (var i = this.game.snakes.length - 1; i >= 0; i--) {
            this.game.snakes[i].update();
        }
        for (var i = this.foodGroup.children.length - 1; i >= 0; i--) {
            var f = this.foodGroup.children[i];
            f.food.update();
        }
    },
    /**
     * Create a piece of food at a point
     * @param  {number} x x-coordinate
     * @param  {number} y y-coordinate
     * @return {Food}   food object created
     */
    initFood: function(x, y, id) {
        var f = new Food(this.game, x, y, id);
        f.sprite.body.setCollisionGroup(this.foodCollisionGroup);
        this.foodGroup.add(f.sprite);
        f.sprite.body.collides([this.snakeHeadCollisionGroup]);
        return f;
    },
    snakeDestroyed: function(snake) {
        //place food where snake was destroyed
        let increment = Math.round(snake.headPath.length / snake.snakeLength) * 2,
            len = snake.headPath.length;
        let foodDrop = [];
        // for (var i = 0; i < len; i += increment) should run Math.ceil(len/increment) times,
        // which generates one food on each iteration, thus send a request for that many uuids
        // Then send back the newly added food to server
        this.game.socket.emit('idRequest', Math.ceil(len / increment), IDArray => {
            // console.log('Received new IDs @ game.js: snakeDestroyed: arrow_function (idRequest ack)');
            for (var i = 0, j = 0; i < len; i += increment, j++) {
                let x = snake.headPath[i].x + Util.randomInt(-10, 10);
                let y = snake.headPath[i].y + Util.randomInt(-10, 10);
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
    },
    remove_food_by_id: function(id) {
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