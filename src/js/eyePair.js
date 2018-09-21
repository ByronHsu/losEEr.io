import Eye from './eye'
import Util from './util';

/**
 * Creates a pair of eyes
 * @param  {Phaser.Game} game  game object
 * @param  {Phaser.Sprite} head  Snake head sprite
 * @param  {Number} scale scale of eyes
 */
var EyePair = function(game, head, scale, headAngle) {
    this.game = game;
    this.head = head;
    this.scale = scale;
    this.eyes = [];
    
    this.debug = false;
    // fix eye angle
    this.headAngle = headAngle
    console.log("EyePair headAngle", this.headAngle)
    if (this.headAngle < 0) this.headAngle = 360 + this.headAngle
    let cosThe = Math.cos(Math.PI * this.headAngle / 180)
    let sinThe =  Math.sin(Math.PI * this.headAngle / 180)
    //create two eyes
    var offset = this.getOffset();
    this.leftEye = new Eye(this.game, this.head, this.scale, headAngle);
    // -offset.x, -offset.y 
    let xv = -offset.x
    let yv = -offset.y
    // this.leftEye.updateConstraints([cosThe * xv - sinThe * yv, sinThe * xv + cosThe * yv]);
    this.leftEye.updateConstraints([xv, yv])
    this.eyes.push(this.leftEye);

    this.rightEye = new Eye(this.game, this.head, this.scale, headAngle);
    // offset.x, -offset.y
    xv = offset.x
    // this.rightEye.updateConstraints([cosThe * xv - sinThe * yv, sinThe * xv + cosThe * yv]);
    this.rightEye.updateConstraints([xv, yv])
    this.eyes.push(this.rightEye);
    // console.log("Eyes", this.eyes)
}

EyePair.prototype = {
    /**
     * Get the offset that eyes should be from the head (based on scale)
     * @return {Object} offset distance with properties x and y
     */
    getOffset: function() {
        var xDim = this.head.width*0.25;
        var yDim = this.head.width*.125;
        return {x: xDim, y: yDim};
    },
    /**
     * Set the scale of the eyes
     * @param  {Number} scale new scale
     */
    setScale: function(scale, headAngle = 0) {
        console.log("setScaleAngle", headAngle)
        this.leftEye.setScale(scale);
        this.rightEye.setScale(scale);
        //update constraints to place them at the right offset
        this.headAngle = headAngle
        if (this.headAngle < 0) this.headAngle = 360 + this.headAngle
        let cosThe = Math.cos(Math.PI * this.headAngle / 180)
        let sinThe =  Math.sin(Math.PI * this.headAngle / 180)
        var offset = this.getOffset();
        // -offset.x, -offset.y 
        let xv = -offset.x
        let yv = -offset.y
        // this.leftEye.updateConstraints([cosThe * xv - sinThe * yv, sinThe * xv + cosThe * yv]);
        this.leftEye.updateConstraints([xv, yv])
        // offset.x, -offset.y
        xv = offset.x
        // this.rightEye.updateConstraints([cosThe * xv - sinThe * yv, sinThe * xv + cosThe * yv]);
        this.rightEye.updateConstraints([xv, yv])
    },
    /**
     * Call from snake update loop
     */
    update: function() {
        for (var i = 0 ; i < this.eyes.length ; i++) {
            this.eyes[i].update();
        }
    },
    /**
     * Destroy this eye pair
     */
    destroy: function() {
        this.leftEye.destroy();
        this.rightEye.destroy();
    }
};
export default EyePair;