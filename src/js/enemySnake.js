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
    // this.cursors = game.input.keyboard.createCursorKeys();
    console.log(`New enermy snake created @ enemySnake.js: anonymous/EnemySnake`)
    // //handle the space key so that the player's snake can speed up
    // var spaceKey = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    // var self = this;
    // spaceKey.onDown.add(this.spaceKeyDown, this);
    // spaceKey.onUp.add(this.spaceKeyUp, this);
    this.id = props.id;
    this.rotateLeft = true;
    this.rotating = false;
    this.forwardSpeed = 0;
    this.headPos = new Phaser.Point(x, y);
    // this.addDestroyedCallback(function() {
    //     spaceKey.onDown.remove(this.spaceKeyDown, this);
    //     spaceKey.onUp.remove(this.spaceKeyUp, this);
    // }, this);
}

EnemySnake.prototype = Object.create(Snake.prototype);
EnemySnake.prototype.constructor = EnemySnake;

//make this snake light up and speed up when the space key is down
// EnemySnake.prototype.spaceKeyDown = function() {
//     this.speed = this.fastSpeed;
//     this.shadow.isLightingUp = true;
// }
// //make the snake slow down when the space key is up again
// EnemySnake.prototype.spaceKeyUp = function() {
//     this.speed = this.slowSpeed;
//     this.shadow.isLightingUp = false;
// }

/**
 * Add functionality to the original snake update method so that the player
 * can control where this snake goes
 */
EnemySnake.prototype.tempUpdate = EnemySnake.prototype.update;
EnemySnake.prototype.update = function() {
    // this.headPath = this.remote_headPath;
    // KINEMATIC
    // console.log(this.head.body.motionState)
    // console.log('EnemySnake', this.headPath)
    //call the original snake update method

    this.head.body.setZeroRotation();
    if(this.rotating) {
        if (this.rotateLeft)
            this.head.body.rotateLeft(this.rotationSpeed);
        else
            this.head.body.rotateRight(this.rotationSpeed);
    }

    this.head.body.moveForward(this.forwardSpeed);

    let point = this.headPath.pop();
    if(point) {
        if(point instanceof Phaser.Point)
            point.setTo(this.headPos.x, this.headPos.y);
        else
            console.error(point);
        this.headPath.unshift(point);
    }
    else
        console.error(`headPath is empty @ enemySnake.js: anonymous/update`);

    this.tempUpdate();
}
export default EnemySnake;