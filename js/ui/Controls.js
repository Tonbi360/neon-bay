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

        // Track active pointers so one finger releasing doesn't
        // accidentally release another active control.
        this.activePointers = new Map();

        this.setupButtons();
        this.setupKeyboard();
        this.setupFocusHandling();
    }

    // ============================================================
    // BUTTON CONTROLS
    // ============================================================

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
                console.warn(
                    `[Controls] Button not found: #${id}`
                );

                continue;
            }

            this.buttons[key] = button;

            // Prevent browser gestures such as scrolling,
            // dragging and text selection on game controls.
            button.style.touchAction = 'none';

            const press = (event) => {
                event.preventDefault();
                event.stopPropagation();

                const pointerId = event.pointerId;

                this.activePointers.set(
                    pointerId,
                    key
                );

                this.setInput(key, true);

                // Keep receiving pointer events even if the finger
                // moves outside the button.
                if (
                    typeof button.setPointerCapture ===
                    'function'
                ) {
                    try {
                        button.setPointerCapture(pointerId);
                    } catch (error) {
                        // Pointer capture isn't supported/available
                        // in every browser state.
                    }
                }
            };

            const release = (event) => {
                event.preventDefault();
                event.stopPropagation();

                const pointerId = event.pointerId;

                const activeKey =
                    this.activePointers.get(pointerId);

                if (activeKey) {
                    this.activePointers.delete(pointerId);

                    // Only release this particular control.
                    this.releasePointerInput(activeKey);
                }
            };

            button.addEventListener(
                'pointerdown',
                press
            );

            button.addEventListener(
                'pointerup',
                release
            );

            button.addEventListener(
                'pointercancel',
                release
            );

            button.addEventListener(
                'lostpointercapture',
                release
            );

            this.listeners.push(
                {
                    element: button,
                    type: 'pointerdown',
                    handler: press
                },
                {
                    element: button,
                    type: 'pointerup',
                    handler: release
                },
                {
                    element: button,
                    type: 'pointercancel',
                    handler: release
                },
                {
                    element: button,
                    type: 'lostpointercapture',
                    handler: release
                }
            );
        }
    }

    releasePointerInput(key) {
        // Don't release the control if another pointer is still
        // holding the same control.
        for (const activeKey of this.activePointers.values()) {
            if (activeKey === key) {
                return;
            }
        }

        this.setInput(key, false);
    }

    // ============================================================
    // KEYBOARD
    // ============================================================

    setupKeyboard() {
        this.keyDownHandler = (event) => {
            const key =
                this.getInputFromKey(event.code);

            if (!key) {
                return;
            }

            // Prevent browser scrolling while using game controls.
            event.preventDefault();

            this.setInput(key, true);
        };

        this.keyUpHandler = (event) => {
            const key =
                this.getInputFromKey(event.code);

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

    // ============================================================
    // INPUT STATE
    // ============================================================

    setInput(key, value) {
        if (!(key in this.input)) {
            return;
        }

        this.input[key] = Boolean(value);

        const button =
            this.buttons[key];

        if (button) {
            button.classList.toggle(
                'active',
                this.input[key]
            );
        }
    }

    clearInput() {
        this.activePointers.clear();

        for (const key of Object.keys(this.input)) {
            this.setInput(key, false);
        }
    }

    // ============================================================
    // FOCUS / VISIBILITY
    // ============================================================

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

    // ============================================================
    // CLEANUP
    // ============================================================

    dispose() {
        console.log(
            '[Controls] Disposing'
        );

        this.clearInput();

        // Remove pointer listeners.
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

        this.activePointers.clear();
        this.buttons = {};
    }
}
