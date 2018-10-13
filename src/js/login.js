class Login extends Phaser.State {
    constructor() {
        super();
        this.login = document.getElementById('login');
        this.logo1 = document.getElementById('loseer_logo');
        this.logo2 = document.getElementById('eeweek_logo');
        this.warning = document.getElementById('nullstringwarning');
        document.getElementById('submitname').addEventListener('click', () => {
            if (this.login.children.nameinput.value) {
                this.login.style.visibility = 'hidden';
                this.logo1.style.visibility = 'hidden';
                this.logo2.style.visibility = 'hidden';
                this.game.playerName = login.children.nameinput.value;
                this.game.state.start('Game');

                this.canvas.style.visibility = 'visible';
                this.canvas.className = '';
                this.warning.innerHTML = '';
            }
            else
                this.warning.innerHTML = 'Please enter a name';
        });
    }

    preload() {
        this.canvas = document.getElementsByTagName('canvas')[0];
        this.canvas.className += 'fadeout';
        // Make the game resize itself
        this.game.scale.scaleMode = Phaser.ScaleManager.RESIZE;
    }

    create() {
        this.game.playerName = '';
        if (this.login.style.visibility === 'hidden') {
            this.login.style.visibility = 'initial';
            this.logo1.style.visibility = 'initial';
            this.logo2.style.visibility = 'initial';
        }
        this.login.children.nameinput.value = '';

        //dashboard hidden
        document.getElementById("dashboard").style.visibility = "hidden"
        //burst button hidden
        // document.getElementById("progress").style.visibility = "hidden"
    }
}
export default Login;