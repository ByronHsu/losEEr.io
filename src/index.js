import Login from './js/login';
import Game from './js/game';

var game = new Phaser.Game(document.documentElement.clientWidth*0.99, document.documentElement.clientHeight*0.98, Phaser.AUTO, null);

game.state.add('Login', Login);
game.state.add('Game', Game);
game.state.start('Login');