class Game {
    constructor() {
        this.container = document.getElementById('game-container');
        this.loadingScreen = document.getElementById('loading-screen');
        this.errorScreen = document.getElementById('error-screen');
        this.retryBtn = document.getElementById('retry-btn');
        
        this.sceneManager = null;
        this.controls = null;
        this.playerCar = null;
        this.hud = null;
        
        this.isRunning = false;
        this.isPaused = false;
        this.isLoaded = false;
        
        this.retryBtn.addEventListener('click', () => this.restart());
    }
    
    async init() {
        try {
            console.log('[Game] Initializing...');
            this.loadingScreen.classList.remove('hidden');
            
            if (typeof THREE === 'undefined') throw new Error('Three.js not loaded');
            
            this.sceneManager = new SceneManager(this.container);
            this.controls = new Controls();
            this.playerCar = new PlayerCar(
                this.sceneManager.scene, 
                this.controls,
                this.sceneManager.neighborhood // Pass neighborhood for collision
            );
            this.hud = new HUD(this);
            
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
        }
        
        this.sceneManager.render();
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
        if (this.sceneManager) this.sceneManager.dispose();
        
        this.isRunning = false;
        this.isPaused = false;
        this.isLoaded = false;
        
        await this.init();
    }
}
