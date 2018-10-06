import Shadow from './shadow';
import EyePair from './eyePair';

/**
 * Phaser snake
 * @param  {Phaser.Game} game      game object
 * @param  {String} spriteKey Phaser sprite key
 * @param  {Number} x         coordinate
 * @param  {Number} y         coordinate
 */
var Snake = function (game, spriteKey, x, y, props) {
    this.game = game;
    //create an array of snakes in the game object and add this snake
    if (!this.game.snakes) {
        this.game.snakes = [];
    }
    this.game.snakes.push(this);
    this.debug = false;
    this.spriteKey = spriteKey;

    this.id = props.id
    this.snakeName = props.name
    //various quantities that can be changed
    this.scale = props.scale;
    this.fastSpeed = props.fastSpeed;
    this.slowSpeed = props.slowSpeed;
    this.rotationSpeed = props.rotationSpeed;
    this.headAngle = props.headAngle
    this.speed = this.slowSpeed;
    
    //initialize groups and arrays
    this.snakeLength = props.snakeLength;
    this.collisionGroup = this.game.physics.p2.createCollisionGroup();
    this.sections = [];
    //the head path is an array of points that the head of the snake has
    //traveled through
    this.secDetails = props.secDetails
    this.food = props.food;
    
    this.headPath = []
    this.preferredDistance = 17 * this.scale;
    this.queuedSections = 0;

    //initialize the shadow
    this.shadow = new Shadow(this.game, this.sections, this.scale);
    this.sectionGroup = this.game.add.group();
    //add the head of the snake
    this.head = this.addSectionAtPosition(x, y);
    this.head.name = "head";
    this.head.snake = this;
    this.lastHeadPosition = new Phaser.Point(this.head.body.x, this.head.body.y);
    // Initial / Create Snake
    if (this.snakeLength === 1) this.initSections(10);
    else {
        // enemySnake
        this.initSections()
    }
    //initialize the eyes
    this.eyes = new EyePair(this.game, this.head, this.scale, this.headAngle);
    
    
    // display snakeName
    this.onDestroyedCallbacks = [];
    this.onDestroyedContexts = [];
    let displayStyle = {
        font: "bold 15px Arial",
        fill: "#0000cc",
        align: "center"
    }
    let textlength = 40
    if (this.snakeName.length > textlength) {
        this.displayName = this.game.add.text(this.secDetails[0].x, this.secDetails[0].y, 
            this.snakeName.substring(0, textlength) + "...", displayStyle)
    } else {
        this.displayName = this.game.add.text(this.secDetails[0].x, this.secDetails[0].y, 
            this.snakeName, displayStyle)
    }
    // console.log(this.displayName)
}
    
Snake.prototype = {
    /**
     * Add a section to the snake at a given position
     * @param  {Number} x coordinate
     * @param  {Number} y coordinate
     * @return {Phaser.Sprite}   new section
     */
    addSectionAtPosition: function (x, y) {
        //initialize a new section
        var sec = this.game.add.sprite(x, y, this.spriteKey);
        this.game.physics.p2.enable(sec, this.debug);
        sec.body.setCollisionGroup(this.collisionGroup);
        sec.body.collides([]);
        sec.body.kinematic = true;

        this.snakeLength++;
        this.sectionGroup.add(sec);
        sec.sendToBack();
        sec.scale.setTo(this.scale);

        this.sections.push(sec);

        this.shadow.add(x, y);
        //add a circle body to this section
        sec.body.clearShapes();
        sec.body.addCircle(sec.width * 0.5);

        return sec;
    },
    /**
     * Set snake scale
     * @param  {Number} scale Scale
     */
    setScale: function (scale) {
        this.scale = scale;
        this.preferredDistance = 17 * this.scale;

        //scale sections and their bodies
        for (var i = 0; i < this.sections.length; i++) {
            var sec = this.sections[i];
            sec.scale.setTo(this.scale);
            sec.body.data.shapes[0].radius = this.game.physics.p2.pxm(sec.width * 0.5);
        }

        //scale eyes and shadows
        this.eyes.setScale(scale, this.headAngle);
        this.shadow.setScale(scale);
    },
    /**
     * Destroy the snake
     */
    destroy: function () {
        this.game.snakes.splice(this.game.snakes.indexOf(this), 1);
        //destroy food that is constrained to the snake head
        for (var i = this.food.length - 1; i >= 0; i--) {
            this.food[i].destroy();
        }
        //destroy everything else
        this.sections.forEach(function (sec, index) {
            sec.destroy();
        });
        this.eyes.destroy();
        this.shadow.destroy();
        this.displayName.destroy();
        //call this snake's destruction callbacks
        for (var i = 0; i < this.onDestroyedCallbacks.length; i++) {
            if (typeof this.onDestroyedCallbacks[i] == "function") {
                this.onDestroyedCallbacks[i].apply(
                    this.onDestroyedContexts[i], [this]);
            }
        }
    },
    /**
     * Add callback for when snake is destroyed
     * @param  {Function} callback Callback function
     * @param  {Object}   context  context of callback
     */
    addDestroyedCallback: function (callback, context) {
        this.onDestroyedCallbacks.push(callback);
        this.onDestroyedContexts.push(context);
    }
};
export default Snake;