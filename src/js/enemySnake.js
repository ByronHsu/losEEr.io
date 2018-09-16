import Snake from './Snake'

/**
 * Player of the core snake for controls
 * @param  {Phaser.Game} game      game object
 * @param  {String} spriteKey Phaser sprite key
 * @param  {Number} x         coordinate
 * @param  {Number} y         coordinate
 */
var EnemySnake = function(game, spriteKey, x, y, id) {
    Snake.call(this, game, spriteKey, x, y);
    this.cursors = game.input.keyboard.createCursorKeys();

    //handle the space key so that the player's snake can speed up
    var spaceKey = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    var self = this;
    spaceKey.onDown.add(this.spaceKeyDown, this);
    spaceKey.onUp.add(this.spaceKeyUp, this);
    this.id = id;
    this.addDestroyedCallback(function() {
        spaceKey.onDown.remove(this.spaceKeyDown, this);
        spaceKey.onUp.remove(this.spaceKeyUp, this);
    }, this);
}

EnemySnake.prototype = Object.create(Snake.prototype);
EnemySnake.prototype.constructor = EnemySnake;

//make this snake light up and speed up when the space key is down
EnemySnake.prototype.spaceKeyDown = function() {
    this.speed = this.fastSpeed;
    this.shadow.isLightingUp = true;
}
//make the snake slow down when the space key is up again
EnemySnake.prototype.spaceKeyUp = function() {
    this.speed = this.slowSpeed;
    this.shadow.isLightingUp = false;
}

/**
 * Add functionality to the original snake update method so that the player
 * can control where this snake goes
 */
EnemySnake.prototype.tempUpdate = EnemySnake.prototype.update;
EnemySnake.prototype.update = function() {
    this.headPath = this.remote_headPath;
    // console.log('EnemySnake', this.headPath)
    //call the original snake update method
    this.tempUpdate();
}
export default EnemySnake;