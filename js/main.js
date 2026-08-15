// Neon Bay - Main Entry Point
console.log(' Neon Bay v0.1 - Foundation');

// Global game instance
let game = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Main] DOM ready');
    
    // Prevent default touch behaviors
    document.addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, { passive: false });
    
    // Create and initialize game
    game = new Game();
    game.init();
    
    // Handle visibility change (pause/resume)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            console.log('[Main] Page hidden - pausing');
            if (game) game.stop();
        } else {
            console.log('[Main] Page visible - resuming');
            if (game) game.start();
        }
    });
});

// Handle errors
window.addEventListener('error', (e) => {
    console.error('[Main] Global error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('[Main] Unhandled promise rejection:', e.reason);
});
