import Snake from './snake'
import SnakeProps from './SnakeProps'
import Eye from './eye'

/**
 * Player of the core snake for controls
 * @param  {Phaser.Game} game      game object
 * @param  {String} spriteKey Phaser sprite key
 * @param  {Number} x         coordinate
 * @param  {Number} y         coordinate
 */
var EnemySnake = function(game, spriteKey, x, y, props = SnakeProps) {
    Snake.call(this, game, spriteKey, x, y, props);
    // console.log(`New enermy snake created @ enemySnake.js: anonymous/EnemySnake`)
    this.id = props.id;
    this.rotateLeft = true;
    this.rotating = false;
    this.forwardSpeed = 0;
    this.headPos = new Phaser.Point(x, y);
    this.rotation = 0;

    // this.head.debug = true;
}

EnemySnake.prototype = Object.create(Snake.prototype);
EnemySnake.prototype.constructor = EnemySnake;

/**
 * Add functionality to the original snake update method so that the player
 * can control where this snake goes
 */
EnemySnake.prototype.tempUpdate = EnemySnake.prototype.update;
EnemySnake.prototype.update = function() {
    this.head.body.setZeroRotation();
    if(this.rotating) {
        if (this.rotateLeft)
        this.head.body.rotateLeft(this.rotationSpeed);
        else
        this.head.body.rotateRight(this.rotationSpeed);
    }
    this.head.body.rotation = this.rotation;
    this.head.body.moveForward(this.forwardSpeed);
    
    if(this.headPath && this.headPath.length > 0) {
        let point = this.headPath.pop();
        if(point) {
            this.head.body.x = point.x = this.headPos.x;
            this.head.body.y = point.y = this.headPos.y;
            this.headPath.unshift(point);
        }
        else
            console.error(`headPath is empty @ enemySnake.js: anonymous/update`);
    }

    //call the original snake update method
    this.tempUpdate();
}
export default EnemySnake;