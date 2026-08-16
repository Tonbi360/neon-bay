class Vehicle {
    constructor(scene, neighborhood, config = {}) {
        this.scene = scene;
        this.neighborhood = neighborhood;

        this.config = {
            x: config.x ?? 0,
            z: config.z ?? 0,
            rotY: config.rotY ?? 0,
            color: config.color ?? 0xcc0000,
            width: config.width ?? 2.2,
            depth: config.depth ?? 4.5
        };

        this.mesh = new THREE.Group();

        // Collision registration.
        this.collisionBox = null;

        // Prevent dispose() from running more than once.
        this.isDisposed = false;

        this.build();

        // --------------------------------------------------------
        // WORLD TRANSFORM
        // --------------------------------------------------------

        this.mesh.position.set(
            this.config.x,
            0,
            this.config.z
        );

        this.mesh.rotation.y =
            this.config.rotY;

        this.scene.add(this.mesh);

        this.registerCollision();
    }

    // ============================================================
    // BUILD VEHICLE
    // ============================================================

    build() {
        // --------------------------------------------------------
        // BODY
        // --------------------------------------------------------

        const bodyGeometry =
            new THREE.BoxGeometry(
                2,
                0.8,
                4.2
            );

        const bodyMaterial =
            new THREE.MeshStandardMaterial({
                color: this.config.color,
                metalness: 0.6,
                roughness: 0.4
            });

        const body =
            new THREE.Mesh(
                bodyGeometry,
                bodyMaterial
            );

        body.position.y = 0.6;

        body.castShadow = true;
        body.receiveShadow = true;

        this.mesh.add(body);

        // --------------------------------------------------------
        // CABIN
        // --------------------------------------------------------

        const cabinGeometry =
            new THREE.BoxGeometry(
                1.8,
                0.7,
                2.2
            );

        const cabinMaterial =
            new THREE.MeshStandardMaterial({
                color: 0x111111,
                metalness: 0.9,
                roughness: 0.1
            });

        const cabin =
            new THREE.Mesh(
                cabinGeometry,
                cabinMaterial
            );

        cabin.position.set(
            0,
            1.3,
            0.2
        );

        cabin.castShadow = true;
        cabin.receiveShadow = true;

        this.mesh.add(cabin);

        // --------------------------------------------------------
        // WHEELS
        // --------------------------------------------------------

        const wheelGeometry =
            new THREE.CylinderGeometry(
                0.38,
                0.38,
                0.3,
                12
            );

        const wheelMaterial =
            new THREE.MeshStandardMaterial({
                color: 0x111111
            });

        const wheelPositions = [
            [-1.05, 0.38, 1.4],
            [1.05, 0.38, 1.4],
            [-1.05, 0.38, -1.4],
            [1.05, 0.38, -1.4]
        ];

        for (const position of wheelPositions) {
            const wheel =
                new THREE.Mesh(
                    wheelGeometry,
                    wheelMaterial
                );

            wheel.rotation.z =
                Math.PI / 2;

            wheel.position.set(
                position[0],
                position[1],
                position[2]
            );

            wheel.castShadow = true;

            this.mesh.add(wheel);
        }
    }

    // ============================================================
    // COLLISION
    // ============================================================

    registerCollision() {
        if (this.collisionBox) {
            return;
        }

        if (
            !this.neighborhood ||
            typeof this.neighborhood.addCollisionBox !==
                'function'
        ) {
            return;
        }

        this.collisionBox =
            this.neighborhood.addCollisionBox(
                this.mesh.position.x,
                this.mesh.position.z,
                this.config.width,
                this.config.depth,
                this.mesh.rotation.y
            );
    }

    removeCollision() {
        if (!this.collisionBox) {
            return;
        }

        if (
            this.neighborhood &&
            typeof this.neighborhood.removeCollisionBox ===
                'function'
        ) {
            this.neighborhood.removeCollisionBox(
                this.collisionBox
            );
        }

        this.collisionBox = null;
    }

    // ------------------------------------------------------------
    // UPDATE COLLISION TRANSFORM
    // ------------------------------------------------------------

    updateCollision() {
        if (!this.collisionBox) {
            return;
        }

        this.collisionBox.x =
            this.mesh.position.x;

        this.collisionBox.z =
            this.mesh.position.z;

        this.collisionBox.rotation =
            this.mesh.rotation.y;
    }

    // ============================================================
    // VISIBILITY
    // ============================================================

    setVisible(visible) {
        if (this.isDisposed) {
            return;
        }

        this.mesh.visible = visible;

        /*
         * An invisible vehicle should not remain a physical
         * obstacle in the world.
         */
        if (visible) {
            this.registerCollision();
            this.updateCollision();
        } else {
            this.removeCollision();
        }
    }

    // ============================================================
    // POSITION
    // ============================================================

    setPosition(x, z, rotation = this.mesh.rotation.y) {
        if (this.isDisposed) {
            return;
        }

        this.mesh.position.set(
            x,
            0,
            z
        );

        this.mesh.rotation.y = rotation;

        this.updateCollision();
    }

    getPosition() {
        return this.mesh.position;
    }

    // ============================================================
    // DISPOSE
    // ============================================================

    dispose() {
        if (this.isDisposed) {
            return;
        }

        this.isDisposed = true;

        // --------------------------------------------------------
        // COLLISION
        // --------------------------------------------------------

        this.removeCollision();

        // --------------------------------------------------------
        // SCENE
        // --------------------------------------------------------

        if (
            this.scene &&
            this.mesh.parent === this.scene
        ) {
            this.scene.remove(this.mesh);
        }

        // --------------------------------------------------------
        // RESOURCE DISPOSAL
        // --------------------------------------------------------

        /*
         * Some resources are shared between multiple meshes
         * (especially the wheel geometry/material).
         *
         * Track them so each resource is disposed exactly once.
         */

        const geometries = new Set();
        const materials = new Set();

        this.mesh.traverse((object) => {
            if (!object.isMesh) {
                return;
            }

            if (object.geometry) {
                geometries.add(object.geometry);
            }

            if (object.material) {
                if (Array.isArray(object.material)) {
                    for (const material of object.material) {
                        if (material) {
                            materials.add(material);
                        }
                    }
                } else {
                    materials.add(object.material);
                }
            }
        });

        for (const geometry of geometries) {
            geometry.dispose();
        }

        for (const material of materials) {
            material.dispose();
        }

        // --------------------------------------------------------
        // CLEAR
        // --------------------------------------------------------

        this.mesh.clear();

        this.scene = null;
        this.neighborhood = null;
        this.collisionBox = null;
    }
            }
