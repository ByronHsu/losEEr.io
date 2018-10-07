/**
 * Food that snakes eat - it is pulled towards the center of a snake head after
 * it is first touched
 * @param  {Phaser.Game} game game object
 * @param  {Number} x    coordinate
 * @param  {Number} y    coordinate
 */
var Food = function (game, x, y, id) {
    this.game = game;
    this.debug = false;
    this.sprite = this.game.add.sprite(x, y, 'food');
    // this.sprite.tint = 00000000;
    this.sprite.id = id;

    this.game.physics.p2.enable(this.sprite, this.debug);
    this.sprite.body.clearShapes();
    this.sprite.body.addCircle(this.sprite.width * 0.5);
    //set callback for when something hits the food
    this.sprite.body.onBeginContact.add(this.onBeginContact, this);

    this.sprite.food = this;

    this.head = null;
    this.constraint = null;
}

Food.prototype = {
    onBeginContact: function (phaserBody, p2Body) {
        if (phaserBody && phaserBody.sprite.name == "head" && this.constraint === null) {
            this.sprite.body.collides([]);
            //Create constraint between the food and the snake head that
            //it collided with. The food is then brought to the center of
            //the head sprite
            this.constraint = this.game.physics.p2.createRevoluteConstraint(
                this.sprite.body, [0, 0], phaserBody, [0, 0]
            );
            this.head = phaserBody.sprite;
            this.head.snake.food.push(this);
        }
    },
    /**
     * Call from main update loop
     */
    update: function () {
        //once the food reaches the center of the snake head, destroy it and
        //increment the size of the snake
        if (this.head && Math.round(this.head.body.x) == Math.round(this.sprite.body.x) &&
            Math.round(this.head.body.y) == Math.round(this.sprite.body.y)) {
            this.head.snake.incrementSize();
            this.game.socket.emit('playerIncrease', {
                id: this.head.snake.id,
                snakeLength: this.head.snake.snakeLength,
                scale: this.head.snake.scale
                // food: this.head.snake.food,
                // queuedSections: this.head.snake.queuedSections
            })
            this.destroy();
        }
    },
    /**
     * Destroy this food and its constraints
     */
    destroy: function () {
        if (this.head) {
            this.game.socket.emit('food_destroy', this.sprite.id);
            this.game.physics.p2.removeConstraint(this.constraint);
            this.sprite.destroy();
            this.head.snake.food.splice(this.head.snake.food.indexOf(this), 1);
            this.head = null;
        }
    },
    remote_destroy: function () {
        // console.log('Remote_destroy called! @ food.js: remote_destroy');
        if (this.head) { // The food to destroy was near the player snake, but another snake ate it first (very unlikely)
            this.game.physics.p2.removeConstraint(this.constraint);
            this.head.snake.food.splice(this.head.snake.food.indexOf(this), 1);
            this.head = null;
        }
        this.sprite.destroy();
    }
};
export default Food;