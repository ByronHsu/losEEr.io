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
      this.game.load.image('circle','asset/circle.png');
    	this.game.load.image('shadow', 'asset/white-shadow.png');
    	this.game.load.image('background', 'asset/tile.png');

    	this.game.load.image('eye-white', 'asset/eye-white.png');
    	this.game.load.image('eye-black', 'asset/eye-black.png');

      this.game.load.image('food', 'asset/hex.png');
      this.game.socket = io('http://localhost:8000');
    },
    create: function() {
        var width = this.game.width;
        var height = this.game.height;
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

        //add food randomly
        for (var i = 0 ; i < 100 ; i++) {
            this.initFood(Util.randomInt(-width, width), Util.randomInt(-height, height));
        }

         this.game.snakes = [];

         //create player
         var snake = new PlayerSnake(this.game, 'circle', 0, 0, uuid());
         this.game.camera.follow(snake.head);

         //create bots
         //   new EnemySnake(this.game, 'circle', -200, 0);
         //   new EnemySnake(this.game, 'circle', 200, 0);

         this.game.socket.on('new_enemyPlayer', this.onNewPlayer.bind(this));
         this.game.socket.on('enemyMove', this.onEnemyMove.bind(this));
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
    onNewPlayer: function(data) {
      var snake = new EnemySnake(this.game, 'circle', data.path[0].x, data.path[0].y, data.id);
      snake.remote_headPath = data.path;
      console.log('onNewPlayer', this.game.snakes);
    },
    onEnemyMove: function(data) {
      console.log('onEnemyMove', data);
      var snake = this.game.snakes.find((e) => e.id == data.id);
      if(snake == null) return;
      snake.remote_headPath = data.path;
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
    initFood: function(x, y) {
        var f = new Food(this.game, x, y);
        f.sprite.body.setCollisionGroup(this.foodCollisionGroup);
        this.foodGroup.add(f.sprite);
        f.sprite.body.collides([this.snakeHeadCollisionGroup]);
        return f;
    },
    snakeDestroyed: function(snake) {
        //place food where snake was destroyed
        for (var i = 0 ; i < snake.headPath.length ;
        i += Math.round(snake.headPath.length / snake.snakeLength) * 2) {
            this.initFood(
                snake.headPath[i].x + Util.randomInt(-10,10),
                snake.headPath[i].y + Util.randomInt(-10,10)
            );
        }
    }
};

export default Game;