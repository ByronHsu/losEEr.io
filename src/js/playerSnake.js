import Snake from './snake'
import SnakeProps from './SnakeProps'

/**
 * Player of the core snake for controls
 * @param  {Phaser.Game} game      game object
 * @param  {String} spriteKey Phaser sprite key
 * @param  {Number} x         coordinate
 * @param  {Number} y         coordinate
 */
var PlayerSnake = function(game, spriteKey, x, y, id) {
    let playerSnakeData = SnakeProps
    playerSnakeData.name = game.playerName
    Snake.call(this, game, spriteKey, x, y, playerSnakeData);
    this.cursors = game.input.keyboard.createCursorKeys();
    
    //handle the space key so that the player's snake can speed up
    var spaceKey = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    var self = this;
    spaceKey.onDown.add(this.spaceKeyDown, this);
    spaceKey.onUp.add(this.spaceKeyUp, this);
    this.id = id;
    playerSnakeData.id = this.id;
    this.game.debug_line = new Phaser.Line();
    this.game.socket.emit('createPlayer', playerSnakeData);
    this.addDestroyedCallback(function() {
        spaceKey.onDown.remove(this.spaceKeyDown, this);
        spaceKey.onUp.remove(this.spaceKeyUp, this);
    }, this);
}

PlayerSnake.prototype = Object.create(Snake.prototype);
PlayerSnake.prototype.constructor = PlayerSnake;

//make this snake light up and speed up when the space key is down
PlayerSnake.prototype.spaceKeyDown = function() {
        this.speed = this.fastSpeed;
        this.shadow.isLightingUp = true;
        // console.log("spaceKeyDown")
        this.game.socket.emit("spaceKeyEvent", {
            id: this.id,
            isLightingUp: this.shadow.isLightingUp
        })
    }
    //make the snake slow down when the space key is up again
PlayerSnake.prototype.spaceKeyUp = function() {
    this.speed = this.slowSpeed;
    this.shadow.isLightingUp = false;
    this.game.socket.emit("spaceKeyEvent", {
        id: this.id,
        isLightingUp: this.shadow.isLightingUp
    })
}

/**
 * Add functionality to the original snake update method so that the player
 * can control where this snake goes
 */
PlayerSnake.prototype.tempUpdate = PlayerSnake.prototype.update;
PlayerSnake.prototype.update = function() {
    if (this.head.width*this.game.globalScale.x/this.game.camera.width > 0.04) {
        this.game.add.tween(this.game.camera.scale).to(this.game.globalScale, 800, Phaser.Easing.Linear.None, true);
        this.game.globalScale.x -= 0.005;
        this.game.globalScale.y -= 0.005;
    }

    //find the angle that the head needs to rotate
    //through in order to face the mouse
    var mousePosX = this.game.input.activePointer.worldX;
    var mousePosY = this.game.input.activePointer.worldY;
    var headX = this.head.body.x * this.game.camera.scale.x;
    var headY = this.head.body.y * this.game.camera.scale.y;

    this.game.debug_line.setTo(mousePosX, mousePosY, headX, headY);
    var angle = (180 * Math.atan2(mousePosX - headX, mousePosY - headY) / Math.PI);
    if (angle > 0) {
        angle = 180 - angle;
    } else {
        angle = -180 - angle;
    }
    var dif = this.head.body.angle - angle;
    this.head.body.setZeroRotation();
    //allow arrow keys to be used
    if (this.cursors.left.isDown) {
        this.head.body.rotateLeft(this.rotationSpeed);
    } else if (this.cursors.right.isDown) {
        this.head.body.rotateRight(this.rotationSpeed);
    }
    //decide whether rotating left or right will angle the head towards
    //the mouse faster, if arrow keys are not used
    else if (dif < 0 && dif > -180 || dif > 180) {
        this.head.body.rotateRight(this.rotationSpeed);
    } else if (dif > 0 && dif < 180 || dif < -180) {
        this.head.body.rotateLeft(this.rotationSpeed);
    }

    var speed = this.speed;
    this.head.body.moveForward(speed);

    //remove the last element of an array that contains points which
    //the head traveled through
    //then move this point to the front of the array and change its value
    //to be where the head is located
    var point = this.headPath.pop();
    point.setTo(this.head.body.x, this.head.body.y);
    this.headPath.unshift(point);
    // detect hitting the corner
    // console.log('playerMove', { headPath: this.headPath, id: this.id , angle: this.head.body.angle})
    this.game.socket.emit('playerMove', {
        headPath: this.headPath,
        id: this.id,
        headAngle: this.head.body.angle
    });

    //call the original snake update method
    this.tempUpdate();
    let worldWidth = this.game.worldWidth
    let worldHeight = this.game.worldHeight
    let cornerWidth = this.game.cornerWidth
    let headRad = this.head.width / 2
        // console.log(worldHeight, worldWidth, cornerWidth)
        // console.log(this.scale)
    if (this.head.body.x - (-worldWidth + cornerWidth) < headRad || (worldWidth - cornerWidth) - this.head.body.x < headRad) {
        // console.log("hit the corner", this.id);
        this.destroy();
    } else if (this.head.body.y - (-worldHeight + cornerWidth) < headRad || (worldHeight - cornerWidth) - this.head.body.y < headRad) {
        // console.log("hit the corner", this.id);
        this.destroy();
    }
}
export default PlayerSnake;