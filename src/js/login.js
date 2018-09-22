class Login extends Phaser.State {
    constructor() {
        super();
        document.getElementById('submitname').addEventListener('click', () => {
            let login = document.getElementById('login');
            if (login.children.nameinput.value) {
                login.style.visibility = 'hidden';
                // Not needed when child.style.display is set to inherit
                // for (let child of login.childNodes) {
                //     if (child.style)
                //         child.style.display = 'none';
                // }
                // alert(login.children.nameinput.value);
                this.game.playerName = login.children.nameinput.value;
                this.game.state.start('Game');
            }
        });
    }

    create() {
        this.game.playerName = '';
        let login = document.getElementById('login');
        if (login.style.visibility === 'hidden')
            login.style.visibility = 'initial';
        login.children.nameinput.value = '';
    }
}
export default Login;