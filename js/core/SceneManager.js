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

    // ------------------------------------------------------------
    // INITIALIZATION
    // ------------------------------------------------------------

    init() {
        this.createScene();
        this.createCamera();
        this.createRenderer();

        this.setupLights();

        // The world is created here so every gameplay system can
        // access the same neighborhood instance.
        this.neighborhood = new Neighborhood(this.scene);

        this.setupResizeHandler();

        this.clock.start();
    }

    createScene() {
        this.scene = new THREE.Scene();

        // Current Neon Bay visual direction.
        this.scene.background = new THREE.Color(0x87ceeb);

        // Keep the existing neighborhood-scale fog.
        this.scene.fog = new THREE.Fog(
            0x87ceeb,
            80,
            350
        );
    }

    createCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );

        this.camera.position.set(0, 5, 10);

        this.camera.lookAt(0, 0, 0);
    }

    createRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: 'high-performance'
        });

        this.renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );

        // A cap of 1.5 gives us better mobile performance than
        // rendering at extremely high device pixel ratios.
        this.renderer.setPixelRatio(
            Math.min(window.devicePixelRatio || 1, 1.5)
        );

        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type =
            THREE.PCFSoftShadowMap;

        this.container.appendChild(
            this.renderer.domElement
        );
    }

    // ------------------------------------------------------------
    // LIGHTING
    // ------------------------------------------------------------

    setupLights() {
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

        dirLight.shadow.camera.left = -100;
        dirLight.shadow.camera.right = 100;
        dirLight.shadow.camera.top = 100;
        dirLight.shadow.camera.bottom = -100;

        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;

        this.scene.add(dirLight);

        const ambientLight =
            new THREE.AmbientLight(
                0x404040,
                0.6
            );

        this.scene.add(ambientLight);

        const hemiLight =
            new THREE.HemisphereLight(
                0xffffbb,
                0x080820,
                0.4
            );

        this.scene.add(hemiLight);
    }

    // ------------------------------------------------------------
    // RESIZE
    // ------------------------------------------------------------

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

        const width = window.innerWidth;
        const height = window.innerHeight;

        this.camera.aspect =
            width / Math.max(height, 1);

        this.camera.updateProjectionMatrix();

        this.renderer.setSize(
            width,
            height
        );
    }

    // ------------------------------------------------------------
    // TIME
    // ------------------------------------------------------------

    getDelta() {
        // Prevent unusually large time steps after a tab/app
        // suspension from launching vehicles or characters.
        return Math.min(
            this.clock.getDelta(),
            0.05
        );
    }

    resetClock() {
        this.clock.stop();
        this.clock.start();
    }

    // ------------------------------------------------------------
    // RENDERING
    // ------------------------------------------------------------

    render() {
        if (!this.renderer || !this.scene || !this.camera) {
            return;
        }

        this.renderer.render(
            this.scene,
            this.camera
        );
    }

    // ------------------------------------------------------------
    // CLEANUP
    // ------------------------------------------------------------

    dispose() {
        console.log('[SceneManager] Disposing');

        // Stop future timing.
        this.clock.stop();

        // Remove resize listener.
        if (this.resizeHandler) {
            window.removeEventListener(
                'resize',
                this.resizeHandler
            );

            this.resizeHandler = null;
        }

        // Dispose world if it exposes cleanup.
        if (
            this.neighborhood &&
            typeof this.neighborhood.dispose === 'function'
        ) {
            this.neighborhood.dispose();
        }

        this.neighborhood = null;

        // Dispose renderer.
        if (this.renderer) {
            this.renderer.dispose();

            // Release WebGL context resources where supported.
            const renderLists =
                this.renderer.renderLists;

            if (
                renderLists &&
                typeof renderLists.dispose === 'function'
            ) {
                renderLists.dispose();
            }

            const canvas =
                this.renderer.domElement;

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
