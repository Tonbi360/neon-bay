class Controls {
    constructor() {
        this.input = {
            left: false,
            right: false,
            acc: false,
            brk: false
        };

        this.buttons = {};
        this.listeners = [];

        this.setupButtons();
        this.setupKeyboard();
        this.setupFocusHandling();
    }

    // ------------------------------------------------------------
    // BUTTON CONTROLS
    // ------------------------------------------------------------

    setupButtons() {
        const definitions = [
            ['btn-left', 'left'],
            ['btn-right', 'right'],
            ['btn-acc', 'acc'],
            ['btn-brk', 'brk']
        ];

        for (const [id, key] of definitions) {
            const button = document.getElementById(id);

            if (!button) {
                continue;
            }

            this.buttons[key] = button;

            const press = (event) => {
                event.preventDefault();
                event.stopPropagation();

                this.setInput(key, true);
            };

            const release = (event) => {
                event.preventDefault();
                event.stopPropagation();

                this.setInput(key, false);
            };

            // Touch
            button.addEventListener(
                'touchstart',
                press,
                { passive: false }
            );

            button.addEventListener(
                'touchend',
                release,
                { passive: false }
            );

            button.addEventListener(
                'touchcancel',
                release,
                { passive: false }
            );

            // Mouse
            button.addEventListener(
                'mousedown',
                press
            );

            button.addEventListener(
                'mouseup',
                release
            );

            button.addEventListener(
                'mouseleave',
                release
            );

            this.listeners.push(
                {
                    element: button,
                    type: 'touchstart',
                    handler: press,
                    options: { passive: false }
                },
                {
                    element: button,
                    type: 'touchend',
                    handler: release,
                    options: { passive: false }
                },
                {
                    element: button,
                    type: 'touchcancel',
                    handler: release,
                    options: { passive: false }
                },
                {
                    element: button,
                    type: 'mousedown',
                    handler: press
                },
                {
                    element: button,
                    type: 'mouseup',
                    handler: release
                },
                {
                    element: button,
                    type: 'mouseleave',
                    handler: release
                }
            );
        }
    }

    // ------------------------------------------------------------
    // KEYBOARD
    // ------------------------------------------------------------

    setupKeyboard() {
        this.keyDownHandler = (event) => {
            const key = this.getInputFromKey(event.code);

            if (!key) {
                return;
            }

            // Prevent arrows/space from scrolling the page while
            // they're being used as game controls.
            event.preventDefault();

            this.setInput(key, true);
        };

        this.keyUpHandler = (event) => {
            const key = this.getInputFromKey(event.code);

            if (!key) {
                return;
            }

            event.preventDefault();

            this.setInput(key, false);
        };

        window.addEventListener(
            'keydown',
            this.keyDownHandler
        );

        window.addEventListener(
            'keyup',
            this.keyUpHandler
        );
    }

    getInputFromKey(code) {
        switch (code) {
            case 'ArrowLeft':
            case 'KeyA':
                return 'left';

            case 'ArrowRight':
            case 'KeyD':
                return 'right';

            case 'ArrowUp':
            case 'KeyW':
                return 'acc';

            case 'ArrowDown':
            case 'KeyS':
            case 'Space':
                return 'brk';

            default:
                return null;
        }
    }

    // ------------------------------------------------------------
    // INPUT STATE
    // ------------------------------------------------------------

    setInput(key, value) {
        if (!(key in this.input)) {
            return;
        }

        this.input[key] = value;

        const button = this.buttons[key];

        if (button) {
            button.classList.toggle(
                'active',
                value
            );
        }
    }

    clearInput() {
        for (const key of Object.keys(this.input)) {
            this.setInput(key, false);
        }
    }

    // ------------------------------------------------------------
    // FOCUS / VISIBILITY
    // ------------------------------------------------------------

    setupFocusHandling() {
        this.blurHandler = () => {
            this.clearInput();
        };

        this.visibilityHandler = () => {
            if (document.hidden) {
                this.clearInput();
            }
        };

        window.addEventListener(
            'blur',
            this.blurHandler
        );

        document.addEventListener(
            'visibilitychange',
            this.visibilityHandler
        );
    }

    // ------------------------------------------------------------
    // CLEANUP
    // ------------------------------------------------------------

    dispose() {
        console.log('[Controls] Disposing');

        this.clearInput();

        // Remove button listeners.
        for (const listener of this.listeners) {
            listener.element.removeEventListener(
                listener.type,
                listener.handler,
                listener.options
            );
        }

        this.listeners = [];

        // Remove keyboard listeners.
        if (this.keyDownHandler) {
            window.removeEventListener(
                'keydown',
                this.keyDownHandler
            );

            this.keyDownHandler = null;
        }

        if (this.keyUpHandler) {
            window.removeEventListener(
                'keyup',
                this.keyUpHandler
            );

            this.keyUpHandler = null;
        }

        // Remove focus listeners.
        if (this.blurHandler) {
            window.removeEventListener(
                'blur',
                this.blurHandler
            );

            this.blurHandler = null;
        }

        if (this.visibilityHandler) {
            document.removeEventListener(
                'visibilitychange',
                this.visibilityHandler
            );

            this.visibilityHandler = null;
        }

        this.buttons = {};
    }
                    }
