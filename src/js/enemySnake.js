import Snake from './snake'
import SnakeProps from './SnakeProps'

/**
 * Player of the core snake for controls
 * @param  {Phaser.Game} game      game object
 * @param  {String} spriteKey Phaser sprite key
 * @param  {Number} x         coordinate
 * @param  {Number} y         coordinate
 */
var EnemySnake = function(game, spriteKey, x, y, props = SnakeProps) {
    // console.log("ConstructEnemySnake", props)
    Snake.call(this, game, spriteKey, x, y, props);
}

EnemySnake.prototype = Object.create(Snake.prototype);
EnemySnake.prototype.constructor = EnemySnake;
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