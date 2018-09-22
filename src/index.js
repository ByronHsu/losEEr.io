import Login from './js/login';
import Game from './js/game';

var game = new Phaser.Game(window.innerWidth, window.innerHeight, Phaser.AUTO, null);
game.state.add('Login', Login);
game.state.add('Game', Game);
game.state.start('Login');