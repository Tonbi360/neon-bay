class Game {
    constructor() {
        this.container = document.getElementById('game-container');
        this.loadingScreen = document.getElementById('loading-screen');
        this.errorScreen = document.getElementById('error-screen');
        this.retryBtn = document.getElementById('retry-btn');
        
        // UI Elements
        this.btnInteract = document.getElementById('btn-interact');
        
        this.sceneManager = null;
        this.controls = null;
        this.playerCar = null;
        this.targetVehicle = null;
        this.hud = null;
        
        this.isRunning = false;
        this.isPaused = false;
        this.isLoaded = false;

        // Interaction radius - must be VERY close
        this.INTERACTION_RADIUS = 3.5;
        
        this.retryBtn.addEventListener('click', () => this.restart());
        this.setupInteraction();
    }

    setupInteraction() {
        // Button tap handler (harmless for now)
        if (this.btnInteract) {
            this.btnInteract.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('[VehicleInteraction] Target vehicle selected');
                // In NB-010: this will trigger vehicle theft
            });
            
            // Prevent touch bleeding
            this.btnInteract.addEventListener('touchstart', (e) => {
                e.stopPropagation();
            }, { passive: false });
        }
    }
    
    async init() {
        try {
            console.log('[Game] Initializing...');
            this.loadingScreen.classList.remove('hidden');
            
            if (typeof THREE === 'undefined') throw new Error('Three.js not loaded');
            
            this.sceneManager = new SceneManager(this.container);
            this.controls = new Controls();
            this.playerCar = new PlayerCar(
                this.sceneManager, 
                this.controls,
                this.sceneManager.neighborhood
            );
            
            // NB-008: Spawn the target vehicle (Blue Sedan)
            this.targetVehicle = new Vehicle(
                this.sceneManager.scene,
                this.sceneManager.neighborhood,
                {
                    x: 15,       // Near the gas station
                    z: -20, 
                    rotY: Math.PI / 2, // Parked perpendicular to the road
                    color: 0x0055ff,   // Distinctive blue
                    width: 2.2,
                    depth: 4.5
                }
            );

            this.hud = new HUD(this);
            // Ensure prompt is hidden on load
            if (this.btnInteract) {
                this.btnInteract.classList.add('hidden');
            }

            setTimeout(() => {
                this.loadingScreen.classList.add('hidden');
                this.isLoaded = true;
                this.start();
            }, 500);
        } catch (error) {
            console.error('[Game] Initialization failed:', error);
            this.showError();
        }
    }
    
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.animate();
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
    }
    
    stop() {
        this.isRunning = false;
    }
    
    animate() {
        if (!this.isRunning) return;
        
        requestAnimationFrame(() => this.animate());
        
        if (this.isPaused) return;
        
        const delta = this.sceneManager.getDelta();
        
        if (this.playerCar) {
            this.playerCar.update(delta);
            this.hud.updateSpeed(this.playerCar.speed);
            
            // Check vehicle interaction
            this.updateInteraction();
        }
        
        this.sceneManager.render();
    }
    
    showError() {
        this.loadingScreen.style.display = 'none';
        this.errorScreen.classList.add('show');
    }

    updateInteraction() {
        if (!this.playerCar || !this.targetVehicle || !this.btnInteract) return;

        // Calculate distance
        const dist = this.playerCar.getPosition().distanceTo(this.targetVehicle.mesh.position);

        // Show/hide prompt based on distance
        if (dist <= this.INTERACTION_RADIUS) {
            this.btnInteract.classList.remove('hidden');
        } else {
            this.btnInteract.classList.add('hidden');
        }
    }
    
    hideError() {
        this.errorScreen.classList.remove('show');
    }
    
    async restart() {
        this.hideError();
        if (this.playerCar) this.playerCar.dispose();
        if (this.targetVehicle) this.targetVehicle.dispose(); // Clean up target vehicle
        if (this.sceneManager) this.sceneManager.dispose();
        
        this.isRunning = false;
        this.isPaused = false;
        this.isLoaded = false;
        
        // Hide prompt on restart
        if (this.btnInteract) {
            this.btnInteract.classList.add('hidden');
        }

        await this.init();
    }
}
