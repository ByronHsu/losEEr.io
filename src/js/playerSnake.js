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
    // initialize
    let playerSnakeData = SnakeProps
    playerSnakeData.name = game.playerName
    playerSnakeData.id = id
    Snake.call(this, game, spriteKey, x, y, playerSnakeData);

    this.cursors = game.input.keyboard.createCursorKeys();
    //handle the space key so that the player's snake can speed up
    var spaceKey = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    spaceKey.onDown.add(this.spaceKeyDown, this);
    spaceKey.onUp.add(this.spaceKeyUp, this);
    
    //the edge is the front body that can collide with other snakes
    //it is locked to the head of this snake
    this.edgeOffset = 4;
    this.edge = this.game.add.sprite(x, y - this.edgeOffset, this.spriteKey);
    this.edge.name = "edge";
    this.edge.alpha = 0;
    this.game.physics.p2.enable(this.edge, this.debug);
    this.edge.body.setCircle(this.edgeOffset);
    //constrain edge to the front of the head
    this.edgeLock = this.game.physics.p2.createLockConstraint(
        this.edge.body, this.head.body, [0, -this.head.width * 0.5 - this.edgeOffset]
    );
    this.edge.body.onBeginContact.add(this.edgeContact, this);
    
    // socket createPlayer
    console.log("creatPlayer", playerSnakeData)
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
* Called when the front of the snake (the edge) hits something
* @param  {Phaser.Physics.P2.Body} phaserBody body it hit
*/
PlayerSnake.prototype.edgeContact = function (phaserBody) {
   //if the edge hits another snake's section, destroy this snake
   if (phaserBody && this.sections.indexOf(phaserBody.sprite) == -1) {
       this.destroy();
   }
   //if the edge hits this snake's own section, a simple solution to avoid
   //glitches is to move the edge to the center of the head, where it
   //will then move back to the front because of the lock constraint
   else if (phaserBody) {
       this.edge.body.x = this.head.body.x;
       this.edge.body.y = this.head.body.y;
   }
}

// set edgeLock scale
PlayerSnake.prototype.tempSetScale = PlayerSnake.prototype.setScale
PlayerSnake.prototype.setScale = function(scale) {
    this.tempSetScale(scale)
    //update edge lock location with p2 physics
    this.edgeLock.localOffsetB = [
        0, this.game.physics.p2.pxmi(this.head.width * 0.5 + this.edgeOffset)
    ];
}

PlayerSnake.prototype.tempDestroy = PlayerSnake.prototype.destroy
PlayerSnake.prototype.destroy = function() {
    //remove constraints
    this.game.physics.p2.removeConstraint(this.edgeLock);
    this.edge.destroy();
    this.tempDestroy()
}

/**
 * Add functionality to the original snake update method so that the player
 * can control where this snake goes
 */
PlayerSnake.prototype.tempUpdate = PlayerSnake.prototype.update;
PlayerSnake.prototype.update = function() {

    //find the angle that the head needs to rotate
    //through in order to face the mouse
    var mousePosX = this.game.input.activePointer.worldX;
    var mousePosY = this.game.input.activePointer.worldY;
    var headX = this.head.body.x;
    var headY = this.head.body.y;
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