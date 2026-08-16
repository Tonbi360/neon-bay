class Game {
    constructor() {
        // ============================================================
        // DOM
        // ============================================================

        this.container =
            document.getElementById('game-container');

        this.loadingScreen =
            document.getElementById('loading-screen');

        this.errorScreen =
            document.getElementById('error-screen');

        this.retryBtn =
            document.getElementById('retry-btn');

        // Interaction UI
        this.btnExit =
            document.getElementById('btn-exit');

        this.btnEnter =
            document.getElementById('btn-enter');

        // ============================================================
        // CORE SYSTEMS
        // ============================================================

        this.sceneManager = null;
        this.controls = null;
        this.hud = null;

        // ============================================================
        // PLAYER ENTITIES
        // ============================================================

        this.playerCar = null;
        this.playerCharacter = null;

        // Other vehicles currently present in the world.
        this.parkedVehicles = [];

        // Vehicle currently available for interaction.
        this.interactionTarget = null;

        // ============================================================
        // PLAYER STATE
        // ============================================================

        this.state = 'IN_VEHICLE';

        // ============================================================
        // GAME LIFECYCLE
        // ============================================================

        this.isRunning = false;
        this.isPaused = false;
        this.isLoaded = false;

        this.animationFrame = null;

        // ============================================================
        // INTERACTION TUNING
        // ============================================================

        this.INTERACTION_RADIUS = 3.5;
        this.EXIT_OFFSET = 2.2;

        // Prevent duplicate retry listeners.
        this.restartHandler = null;

        this.setupInteraction();
    }

    // ================================================================
    // INTERACTION SETUP
    // ================================================================

    setupInteraction() {
        // ------------------------------------------------------------
        // EXIT VEHICLE
        // ------------------------------------------------------------

        if (this.btnExit) {
            this.btnExit.addEventListener(
                'click',
                (event) => {
                    event.preventDefault();
                    event.stopPropagation();

                    if (
                        this.state === 'IN_VEHICLE'
                    ) {
                        this.exitVehicle();
                    }
                }
            );

            this.btnExit.addEventListener(
                'touchstart',
                (event) => {
                    event.stopPropagation();
                },
                {
                    passive: false
                }
            );
        }

        // ------------------------------------------------------------
        // ENTER VEHICLE
        // ------------------------------------------------------------

        if (this.btnEnter) {
            this.btnEnter.addEventListener(
                'click',
                (event) => {
                    event.preventDefault();
                    event.stopPropagation();

                    if (
                        this.state === 'ON_FOOT' &&
                        this.interactionTarget
                    ) {
                        this.enterVehicle(
                            this.interactionTarget
                        );
                    }
                }
            );

            this.btnEnter.addEventListener(
                'touchstart',
                (event) => {
                    event.stopPropagation();
                },
                {
                    passive: false
                }
            );
        }

        // ------------------------------------------------------------
        // RETRY
        // ------------------------------------------------------------

        if (this.retryBtn) {
            this.restartHandler = () => {
                this.restart();
            };

            this.retryBtn.addEventListener(
                'click',
                this.restartHandler
            );
        }
    }

    // ================================================================
    // INITIALIZATION
    // ================================================================

    async init() {
        try {
            console.log('[Game] Initializing...');

            this.stop();

            this.isPaused = false;
            this.isLoaded = false;
            this.state = 'IN_VEHICLE';
            this.interactionTarget = null;

            this.hideError();
            this.showLoading();
            this.hideInteractionButtons();

            // --------------------------------------------------------
            // BASIC VALIDATION
            // --------------------------------------------------------

            if (typeof THREE === 'undefined') {
                throw new Error(
                    'Three.js not loaded'
                );
            }

            if (!this.container) {
                throw new Error(
                    'Game container (#game-container) not found'
                );
            }

            // --------------------------------------------------------
            // CORE SYSTEMS
            // --------------------------------------------------------

            this.sceneManager =
                new SceneManager(
                    this.container
                );

            this.controls =
                new Controls();

            // --------------------------------------------------------
            // PLAYER CHARACTER
            // --------------------------------------------------------

            this.playerCharacter =
                new PlayerCharacter(
                    this.sceneManager.scene,
                    this.sceneManager.neighborhood
                );

            // --------------------------------------------------------
            // PLAYER CAR
            // --------------------------------------------------------

            this.playerCar =
                new PlayerCar(
                    this.sceneManager,
                    this.controls,
                    this.sceneManager.neighborhood
                );

            // --------------------------------------------------------
            // PARKED VEHICLE
            // --------------------------------------------------------

            const blueCar =
                new Vehicle(
                    this.sceneManager.scene,
                    this.sceneManager.neighborhood,
                    {
                        x: 15,
                        z: -20,
                        rotY: Math.PI / 2,
                        color: 0x0055ff,
                        width: 2.2,
                        depth: 4.5
                    }
                );

            this.parkedVehicles = [
                blueCar
            ];

            // --------------------------------------------------------
            // HUD
            // --------------------------------------------------------

            this.hud = new HUD(this);

            // --------------------------------------------------------
            // INITIAL PLAYER STATE
            // --------------------------------------------------------

            this.state = 'IN_VEHICLE';
            this.interactionTarget = null;

            this.playerCharacter.setVisible(false);

            if (
                this.playerCar &&
                this.playerCar.mesh
            ) {
                this.playerCar.mesh.visible = true;
                this.playerCar.speed = 0;
                this.playerCar.mesh.updateMatrixWorld(
                    true
                );
            }

            this.hideInteractionButtons();

            // --------------------------------------------------------
            // FINISHED
            // --------------------------------------------------------

            this.isLoaded = true;

            this.hideLoading();
            this.hideError();

            this.start();

            console.log(
                '[Game] Initialization complete'
            );
        } catch (error) {
            console.error(
                '[Game] Initialization failed:',
                error
            );

            this.isLoaded = false;
            this.stop();

            this.showError(error);

            throw error;
        }
    }

    // ================================================================
    // GAME LOOP
    // ================================================================

    start() {
        if (this.isRunning) {
            return;
        }

        if (!this.isLoaded) {
            return;
        }

        this.isRunning = true;

        if (
            this.sceneManager &&
            typeof this.sceneManager.resetClock ===
                'function'
        ) {
            this.sceneManager.resetClock();
        }

        this.animate();
    }

    stop() {
        this.isRunning = false;

        if (
            this.animationFrame !== null
        ) {
            cancelAnimationFrame(
                this.animationFrame
            );

            this.animationFrame = null;
        }
    }

    pause() {
        if (!this.isLoaded) {
            return;
        }

        this.isPaused = true;
    }

    resume() {
        if (!this.isLoaded) {
            return;
        }

        this.isPaused = false;

        if (!this.isRunning) {
            this.start();
        }
    }

    animate() {
        if (!this.isRunning) {
            this.animationFrame = null;
            return;
        }

        this.animationFrame =
            requestAnimationFrame(() => {
                this.animate();
            });

        // Pause freezes gameplay while keeping the render loop
        // alive so the pause menu remains responsive.
        if (this.isPaused) {
            return;
        }

        if (
            !this.sceneManager ||
            !this.controls ||
            !this.playerCar ||
            !this.playerCharacter
        ) {
            return;
        }

        const delta =
            this.sceneManager.getDelta();

        const input =
            this.controls.input;

        // ------------------------------------------------------------
        // IN VEHICLE
        // ------------------------------------------------------------

        if (
            this.state === 'IN_VEHICLE'
        ) {
            this.playerCar.update(delta);

            if (this.hud) {
                this.hud.updateSpeed(
                    this.playerCar.speed
                );
            }

            // PlayerCar currently owns its own camera update,
            // but calling it here keeps camera state synchronized.
            this.playerCar.updateCamera();
        }

        // ------------------------------------------------------------
        // ON FOOT
        // ------------------------------------------------------------

        if (
            this.state === 'ON_FOOT'
        ) {
            this.playerCharacter.update(
                input,
                delta
            );

            if (this.hud) {
                this.hud.updateSpeed(0);
            }

            this.playerCharacter.updateCamera(
                this.sceneManager.camera
            );
        }

        // ------------------------------------------------------------
        // INTERACTIONS
        // ------------------------------------------------------------

        this.updateInteraction();

        // ------------------------------------------------------------
        // RENDER
        // ------------------------------------------------------------

        this.sceneManager.render();
    }

    // ================================================================
    // INTERACTION SYSTEM
    // ================================================================

    updateInteraction() {
        if (
            !this.btnExit ||
            !this.btnEnter
        ) {
            return;
        }

        // ------------------------------------------------------------
        // IN VEHICLE
        // ------------------------------------------------------------

        if (
            this.state === 'IN_VEHICLE'
        ) {
            this.interactionTarget = null;

            this.btnEnter.classList.add(
                'hidden'
            );

            // Only allow exiting while essentially stopped.
            if (
                this.playerCar &&
                Math.abs(
                    this.playerCar.speed
                ) < 0.05
            ) {
                this.btnExit.classList.remove(
                    'hidden'
                );
            } else {
                this.btnExit.classList.add(
                    'hidden'
                );
            }

            return;
        }

        // ------------------------------------------------------------
        // ON FOOT
        // ------------------------------------------------------------

        if (
            this.state === 'ON_FOOT'
        ) {
            this.btnExit.classList.add(
                'hidden'
            );

            const target =
                this.findNearestVehicle();

            this.interactionTarget =
                target;

            if (target) {
                this.btnEnter.classList.remove(
                    'hidden'
                );
            } else {
                this.btnEnter.classList.add(
                    'hidden'
                );
            }
        }
    }

    findNearestVehicle() {
        if (
            !this.playerCharacter ||
            !this.playerCharacter.mesh
        ) {
            return null;
        }

        const playerPosition =
            this.playerCharacter.getPosition();

        let nearestVehicle = null;

        let nearestDistance =
            this.INTERACTION_RADIUS;

        for (
            const vehicle
            of this.parkedVehicles
        ) {
            if (
                !vehicle ||
                !vehicle.mesh ||
                !vehicle.mesh.visible
            ) {
                continue;
            }

            const distance =
                playerPosition.distanceTo(
                    vehicle.mesh.position
                );

            if (
                distance <
                nearestDistance
            ) {
                nearestDistance = distance;
                nearestVehicle = vehicle;
            }
        }

        return nearestVehicle;
    }

    hideInteractionButtons() {
        if (this.btnExit) {
            this.btnExit.classList.add(
                'hidden'
            );
        }

        if (this.btnEnter) {
            this.btnEnter.classList.add(
                'hidden'
            );
        }
    }

    // ================================================================
    // EXIT VEHICLE
    // ================================================================

    exitVehicle() {
        if (
            this.state !== 'IN_VEHICLE'
        ) {
            return;
        }

        if (
            !this.playerCar ||
            !this.playerCar.mesh ||
            !this.playerCharacter
        ) {
            return;
        }

        // ------------------------------------------------------------
        // MUST BE STOPPED
        // ------------------------------------------------------------

        if (
            Math.abs(
                this.playerCar.speed
            ) >= 0.05
        ) {
            return;
        }

        const vehiclePosition =
            this.playerCar.getPosition();

        const vehicleRotation =
            this.playerCar.mesh.rotation.y;

        // ------------------------------------------------------------
        // PLACE CHARACTER BESIDE VEHICLE
        // ------------------------------------------------------------

        if (
            typeof this.playerCharacter
                .setPositionFromVehicle ===
                'function'
        ) {
            this.playerCharacter
                .setPositionFromVehicle(
                    vehiclePosition,
                    vehicleRotation
                );
        } else {
            // Fallback.
            const offsetX =
                Math.sin(
                    vehicleRotation
                ) * this.EXIT_OFFSET;

            const offsetZ =
                Math.cos(
                    vehicleRotation
                ) * this.EXIT_OFFSET;

            this.playerCharacter.mesh.position.set(
                vehiclePosition.x +
                    offsetX,
                0.9,
                vehiclePosition.z +
                    offsetZ
            );

            this.playerCharacter.mesh.rotation.y =
                vehicleRotation;
        }

        // ------------------------------------------------------------
        // SWITCH CONTROL
        // ------------------------------------------------------------

        this.playerCar.speed = 0;
        this.playerCar.mesh.visible = false;

        this.playerCharacter.setVisible(
            true
        );

        this.state = 'ON_FOOT';
        this.interactionTarget = null;

        this.hideInteractionButtons();

        // Force matrices/camera to update immediately.
        this.playerCharacter.mesh.updateMatrixWorld(
            true
        );

        if (
            this.sceneManager &&
            this.sceneManager.camera
        ) {
            this.playerCharacter.updateCamera(
                this.sceneManager.camera
            );
        }

        console.log(
            '[Game] Exited vehicle'
        );
    }

    // ================================================================
    // ENTER VEHICLE
    // ================================================================

    enterVehicle(vehicle = null) {
        if (
            this.state !== 'ON_FOOT'
        ) {
            return;
        }

        const target =
            vehicle ||
            this.interactionTarget;

        if (
            !target ||
            !target.mesh ||
            !this.playerCar ||
            !this.playerCar.mesh ||
            !this.playerCharacter
        ) {
            return;
        }

        // ------------------------------------------------------------
        // VERIFY DISTANCE
        // ------------------------------------------------------------

        const playerPosition =
            this.playerCharacter.getPosition();

        const distance =
            playerPosition.distanceTo(
                target.mesh.position
            );

        if (
            distance >
            this.INTERACTION_RADIUS
        ) {
            return;
        }

        // ------------------------------------------------------------
        // MOVE PLAYER CAR TO TARGET
        // ------------------------------------------------------------

        this.playerCar.mesh.position.copy(
            target.mesh.position
        );

        this.playerCar.mesh.rotation.y =
            target.mesh.rotation.y;

        this.playerCar.speed = 0;

        this.playerCar.mesh.visible =
            true;

        this.playerCar.mesh.updateMatrixWorld(
            true
        );

        // ------------------------------------------------------------
        // HIDE CHARACTER
        // ------------------------------------------------------------

        this.playerCharacter.setVisible(
            false
        );

        // ------------------------------------------------------------
        // REMOVE TARGET FROM WORLD VEHICLES
        // ------------------------------------------------------------

        this.parkedVehicles =
            this.parkedVehicles.filter(
                (vehicle) =>
                    vehicle !== target
            );

        if (
            typeof target.dispose ===
            'function'
        ) {
            target.dispose();
        }

        // ------------------------------------------------------------
        // SWITCH STATE
        // ------------------------------------------------------------

        this.interactionTarget = null;
        this.state = 'IN_VEHICLE';

        this.hideInteractionButtons();

        // Camera immediately transitions to the car.
        this.playerCar.updateCamera();

        console.log(
            '[Game] Entered vehicle'
        );
    }

    // ================================================================
    // LOADING / ERROR UI
    // ================================================================

    showLoading() {
        if (!this.loadingScreen) {
            return;
        }

        this.loadingScreen.style.display =
            'flex';

        this.loadingScreen.classList.remove(
            'hidden'
        );
    }

    hideLoading() {
        if (!this.loadingScreen) {
            return;
        }

        this.loadingScreen.classList.add(
            'hidden'
        );
    }

    showError(error = null) {
        if (error) {
            console.error(
                '[Game] Error:',
                error
            );
        }

        this.stop();

        if (this.loadingScreen) {
            this.loadingScreen.classList.add(
                'hidden'
            );

            this.loadingScreen.style.display =
                'none';
        }

        if (this.errorScreen) {
            // Use explicit display instead of relying on
            // a CSS class that may not exist.
            this.errorScreen.style.display =
                'flex';

            this.errorScreen.classList.add(
                'show'
            );
        }
    }

    hideError() {
        if (!this.errorScreen) {
            return;
        }

        this.errorScreen.classList.remove(
            'show'
        );

        this.errorScreen.style.display =
            'none';
    }

    // ================================================================
    // RESTART
    // ================================================================

    async restart() {
        console.log(
            '[Game] Restarting...'
        );

        this.stop();

        this.isLoaded = false;
        this.isPaused = false;

        this.state = 'IN_VEHICLE';
        this.interactionTarget = null;

        this.hideInteractionButtons();
        this.hideError();

        // ------------------------------------------------------------
        // PLAYER CAR
        // ------------------------------------------------------------

        if (this.playerCar) {
            if (
                typeof this.playerCar.dispose ===
                'function'
            ) {
                this.playerCar.dispose();
            }

            this.playerCar = null;
        }

        // ------------------------------------------------------------
        // PLAYER CHARACTER
        // ------------------------------------------------------------

        if (this.playerCharacter) {
            if (
                typeof this.playerCharacter.dispose ===
                'function'
            ) {
                this.playerCharacter.dispose();
            }

            this.playerCharacter = null;
        }

        // ------------------------------------------------------------
        // PARKED VEHICLES
        // ------------------------------------------------------------

        for (
            const vehicle
            of this.parkedVehicles
        ) {
            if (
                vehicle &&
                typeof vehicle.dispose ===
                'function'
            ) {
                vehicle.dispose();
            }
        }

        this.parkedVehicles = [];

        // ------------------------------------------------------------
        // HUD
        // ------------------------------------------------------------

        /*
         * HUD currently doesn't expose a dispose() method.
         *
         * If one is added later, clean it up here so restart
         * doesn't accumulate UI listeners.
         */
        if (
            this.hud &&
            typeof this.hud.dispose ===
                'function'
        ) {
            this.hud.dispose();
        }

        this.hud = null;

        // ------------------------------------------------------------
        // CONTROLS
        // ------------------------------------------------------------

        if (
            this.controls &&
            typeof this.controls.dispose ===
                'function'
        ) {
            this.controls.dispose();
        }

        this.controls = null;

        // ------------------------------------------------------------
        // SCENE
        // ------------------------------------------------------------

        if (this.sceneManager) {
            if (
                typeof this.sceneManager.dispose ===
                'function'
            ) {
                this.sceneManager.dispose();
            }

            this.sceneManager = null;
        }

        // ------------------------------------------------------------
        // REINITIALIZE
        // ------------------------------------------------------------

        try {
            await this.init();

            console.log(
                '[Game] Restart complete'
            );
        } catch (error) {
            console.error(
                '[Game] Restart failed:',
                error
            );
        }
    }
}
