import io from 'socket.io-client';
import BotSnake from './botSnake';
import PlayerSnake from './playerSnake';
import Food from './food';
import Util from './util';
import uuid from 'uuid/v1';

var Game = function(game) {}

Game.prototype = {
    preload: function() {
        //load assets
        this.game.load.image('circle','asset/circle.png');
    	this.game.load.image('shadow', 'asset/white-shadow.png');
    	this.game.load.image('background', 'asset/tile.png');

    	this.game.load.image('eye-white', 'asset/eye-white.png');
    	this.game.load.image('eye-black', 'asset/eye-black.png');

        this.game.load.image('food', 'asset/hex.png');
        this.game.socket = io('http://localhost:8000');
    },
    create: function() {
        //set world size
        var width = 500;
        var height = 500;
        this.game.world.setBounds(-width, -height, width*2, height*2);
        this.game.stage.backgroundColor = '#444';
        this.game.stage.disableVisibilityChange = true;

        //add tilesprite background
        var background = this.game.add.tileSprite(-width, -height,
            this.game.world.width, this.game.world.height, 'background');

        //initialize physics and groups
        this.game.physics.startSystem(Phaser.Physics.P2JS);
        this.foodGroup = this.game.add.group();
        this.snakeHeadCollisionGroup = this.game.physics.p2.createCollisionGroup();
        this.foodCollisionGroup = this.game.physics.p2.createCollisionGroup();

        //add food from server
        this.game.socket.emit('on_food_init');
        this.game.socket.on('on_get_food',this.onGetFood.bind(this));
        this.game.snakes = [];

        //create player
        var snake = new PlayerSnake(this.game, 'circle', 0, 0, uuid());
        this.game.camera.follow(snake.head);

        //remote destroy food
        this.game.socket.on('destroy_food', this.remove_food_by_id.bind(this));

        this.game.socket.on('new_enemyPlayer', this.onNewPlayer.bind(this));
        this.game.socket.on('enemyMove', this.onEnemyMove.bind(this));
        this.game.socket.on('enemyDestroy', this.onEnemyDestroy.bind(this));

        //initialize snake groups and collision
        for (var i = 0 ; i < this.game.snakes.length ; i++) {
            var snake = this.game.snakes[i];
            // TODO
            snake.head.body.setCollisionGroup(this.snakeHeadCollisionGroup);
            snake.head.body.collides([this.foodCollisionGroup]);
            //callback for when a snake is destroyed
            snake.addDestroyedCallback(this.snakeDestroyed, this);
         }
    },
    onGetFood: function(data) {
        for(var i = 0;i< data.length;i++){
            this.initFood(data[i].x, data[i].y,data[i].id);
        }
    },
    onNewPlayer: function(data) {
        var snake = new BotSnake(this.game, 'circle', data.path[0].x, data.path[0].y, data.id);
        snake.remote_headPath = data.path;
        //console.log('onNewPlayer', this.game.snakes);
    },
    onEnemyMove: function(data) {
        //console.log('onEnemyMove', data);
        var snake = this.game.snakes.find(e => e.id == data.id);
        if(snake == null) return;
        snake.remote_headPath = data.path;
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
    /**
     * Main update loop
     */
    update: function() {
        //update game components
        for (var i = this.game.snakes.length - 1 ; i >= 0 ; i--) {
            this.game.snakes[i].update();
        }
        for (var i = this.foodGroup.children.length - 1 ; i >= 0 ; i--) {
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
        let increment = Math.round(snake.headPath.length/snake.snakeLength) * 2, len = snake.headPath.length;
        let foodDrop = [];
        this.game.socket.emit('idRequest', Math.floor(len/increment)+1, IDArray => {
            // console.log('Received new IDs @ game.js: snakeDestroyed: arrow_function (idRequest ack)');
            for (var i = 0, j = 0; i < len; i += increment, j++) {
                let x = snake.headPath[i].x + Util.randomInt(-10, 10);
                let y = snake.headPath[i].y + Util.randomInt(-10, 10);
                this.initFood(x, y, IDArray[j]);
                foodDrop.push({x: x, y: y, id: IDArray[j]});
            }
            // console.log('Sending id and foodDrop to server @ game.js: snakeDestroyed');
            this.game.socket.emit("snakeDestroyed", {id: snake.id, drop: foodDrop});
        });
    },
    remove_food_by_id: function(id){
        // console.log(`Received Request of Removing food ${id} @ game.js: remove_food_by_id`);
        for(var i = 0; i<this.foodGroup.children.length; i++){
            if(this.foodGroup.children[i].id == id){
                // console.log("Found the food to destroy @ game.js: remove_food_by_id")
                this.foodGroup.children[i].food.remote_destroy();
                return;
            }
        }
        console.error(`[Error]: food ${id} not found @ game.js: remove_food_by_id`);
        // Maybe two snake ate the same food (very unlikely)
    }
};

export default Game;