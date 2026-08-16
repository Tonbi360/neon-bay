// Neon Bay - Main Entry Point
console.log('[Neon Bay] v0.1 - Foundation');

let game = null;

let visibilityHandler = null;
let touchHandler = null;
let errorHandler = null;
let rejectionHandler = null;

/**
 * Initialize Neon Bay once the DOM is ready.
 */
async function initializeGame() {
    console.log('[Main] DOM ready');

    // Prevent the browser from scrolling the game page while touching
    // the game surface. We intentionally avoid blocking every touch
    // event globally so future camera/UI gestures can still work.
    const gameRoot = document.getElementById('game-container') || document.body;

    touchHandler = (event) => {
        if (event.cancelable) {
            event.preventDefault();
        }
    };

    gameRoot.addEventListener('touchmove', touchHandler, {
        passive: false
    });

    try {
        game = new Game();

        await game.init();

        console.log('[Main] Game initialized successfully');
    } catch (error) {
        console.error('[Main] Game initialization failed:', error);

        // Game.js owns the actual error UI.
        if (game && typeof game.showError === 'function') {
            game.showError(error);
        }
    }
}

/**
 * Pause/resume the game when the browser/app becomes hidden or visible.
 */
function setupVisibilityHandling() {
    visibilityHandler = () => {
        if (!game) {
            return;
        }

        if (document.hidden) {
            console.log('[Main] Page hidden - pausing');

            if (typeof game.stop === 'function') {
                game.stop();
            }
        } else {
            console.log('[Main] Page visible - resuming');

            if (typeof game.start === 'function') {
                game.start();
            }
        }
    };

    document.addEventListener('visibilitychange', visibilityHandler);
}

/**
 * Global error logging.
 *
 * We don't attempt to recover from arbitrary JavaScript errors here.
 * Game.js is responsible for game-state recovery.
 */
function setupErrorHandling() {
    errorHandler = (event) => {
        console.error(
            '[Main] Global error:',
            event.error || event.message
        );
    };

    rejectionHandler = (event) => {
        console.error(
            '[Main] Unhandled promise rejection:',
            event.reason
        );
    };

    window.addEventListener('error', errorHandler);
    window.addEventListener(
        'unhandledrejection',
        rejectionHandler
    );
}

/**
 * Remove listeners and stop the game.
 *
 * Useful when rebuilding/reinitializing the application without
 * accumulating duplicate listeners.
 */
function shutdownGame() {
    console.log('[Main] Shutting down');

    if (game && typeof game.stop === 'function') {
        game.stop();
    }

    const gameRoot =
        document.getElementById('game-container') || document.body;

    if (touchHandler) {
        gameRoot.removeEventListener('touchmove', touchHandler);
        touchHandler = null;
    }

    if (visibilityHandler) {
        document.removeEventListener(
            'visibilitychange',
            visibilityHandler
        );
        visibilityHandler = null;
    }

    if (errorHandler) {
        window.removeEventListener('error', errorHandler);
        errorHandler = null;
    }

    if (rejectionHandler) {
        window.removeEventListener(
            'unhandledrejection',
            rejectionHandler
        );
        rejectionHandler = null;
    }

    game = null;
}

// Bootstrap
document.addEventListener(
    'DOMContentLoaded',
    () => {
        setupErrorHandling();
        setupVisibilityHandling();
        initializeGame();
    },
    { once: true }
);
