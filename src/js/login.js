class Login extends Phaser.State {
    constructor() {
        super();
        document.getElementById('submitname').addEventListener('click', () => {
            let login = document.getElementById('login');
            if (login.children.nameinput.value) {
                login.style.visibility = 'hidden';
                this.game.playerName = login.children.nameinput.value;
                // Make the game resize itself
                this.game.scale.scaleMode = Phaser.ScaleManager.RESIZE;
                this.game.state.start('Game');
                document.getElementsByTagName('canvas')[0].className = '';
                document.getElementById('nullstringwarning').innerHTML = '';
                document.getElementsByTagName('canvas')[0].style.visibility = 'visible';
            }
            else
                document.getElementById('nullstringwarning').innerHTML = 'Please enter a name';
        });
    }

    create() {
        // document.getElementsByTagName('canvas')[0].style.visibility = 'hidden';
        this.game.playerName = '';
        let login = document.getElementById('login');
        if (login.style.visibility === 'hidden')
            login.style.visibility = 'initial';
        login.children.nameinput.value = '';
    }
}
export default Login;