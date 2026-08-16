class Game {
    constructor() {
        // DOM
        this.container = document.getElementById('game-container');
        this.loadingScreen = document.getElementById('loading-screen');
        this.errorScreen = document.getElementById('error-screen');
        this.retryBtn = document.getElementById('retry-btn');

        // Interaction UI
        this.btnExit = document.getElementById('btn-exit');
        this.btnEnter = document.getElementById('btn-enter');

        // Core systems
        this.sceneManager = null;
        this.controls = null;
        this.hud = null;

        // Player entities
        this.playerCar = null;
        this.playerCharacter = null;

        // Other vehicles currently present in the world
        this.parkedVehicles = [];

        // Current nearby vehicle target
        this.interactionTarget = null;

        // Player state
        this.state = 'IN_VEHICLE';

        // Game lifecycle
        this.isRunning = false;
        this.isPaused = false;
        this.isLoaded = false;

        // Interaction tuning
        this.INTERACTION_RADIUS = 3.5;
        this.EXIT_OFFSET = 2.2;

        // Animation frame tracking
        this.animationFrame = null;

        // Prevent duplicate restart listeners
        this.restartHandler = null;

        this.setupInteraction();
    }

    // ------------------------------------------------------------
    // INITIALIZATION
    // ------------------------------------------------------------

    setupInteraction() {
        if (this.btnExit) {
            this.btnExit.addEventListener('click', (event) => {
                event.preventDefault();

                if (this.state === 'IN_VEHICLE') {
                    this.exitVehicle();
                }
            });

            this.btnExit.addEventListener(
                'touchstart',
                (event) => {
                    event.stopPropagation();
                },
                { passive: false }
            );
        }

        if (this.btnEnter) {
            this.btnEnter.addEventListener('click', (event) => {
                event.preventDefault();

                if (
                    this.state === 'ON_FOOT' &&
                    this.interactionTarget
                ) {
                    this.enterVehicle(this.interactionTarget);
                }
            });

            this.btnEnter.addEventListener(
                'touchstart',
                (event) => {
                    event.stopPropagation();
                },
                { passive: false }
            );
        }

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

    async init() {
        try {
            console.log('[Game] Initializing...');

            this.hideError();

            if (this.loadingScreen) {
                this.loadingScreen.classList.remove('hidden');
            }

            if (typeof THREE === 'undefined') {
                throw new Error('Three.js not loaded');
            }

            if (!this.container) {
                throw new Error(
                    'Game container (#game-container) not found'
                );
            }

            // Core systems
            this.sceneManager = new SceneManager(this.container);
            this.controls = new Controls();

            // On-foot player
            this.playerCharacter = new PlayerCharacter(
                this.sceneManager.scene,
                this.sceneManager.neighborhood
            );

            // Drivable player vehicle
            this.playerCar = new PlayerCar(
                this.sceneManager,
                this.controls,
                this.sceneManager.neighborhood
            );

            // Parked/available vehicle
            const blueCar = new Vehicle(
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

            this.parkedVehicles = [blueCar];

            // HUD
            this.hud = new HUD(this);

            // Initial state
            this.state = 'IN_VEHICLE';
            this.interactionTarget = null;

            this.playerCharacter.setVisible(false);
            this.playerCar.mesh.visible = true;

            this.hideInteractionButtons();

            this.isLoaded = true;

            if (this.loadingScreen) {
                this.loadingScreen.classList.add('hidden');
            }

            this.start();

            console.log('[Game] Initialization complete');
        } catch (error) {
            console.error('[Game] Initialization failed:', error);

            this.isLoaded = false;
            this.stop();
            this.showError(error);

            // Let the caller know initialization failed.
            throw error;
        }
    }

    // ------------------------------------------------------------
    // GAME LOOP
    // ------------------------------------------------------------

    start() {
        if (this.isRunning) {
            return;
        }

        if (!this.isLoaded) {
            return;
        }

        this.isRunning = true;
        this.animate();
    }

    stop() {
        this.isRunning = false;

        if (this.animationFrame !== null) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
    }

    animate() {
        if (!this.isRunning) {
            return;
        }

        this.animationFrame = requestAnimationFrame(() => {
            this.animate();
        });

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

        const delta = this.sceneManager.getDelta();
        const input = this.controls.input;

        if (this.state === 'IN_VEHICLE') {
            this.playerCar.update(delta);

            if (this.hud) {
                this.hud.updateSpeed(this.playerCar.speed);
            }

            this.playerCar.updateCamera();
        }

        if (this.state === 'ON_FOOT') {
            this.playerCharacter.update(input, delta);

            if (this.hud) {
                this.hud.updateSpeed(0);
            }

            this.playerCharacter.updateCamera(
                this.sceneManager.camera
            );
        }

        this.updateInteraction();
        this.sceneManager.render();
    }

    // ------------------------------------------------------------
    // INTERACTION
    // ------------------------------------------------------------

    updateInteraction() {
        if (!this.btnExit || !this.btnEnter) {
            return;
        }

        // --------------------------------------------------------
        // IN VEHICLE
        // --------------------------------------------------------

        if (this.state === 'IN_VEHICLE') {
            this.interactionTarget = null;
            this.btnEnter.classList.add('hidden');

            // Exit is a vehicle action.
            // Keep it available while stopped.
            if (
                this.playerCar &&
                Math.abs(this.playerCar.speed) < 0.05
            ) {
                this.btnExit.classList.remove('hidden');
            } else {
                this.btnExit.classList.add('hidden');
            }

            return;
        }

        // --------------------------------------------------------
        // ON FOOT
        // --------------------------------------------------------

        if (this.state === 'ON_FOOT') {
            this.btnExit.classList.add('hidden');

            const target = this.findNearestVehicle();

            this.interactionTarget = target;

            if (target) {
                this.btnEnter.classList.remove('hidden');
            } else {
                this.btnEnter.classList.add('hidden');
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
        let nearestDistance = this.INTERACTION_RADIUS;

        for (const vehicle of this.parkedVehicles) {
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

            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestVehicle = vehicle;
            }
        }

        return nearestVehicle;
    }

    hideInteractionButtons() {
        if (this.btnExit) {
            this.btnExit.classList.add('hidden');
        }

        if (this.btnEnter) {
            this.btnEnter.classList.add('hidden');
        }
    }

    // ------------------------------------------------------------
    // VEHICLE STATE
    // ------------------------------------------------------------

    exitVehicle() {
        if (this.state !== 'IN_VEHICLE') {
            return;
        }

        if (!this.playerCar || !this.playerCar.mesh) {
            return;
        }

        // Only allow exiting while stopped.
        if (Math.abs(this.playerCar.speed) >= 0.05) {
            return;
        }

        const vehiclePosition =
            this.playerCar.getPosition();

        const vehicleRotation =
            this.playerCar.mesh.rotation.y;

        // Put the character beside the vehicle rather than
        // inside/on top of it.
        if (
            typeof this.playerCharacter
                .setPositionFromVehicle === 'function'
        ) {
            this.playerCharacter.setPositionFromVehicle(
                vehiclePosition,
                vehicleRotation
            );
        } else {
            // Safety fallback while rebuilding dependencies.
            const offsetX =
                Math.sin(vehicleRotation) *
                this.EXIT_OFFSET;

            const offsetZ =
                Math.cos(vehicleRotation) *
                this.EXIT_OFFSET;

            this.playerCharacter.mesh.position.set(
                vehiclePosition.x + offsetX,
                0,
                vehiclePosition.z + offsetZ
            );

            this.playerCharacter.mesh.rotation.y =
                vehicleRotation;
        }

        // Stop and hide the controllable vehicle.
        this.playerCar.speed = 0;
        this.playerCar.mesh.visible = false;

        // Character becomes active.
        this.playerCharacter.setVisible(true);

        this.state = 'ON_FOOT';
        this.interactionTarget = null;

        this.hideInteractionButtons();

        console.log('[Game] Exited vehicle');
    }

    enterVehicle(vehicle = null) {
        if (this.state !== 'ON_FOOT') {
            return;
        }

        const target =
            vehicle || this.interactionTarget;

        if (!target || !target.mesh) {
            return;
        }

        // Verify the player is still close enough.
        const playerPosition =
            this.playerCharacter.getPosition();

        const distance =
            playerPosition.distanceTo(
                target.mesh.position
            );

        if (distance > this.INTERACTION_RADIUS) {
            return;
        }

        // Move controllable vehicle to the target vehicle.
        this.playerCar.mesh.position.copy(
            target.mesh.position
        );

        this.playerCar.mesh.rotation.y =
            target.mesh.rotation.y;

        this.playerCar.speed = 0;
        this.playerCar.mesh.visible = true;

        // Hide character.
        this.playerCharacter.setVisible(false);

        // Remove the parked vehicle from the active list.
        this.parkedVehicles =
            this.parkedVehicles.filter(
                (vehicle) => vehicle !== target
            );

        // Dispose target vehicle.
        if (typeof target.dispose === 'function') {
            target.dispose();
        }

        this.interactionTarget = null;
        this.state = 'IN_VEHICLE';

        this.hideInteractionButtons();

        console.log('[Game] Entered vehicle');
    }

    // ------------------------------------------------------------
    // ERROR HANDLING
    // ------------------------------------------------------------

    showError(error = null) {
        if (error) {
            console.error('[Game] Error:', error);
        }

        if (this.loadingScreen) {
            this.loadingScreen.classList.add('hidden');
            this.loadingScreen.style.display = 'none';
        }

        if (this.errorScreen) {
            this.errorScreen.classList.add('show');
        }
    }

    hideError() {
        if (this.errorScreen) {
            this.errorScreen.classList.remove('show');
        }
    }

    // ------------------------------------------------------------
    // RESTART
    // ------------------------------------------------------------

    async restart() {
        console.log('[Game] Restarting...');

        this.stop();

        this.isLoaded = false;
        this.isPaused = false;
        this.state = 'IN_VEHICLE';
        this.interactionTarget = null;

        this.hideInteractionButtons();

        // Dispose player systems.
        if (this.playerCar) {
            this.playerCar.dispose();
            this.playerCar = null;
        }

        if (this.playerCharacter) {
            this.playerCharacter.dispose();
            this.playerCharacter = null;
        }

        // Dispose parked vehicles.
        for (const vehicle of this.parkedVehicles) {
            if (
                vehicle &&
                typeof vehicle.dispose === 'function'
            ) {
                vehicle.dispose();
            }
        }

        this.parkedVehicles = [];

        // Dispose scene.
        if (this.sceneManager) {
            this.sceneManager.dispose();
            this.sceneManager = null;
        }

        // Controls may provide cleanup in the future.
        if (
            this.controls &&
            typeof this.controls.dispose === 'function'
        ) {
            this.controls.dispose();
        }

        this.controls = null;
        this.hud = null;

        try {
            await this.init();
        } catch (error) {
            console.error(
                '[Game] Restart failed:',
                error
            );
        }
    }
}
