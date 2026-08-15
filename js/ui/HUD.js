class HUD {
    constructor(game) {
        this.game = game;
        this.speedVal = document.getElementById('speed-val');
        this.pauseMenu = document.getElementById('pause-menu');
        
        this.setupPauseMenu();
    }

    updateSpeed(rawSpeed) {
        // Map raw speed (0 to 0.35) to a fake KM/H (0 to ~120)
        const kmh = Math.floor((rawSpeed / 0.35) * 120);
        this.speedVal.textContent = kmh;
    }

    setupPauseMenu() {
        const btnPause = document.getElementById('btn-pause');
        const btnResume = document.getElementById('btn-resume');
        const btnRestart = document.getElementById('btn-restart');

        btnPause.addEventListener('click', () => this.togglePause(true));
        btnResume.addEventListener('click', () => this.togglePause(false));
        btnRestart.addEventListener('click', () => {
            this.togglePause(false);
            this.game.restart();
        });
    }

    togglePause(isPaused) {
        if (isPaused) {
            this.pauseMenu.classList.remove('hidden');
            this.game.pause();
        } else {
            this.pauseMenu.classList.add('hidden');
            this.game.resume();
        }
    }
}
