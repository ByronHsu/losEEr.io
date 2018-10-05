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
    Snake.call(this, game, spriteKey, x, y, props);
    console.log("createEnemySnake", this)
}

EnemySnake.prototype = Object.create(Snake.prototype);
EnemySnake.prototype.constructor = EnemySnake;
/**
 * Add functionality to the original snake update method so that the player
 * can control where this snake goes
 */

// modify enemysnake initSections
EnemySnake.prototype.initSections = function () {
    //create a certain number of sections behind the head
    //only use this once
    for (let i = 1; i < this.secDetails.length; i++) {
        let x = this.secDetails[i].x;
        let y = this.secDetails[i].y
        this.addSectionAtPosition(x, y);
    }
}

// modify enemysnake addSectionAtPosition(x, y)
EnemySnake.prototype.addSectionAtPosition = function(x, y) {
    var sec = this.game.add.sprite(x, y, this.spriteKey);
    this.game.physics.p2.enable(sec, this.debug);
    sec.body.setCollisionGroup(this.collisionGroup);
    sec.body.collides([]);
    sec.body.kinematic = true;

    this.sectionGroup.add(sec);
    sec.sendToBack();
    sec.scale.setTo(this.scale);

    this.sections.push(sec);

    this.shadow.add(x, y);
    //add a circle body to this section
    sec.body.clearShapes();
    sec.body.addCircle(sec.width * 0.5);

    return sec;
}

// EnemySnake.prototype.tempUpdate = EnemySnake.prototype.update;
EnemySnake.prototype.update = function() {
    // console.log("enemy secDetails", this.secDetails)
    for (let i = 0; i < this.sections.length; i++) {
        this.sections[i].body.x = this.secDetails[i].x
        this.sections[i].body.y = this.secDetails[i].y
    }
    for (let i = this.sections.length; i < this.secDetails.length; i++) {
        this.addSectionAtPosition(this.secDetails[i].x, this.secDetails[i].y)
    }

    //call the original snake update method
    // this.tempUpdate();
    this.eyes.update();
    this.shadow.update();

    this.displayName.position.x = this.headPath[0].x - this.displayName.width / 2
    this.displayName.position.y = this.headPath[0].y - this.head.width - 6
}
export default EnemySnake;