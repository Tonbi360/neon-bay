class SceneManager {
    constructor(container) {
        this.container = container;

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.neighborhood = null;

        this.clock = new THREE.Clock();

        // Keep a reference so it can be removed during dispose().
        this.resizeHandler = null;

        this.init();
    }

    // ============================================================
    // INITIALIZATION
    // ============================================================

    init() {
        this.createScene();
        this.createCamera();
        this.createRenderer();
        this.setupLights();

        // The world is created here so every gameplay system
        // shares the same Neighborhood instance.
        this.neighborhood = new Neighborhood(this.scene);

        this.setupResizeHandler();

        this.clock.start();
    }

    // ============================================================
    // SCENE
    // ============================================================

    createScene() {
        this.scene = new THREE.Scene();

        // Neon Bay's current daytime visual direction.
        this.scene.background = new THREE.Color(0x87ceeb);

        this.scene.fog = new THREE.Fog(
            0x87ceeb,
            80,
            350
        );
    }

    // ============================================================
    // CAMERA
    // ============================================================

    createCamera() {
        const width = Math.max(window.innerWidth, 1);
        const height = Math.max(window.innerHeight, 1);

        this.camera = new THREE.PerspectiveCamera(
            75,
            width / height,
            0.1,
            1000
        );

        this.camera.position.set(
            0,
            5,
            10
        );

        this.camera.lookAt(
            0,
            0,
            0
        );
    }

    // ============================================================
    // RENDERER
    // ============================================================

    createRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: 'high-performance'
        });

        this.renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );

        // Limit DPR for mobile performance.
        this.renderer.setPixelRatio(
            Math.min(
                window.devicePixelRatio || 1,
                1.5
            )
        );

        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type =
            THREE.PCFSoftShadowMap;

        this.container.appendChild(
            this.renderer.domElement
        );
    }

    // ============================================================
    // LIGHTING
    // ============================================================

    setupLights() {
        // Main directional sunlight.
        const dirLight =
            new THREE.DirectionalLight(
                0xffffff,
                1
            );

        dirLight.position.set(
            50,
            100,
            50
        );

        dirLight.castShadow = true;

        // Shadow camera.
        dirLight.shadow.camera.left = -100;
        dirLight.shadow.camera.right = 100;
        dirLight.shadow.camera.top = 100;
        dirLight.shadow.camera.bottom = -100;

        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;

        this.scene.add(dirLight);

        // General ambient illumination.
        const ambientLight =
            new THREE.AmbientLight(
                0x404040,
                0.6
            );

        this.scene.add(ambientLight);

        // Sky/ground lighting.
        const hemiLight =
            new THREE.HemisphereLight(
                0xffffbb,
                0x080820,
                0.4
            );

        this.scene.add(hemiLight);
    }

    // ============================================================
    // RESIZE
    // ============================================================

    setupResizeHandler() {
        this.resizeHandler = () => {
            this.handleResize();
        };

        window.addEventListener(
            'resize',
            this.resizeHandler
        );
    }

    handleResize() {
        if (!this.camera || !this.renderer) {
            return;
        }

        const width =
            Math.max(window.innerWidth, 1);

        const height =
            Math.max(window.innerHeight, 1);

        this.camera.aspect =
            width / height;

        this.camera.updateProjectionMatrix();

        this.renderer.setSize(
            width,
            height
        );
    }

    // ============================================================
    // TIME
    // ============================================================

    getDelta() {
        // Prevent huge physics jumps after the browser/app
        // has been suspended.
        return Math.min(
            this.clock.getDelta(),
            0.05
        );
    }

    resetClock() {
        this.clock.stop();
        this.clock.start();
    }

    // ============================================================
    // RENDERING
    // ============================================================

    render() {
        if (
            !this.renderer ||
            !this.scene ||
            !this.camera
        ) {
            return;
        }

        this.renderer.render(
            this.scene,
            this.camera
        );
    }

    // ============================================================
    // CLEANUP
    // ============================================================

    dispose() {
        console.log(
            '[SceneManager] Disposing'
        );

        // Stop clock.
        this.clock.stop();

        // Remove resize listener.
        if (this.resizeHandler) {
            window.removeEventListener(
                'resize',
                this.resizeHandler
            );

            this.resizeHandler = null;
        }

        // Dispose the world.
        if (
            this.neighborhood &&
            typeof this.neighborhood.dispose ===
                'function'
        ) {
            this.neighborhood.dispose();
        }

        this.neighborhood = null;

        // Dispose renderer.
        if (this.renderer) {
            const renderer =
                this.renderer;

            const canvas =
                renderer.domElement;

            renderer.dispose();

            // Dispose renderer render lists when supported.
            if (
                renderer.renderLists &&
                typeof renderer.renderLists.dispose ===
                    'function'
            ) {
                renderer.renderLists.dispose();
            }

            // Remove canvas from DOM.
            if (
                canvas &&
                canvas.parentNode === this.container
            ) {
                this.container.removeChild(canvas);
            }
        }

        this.renderer = null;
        this.camera = null;
        this.scene = null;
    }
            }
