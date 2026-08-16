class HUD {
    constructor(game) {
        this.game = game;

        // --------------------------------------------------------
        // DOM
        // --------------------------------------------------------

        this.speedVal =
            document.getElementById('speed-val');

        this.pauseMenu =
            document.getElementById('pause-menu');

        this.btnPause =
            document.getElementById('btn-pause');

        this.btnResume =
            document.getElementById('btn-resume');

        this.btnRestart =
            document.getElementById('btn-restart');

        // --------------------------------------------------------
        // STATE
        // --------------------------------------------------------

        this.isPaused = false;

        // PlayerCar uses world units / second.
        //
        // maxSpeed = 14
        //
        // We map that arcade speed to an approximately
        // 0 - 160 KM/H dashboard range.
        this.maxRawSpeed = 14;
        this.maxDisplaySpeed = 160;

        // Keep handler references so they can be removed.
        this.pauseHandler = null;
        this.resumeHandler = null;
        this.restartHandler = null;

        this.setupPauseMenu();
        this.updateSpeed(0);
    }

    // ============================================================
    // SPEED
    // ============================================================

    updateSpeed(rawSpeed) {
        if (!this.speedVal) {
            return;
        }

        const speed =
            Number.isFinite(rawSpeed)
                ? Math.max(0, rawSpeed)
                : 0;

        const normalized =
            Math.min(
                speed / this.maxRawSpeed,
                1
            );

        const kmh =
            Math.round(
                normalized *
                this.maxDisplaySpeed
            );

        this.speedVal.textContent = kmh;
    }

    // ============================================================
    // PAUSE MENU
    // ============================================================

    setupPauseMenu() {
        if (this.btnPause) {
            this.pauseHandler = (event) => {
                event.preventDefault();

                this.togglePause(true);
            };

            this.btnPause.addEventListener(
                'click',
                this.pauseHandler
            );
        }

        if (this.btnResume) {
            this.resumeHandler = (event) => {
                event.preventDefault();

                this.togglePause(false);
            };

            this.btnResume.addEventListener(
                'click',
                this.resumeHandler
            );
        }

        if (this.btnRestart) {
            this.restartHandler = (event) => {
                event.preventDefault();

                this.togglePause(false);

                if (
                    this.game &&
                    typeof this.game.restart ===
                        'function'
                ) {
                    this.game.restart();
                }
            };

            this.btnRestart.addEventListener(
                'click',
                this.restartHandler
            );
        }
    }

    // ============================================================
    // PAUSE STATE
    // ============================================================

    togglePause(isPaused) {
        this.isPaused = Boolean(isPaused);

        if (this.pauseMenu) {
            this.pauseMenu.classList.toggle(
                'hidden',
                !this.isPaused
            );
        }

        if (!this.game) {
            return;
        }

        if (this.isPaused) {
            if (
                typeof this.game.pause ===
                'function'
            ) {
                this.game.pause();
            }
        } else {
            if (
                typeof this.game.resume ===
                'function'
            ) {
                this.game.resume();
            }
        }
    }

    // ============================================================
    // CLEANUP
    // ============================================================

    dispose() {
        // Remove pause listener.
        if (
            this.btnPause &&
            this.pauseHandler
        ) {
            this.btnPause.removeEventListener(
                'click',
                this.pauseHandler
            );

            this.pauseHandler = null;
        }

        // Remove resume listener.
        if (
            this.btnResume &&
            this.resumeHandler
        ) {
            this.btnResume.removeEventListener(
                'click',
                this.resumeHandler
            );

            this.resumeHandler = null;
        }

        // Remove restart listener.
        if (
            this.btnRestart &&
            this.restartHandler
        ) {
            this.btnRestart.removeEventListener(
                'click',
                this.restartHandler
            );

            this.restartHandler = null;
        }

        this.game = null;
    }
                }
