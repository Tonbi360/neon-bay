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

    const gameRoot =
        document.getElementById('game-container') ||
        document.body;

    // Prevent the browser from scrolling the game page while
    // touching the game surface.
    //
    // We intentionally only block touchmove on the game root
    // rather than globally blocking every touch event.
    touchHandler = (event) => {
        if (event.cancelable) {
            event.preventDefault();
        }
    };

    gameRoot.addEventListener(
        'touchmove',
        touchHandler,
        {
            passive: false
        }
    );

    try {
        game = new Game();

        await game.init();

        console.log(
            '[Main] Game initialized successfully'
        );
    } catch (error) {
        console.error(
            '[Main] Game initialization failed:',
            error
        );

        // Game.js owns the actual error UI.
        if (
            game &&
            typeof game.showError === 'function'
        ) {
            game.showError(error);
        } else {
            // If Game itself failed before it could expose
            // the error UI, fall back to the DOM directly.
            const loadingScreen =
                document.getElementById('loading-screen');

            const errorScreen =
                document.getElementById('error-screen');

            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
            }

            if (errorScreen) {
                errorScreen.style.display = 'flex';
            }
        }
    }
}

/**
 * Pause/resume the game when the browser/app becomes
 * hidden or visible.
 *
 * Game.js remains responsible for the actual game state.
 */
function setupVisibilityHandling() {
    visibilityHandler = () => {
        if (!game) {
            return;
        }

        if (document.hidden) {
            console.log(
                '[Main] Page hidden - pausing'
            );

            if (
                typeof game.stop === 'function'
            ) {
                game.stop();
            }
        } else {
            console.log(
                '[Main] Page visible - resuming'
            );

            /*
             * Do not blindly resume a game that the player
             * intentionally paused.
             *
             * Game.js can expose isPaused to distinguish
             * application suspension from an intentional pause.
             */
            if (game.isPaused === true) {
                return;
            }

            if (
                typeof game.start === 'function'
            ) {
                game.start();
            }
        }
    };

    document.addEventListener(
        'visibilitychange',
        visibilityHandler
    );
}

/**
 * Global error logging.
 *
 * We don't attempt to recover from arbitrary JavaScript
 * errors here. Game.js owns game-state recovery.
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

    window.addEventListener(
        'error',
        errorHandler
    );

    window.addEventListener(
        'unhandledrejection',
        rejectionHandler
    );
}

/**
 * Remove listeners and shut down the game.
 *
 * This prevents duplicate listeners if the application
 * is initialized again.
 */
function shutdownGame() {
    console.log('[Main] Shutting down');

    if (game) {
        if (
            typeof game.stop === 'function'
        ) {
            game.stop();
        }

        if (
            typeof game.dispose === 'function'
        ) {
            game.dispose();
        }
    }

    const gameRoot =
        document.getElementById('game-container') ||
        document.body;

    if (touchHandler) {
        gameRoot.removeEventListener(
            'touchmove',
            touchHandler
        );

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
        window.removeEventListener(
            'error',
            errorHandler
        );

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

/**
 * Bootstrap Neon Bay.
 */
document.addEventListener(
    'DOMContentLoaded',
    () => {
        setupErrorHandling();
        setupVisibilityHandling();
        initializeGame();
    },
    {
        once: true
    }
);
