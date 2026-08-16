class Game {
    constructor() {
        this.container = document.getElementById('game-container');
        this.loadingScreen = document.getElementById('loading-screen');
        this.errorScreen = document.getElementById('error-screen');
        this.retryBtn = document.getElementById('retry-btn');
        
        // UI Elements
        this.btnExit = document.getElementById('btn-exit');
        this.btnEnter = document.getElementById('btn-enter');
        
        this.sceneManager = null;
        this.controls = null;
        this.playerCar = null;
        this.playerCharacter = null;
        this.parkedVehicles = [];
        this.hud = null;
        
        this.state = 'IN_VEHICLE'; // 'IN_VEHICLE' or 'ON_FOOT'
        this.isRunning = false;
        this.isPaused = false;
        this.isLoaded = false;
        
        this.INTERACTION_RADIUS = 3.5;
        
        this.retryBtn.addEventListener('click', () => this.restart());
        this.setupInteraction();
    }

    setupInteraction() {
        // EXIT VEHICLE
        if (this.btnExit) {
            this.btnExit.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.state === 'IN_VEHICLE') this.exitVehicle();
            });
            this.btnExit.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: false });
        }

        // ENTER VEHICLE
        if (this.btnEnter) {
            this.btnEnter.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.state === 'ON_FOOT') this.enterVehicle();
            });
            this.btnEnter.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: false });
        }
    }
    
    async init() {
        try {
            console.log('[Game] Initializing...');
            this.loadingScreen.classList.remove('hidden');
            
            if (typeof THREE === 'undefined') throw new Error('Three.js not loaded');
            
            this.sceneManager = new SceneManager(this.container);
            this.controls = new Controls();
            
            // Player Character (On Foot)
            this.playerCharacter = new PlayerCharacter(this.sceneManager.scene, this.sceneManager.neighborhood);
            
            // Player Car (Drivable)
            this.playerCar = new PlayerCar(
                this.sceneManager, 
                this.controls,
                this.sceneManager.neighborhood
            );
            
            // Initial Parked Vehicle (Blue Sedan)
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
            this.parkedVehicles.push(blueCar);

            this.hud = new HUD(this);
            
            // Hide interaction buttons initially
            if (this.btnExit) this.btnExit.classList.add('hidden');
            if (this.btnEnter) this.btnEnter.classList.add('hidden');
            
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

    pause() { this.isPaused = true; }
    resume() { this.isPaused = false; }
    stop() { this.isRunning = false; }
    
    animate() {
        if (!this.isRunning) return;
        
        requestAnimationFrame(() => this.animate());
        
        if (this.isPaused) return;
        
        const delta = this.sceneManager.getDelta();
        const input = this.controls.input;
        
        if (this.state === 'IN_VEHICLE') {
            this.playerCar.update(delta);
            this.hud.updateSpeed(this.playerCar.speed);
            this.playerCar.updateCamera();
        } else if (this.state === 'ON_FOOT') {
            this.playerCharacter.update(input, delta);
            this.hud.updateSpeed(0);
            this.playerCharacter.updateCamera(this.sceneManager.camera);
        }
        
        this.updateInteraction();
        this.sceneManager.render();
    }

    updateInteraction() {
        if (!this.btnExit || !this.btnEnter) return;

        if (this.state === 'IN_VEHICLE') {
            // Show EXIT button ONLY when stopped (speed < 0.05)
            if (this.playerCar.speed < 0.05) {
                this.btnExit.classList.remove('hidden');
                this.btnEnter.classList.add('hidden');
            } else {
                // Hide EXIT button when moving
                this.btnExit.classList.add('hidden');
            }
        } else if (this.state === 'ON_FOOT') {
            // Check distance to all parked vehicles
            let closestDist = this.INTERACTION_RADIUS;
            const playerPos = this.playerCharacter.getPosition();
            
            for (let v of this.parkedVehicles) {
                const dist = playerPos.distanceTo(v.mesh.position);
                if (dist < closestDist) {
                    closestDist = dist;
                }
            }
            
            if (closestDist < this.INTERACTION_RADIUS) {
                this.btnEnter.classList.remove('hidden');
            } else {
                this.btnEnter.classList.add('hidden');
            }
            this.btnExit.classList.add('hidden');
        }
    }

    exitVehicle() {
        if (this.state !== 'IN_VEHICLE') return;
        if (this.playerCar.speed > 0.05) return; // Must be stopped

        // 1. Get current car position/rotation
        const pos = this.playerCar.getPosition();
        const rot = this.playerCar.mesh.rotation.y;

        // 2. Create abandoned car (static)
        const abandonedCar = new Vehicle(
            this.sceneManager.scene,
            this.sceneManager.neighborhood,
            { x: pos.x, z: pos.z, rotY: rot, color: 0xcc0000, width: 2.2, depth: 4.5 }
        );
        this.parkedVehicles.push(abandonedCar);

        // 3. Hide player car
        this.playerCar.mesh.visible = false;
        this.playerCar.speed = 0;

        // 4. Show player character
        this.playerCharacter.setPosition(pos.x, pos.z, rot);
        this.playerCharacter.setVisible(true);

        // 5. Switch state
        this.state = 'ON_FOOT';
        console.log('[Game] Exited vehicle');
    }

    enterVehicle() {
        if (this.state !== 'ON_FOOT') return;

        // Find closest vehicle
        let closest = null;
        let minDist = this.INTERACTION_RADIUS;
        const playerPos = this.playerCharacter.getPosition();

        for (let v of this.parkedVehicles) {
            const dist = playerPos.distanceTo(v.mesh.position);
            if (dist < minDist) {
                minDist = dist;
                closest = v;
            }
        }

        if (closest) {
            // 1. Hide player character
            this.playerCharacter.setVisible(false);

            // 2. Move player car to this position
            this.playerCar.mesh.position.copy(closest.mesh.position);
            this.playerCar.mesh.rotation.y = closest.mesh.rotation.y;
            this.playerCar.mesh.visible = true;
            this.playerCar.speed = 0;

            // 3. Remove from parked vehicles
            this.parkedVehicles = this.parkedVehicles.filter(v => v !== closest);
            closest.dispose();

            // 4. Switch state
            this.state = 'IN_VEHICLE';
            console.log('[Game] Entered vehicle');
        }
    }
    
    showError() {
        this.loadingScreen.style.display = 'none';
        this.errorScreen.classList.add('show');
    }
    
    hideError() {
        this.errorScreen.classList.remove('show');
    }
    
    async restart() {
        this.hideError();
        if (this.playerCar) this.playerCar.dispose();
        if (this.playerCharacter) this.playerCharacter.dispose();
        this.parkedVehicles.forEach(v => v.dispose());
        if (this.sceneManager) this.sceneManager.dispose();
        
        this.isRunning = false;
        this.isPaused = false;
        this.isLoaded = false;
        this.state = 'IN_VEHICLE';
        
        if (this.btnExit) this.btnExit.classList.add('hidden');
        if (this.btnEnter) this.btnEnter.classList.add('hidden');
        
        await this.init();
    }
}
