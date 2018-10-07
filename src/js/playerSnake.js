import Snake from './snake'
import SnakeProps from './SnakeProps'
import Util from './util';

/**
 * Player of the core snake for controls
 * @param  {Phaser.Game} game      game object
 * @param  {String} spriteKey Phaser sprite key
 * @param  {Number} x         coordinate
 * @param  {Number} y         coordinate
 */
var PlayerSnake = function(game, spriteKey, x, y, id) {
    // initialize
    let playerSnakeData = Object.assign({}, SnakeProps)
    playerSnakeData.secDetails = []
    console.log("construct playersnake", SnakeProps)
    playerSnakeData.name = game.playerName
    playerSnakeData.id = id
    Snake.call(this, game, spriteKey, x, y, playerSnakeData);
    this.req_exp = 1;
    this.exp = 0;
    this.foodcnt = 0

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
let keyDownInterval = null
let keyUpInterval = null
let energy = 0
PlayerSnake.prototype.spaceKeyDown = function() {
    console.log("spaceKeyDown")
    this.speed = this.fastSpeed;
    this.shadow.isLightingUp = true;
    // console.log("spaceKeyDown")
    this.game.socket.emit("spaceKeyEvent", {
        id: this.id,
        isLightingUp: this.shadow.isLightingUp
    })
    // set longest time of speeding
    let self = this
    clearInterval(keyUpInterval)
    keyDownInterval = setInterval(function() {
        energy++
        // console.log(energy)
        if (energy > 200) {
            self.speed = self.slowSpeed
            self.shadow.isLightingUp = false
            self.game.socket.emit("spaceKeyEvent", {
                id: self.id,
                isLightingUp: self.shadow.isLightingUp
            })
            energy = 200
        }
    }, 1)
}
    //make the snake slow down when the space key is up again
PlayerSnake.prototype.spaceKeyUp = function() {
    clearInterval(keyDownInterval)
    keyUpInterval = setInterval(function() {
        if (energy > 0) energy = energy - 2
        // console.log(energy)
    }, 1)
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
       console.log(phaserBody.sprite.snakeName)
       console.log(`${this.snakeName} is killed by ${phaserBody.sprite.snakeName}`)
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

/**
 * Give the snake starting segments
 * @param  {Number} num number of snake sections to create
 */

// playersnake initSections
PlayerSnake.prototype.initSections = function(num) {
    for (var i = 1; i <= num; i++) {
        var x = this.head.body.x;
        var y = this.head.body.y + i * this.preferredDistance;
        this.addSectionAtPosition(x, y);
        //add a point to the head path so that the section stays there
        this.headPath.push(new Phaser.Point(x, y));
    }
    for (let i = 0;i < this.sections.length; i++) {
        this.secDetails.push({
            x: this.sections[i].body.x,
            y: this.sections[i].body.y
        })
    }
}

/**
 * Add to the queue of new sections
 * @param  {Integer} amount Number of sections to add to queue
 */
PlayerSnake.prototype.addSectionsAfterLast = function (amount) {
    this.queuedSections += amount
}

/**
 * Find in the headPath array which point the next section of the snake
 * should be placed at, based on the distance between points
 * @param  {Integer} currentIndex Index of the previous snake section
 * @return {Integer}              new index
 */
PlayerSnake.prototype.findNextPointIndex = function (currentIndex) {
    //we are trying to find a point at approximately this distance away
    //from the point before it, where the distance is the total length of
    //all the lines connecting the two points
    var prefDist = this.preferredDistance;
    var len = 0;
    var dif = len - prefDist;
    var i = currentIndex;
    var prevDif = null;
    //this loop sums the distances between points on the path of the head
    //starting from the given index of the function and continues until
    //this sum nears the preferred distance between two snake sections
    while (i + 1 < this.headPath.length && (dif === null || dif < 0)) {
        //get distance between next two points
        var dist = Util.distanceFormula(
            this.headPath[i].x, this.headPath[i].y,
            this.headPath[i + 1].x, this.headPath[i + 1].y
        );
        len += dist;
        prevDif = dif;
        //we are trying to get the difference between the current sum and
        //the preferred distance close to zero
        dif = len - prefDist;
        i++;
    }

    //choose the index that makes the difference closer to zero
    //once the loop is complete
    if (prevDif === null || Math.abs(prevDif) > Math.abs(dif)) {
        return i;
    } else {
        return i - 1;
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
    // remove interval
    clearInterval(keyDownInterval)
    clearInterval(keyUpInterval)
    //remove constraints
    this.game.physics.p2.removeConstraint(this.edgeLock);
    this.edge.destroy();
    this.tempDestroy()
}

/**
 * Called each time the snake's second section reaches where the
 * first section was at the last call (completed a single cycle)
 */
PlayerSnake.prototype.onCycleComplete = function() {
    if (this.queuedSections > 0) {
        var lastSec = this.sections[this.sections.length - 1];

        this.exp++;
        console.log(this.exp, ' ', this.req_exp);
        //to control snake size
        if (this.exp >= this.req_exp) {
            this.req_exp++;
            this.exp = 0;
            this.addSectionAtPosition(lastSec.body.x, lastSec.body.y);
            if (this.req_exp % 5 == 0) { this.req_exp *= 2; }
        }
        // this.addSectionAtPosition(lastSec.body.x, lastSec.body.y);
        this.queuedSections--;
    }
}
/**
 * Increment length and scale
 */
PlayerSnake.prototype.incrementSize = function() {
    this.addSectionsAfterLast(1);
    this.setScale(this.scale + 0.001);
}

/**
 * Add functionality to the original snake update method so that the player
 * can control where this snake goes
 */
PlayerSnake.prototype.updateMethod = function() {
    //place each section of the snake on the path of the snake head,
    //a certain distance from the section before it
    var index = 0;
    var lastIndex = null;
    for (var i = 0; i < this.snakeLength; i++) {

        this.sections[i].body.x = this.headPath[index].x;
        this.sections[i].body.y = this.headPath[index].y;

        //hide sections if they are at the same position
        if (lastIndex && index == lastIndex) {
            this.sections[i].alpha = 0;
        } else {
            this.sections[i].alpha = 1;
        }

        lastIndex = index;
        //this finds the index in the head path array that the next point
        //should be at
        index = this.findNextPointIndex(index);
    }

    //continuously adjust the size of the head path array so that we
    //keep only an array of points that we need
    if (index >= this.headPath.length - 1) {
        var lastPos = this.headPath[this.headPath.length - 1];
        this.headPath.push(new Phaser.Point(lastPos.x, lastPos.y));
    } else {
        this.headPath.pop();
    }

    //this calls onCycleComplete every time a cycle is completed
    //a cycle is the time it takes the second section of a snake to reach
    //where the head of the snake was at the end of the last cycle
    var i = 0;
    var found = false;
    while (this.headPath[i].x != this.sections[1].body.x &&
        this.headPath[i].y != this.sections[1].body.y) {
        if (this.headPath[i].x == this.lastHeadPosition.x &&
            this.headPath[i].y == this.lastHeadPosition.y) {
            found = true;
            break;
        }
        i++;
    }
    if (!found) {
        this.lastHeadPosition = new Phaser.Point(this.head.body.x, this.head.body.y);
        this.onCycleComplete();
    }

    //update the eyes and the shadow below the snake
    this.eyes.update();
    this.shadow.update();

    //update displayName
    // console.log("update displayName", this.displayName)
    this.displayName.position.x = this.secDetails[0].x - this.displayName.width / 2
    this.displayName.position.y = this.secDetails[0].y - this.head.width - 6
}
PlayerSnake.prototype.update = function() {
    var headToWidthRatio = this.head.width*this.game.globalScale.x/this.game.camera.width;
    if (headToWidthRatio > 0.04) {
        this.game.add.tween(this.game.camera.scale).to(this.game.globalScale, 800, Phaser.Easing.Linear.None, true);
        this.game.globalScale.x -= 0.005;
        this.game.globalScale.y -= 0.005;
    }
    else if (headToWidthRatio < 0.02) {
        this.game.add.tween(this.game.camera.scale).to(this.game.globalScale, 800, Phaser.Easing.Linear.None, true);
        this.game.globalScale.x += 0.005;
        this.game.globalScale.y += 0.005;
    }

    //find the angle that the head needs to rotate
    //through in order to face the mouse
    var mousePosX = this.game.input.activePointer.worldX;
    var mousePosY = this.game.input.activePointer.worldY;
    var headX = this.head.body.x * this.game.camera.scale.x;
    var headY = this.head.body.y * this.game.camera.scale.y;

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
    //call the original snake update method
    this.updateMethod()
    
    // set secDetails
    for (let i = 0;i < this.secDetails.length; i++) {
        this.secDetails[i].x = this.sections[i].body.x
        this.secDetails[i].y = this.sections[i].body.y
    }
    for (let i = this.secDetails.length; i < this.sections.length; i++) {
        this.secDetails.push({
            x: this.sections[i].body.x,
            y: this.sections[i].body.y
        })
    }

    this.game.socket.emit('playerMove', {
        // headPath: this.headPath,
        id: this.id,
        headAngle: this.head.body.angle,
        secDetails: this.secDetails
    });
    // detect hitting the corner
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

PlayerSnake.prototype.render = function() {
    this.game.debug.spriteInfo(this.head, 32, 32, "rgb(0, 0, 0)");
}
export default PlayerSnake;