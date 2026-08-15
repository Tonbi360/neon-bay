class Game {
    constructor() {
        this.container = document.getElementById('game-container');
        this.loadingScreen = document.getElementById('loading-screen');
        this.errorScreen = document.getElementById('error-screen');
        this.retryBtn = document.getElementById('retry-btn');
        
        this.sceneManager = null;
        this.isRunning = false;
        this.isLoaded = false;
        
        this.retryBtn.addEventListener('click', () => this.restart());
    }
    
    async init() {
        try {
            console.log('[Game] Initializing...');
            
            // Show loading
            this.loadingScreen.classList.remove('hidden');
            
            // Wait for Three.js to load
            if (typeof THREE === 'undefined') {
                throw new Error('Three.js not loaded');
            }
            
            // Initialize scene manager
            this.sceneManager = new SceneManager(this.container);
            
            // Hide loading
            setTimeout(() => {
                this.loadingScreen.classList.add('hidden');
                this.isLoaded = true;
                this.start();
            }, 500);
            
            console.log('[Game] Initialized successfully');
            
        } catch (error) {
            console.error('[Game] Initialization failed:', error);
            this.showError();
        }
    }
    
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.animate();
        console.log('[Game] Started');
    }
    
    stop() {
        this.isRunning = false;
        console.log('[Game] Stopped');
    }
    
    animate() {
        if (!this.isRunning) return;
        
        requestAnimationFrame(() => this.animate());
        
        const delta = this.sceneManager.getDelta();
        
        // Simple test animation - rotate car slowly
        if (this.sceneManager.testCar) {
            this.sceneManager.testCar.rotation.y += delta * 0.1;
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
        console.log('[Game] Restarting...');
        this.hideError();
        
        if (this.sceneManager) {
            this.sceneManager.dispose();
        }
        
        this.isRunning = false;
        this.isLoaded = false;
        
        await this.init();
    }
}
