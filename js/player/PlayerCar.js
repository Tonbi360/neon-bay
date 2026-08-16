class PlayerCar {
    constructor(sceneManager, controls, neighborhood) {
        this.sceneManager = sceneManager;
        this.controls = controls;
        this.neighborhood = neighborhood;

        this.mesh = null;

        // --------------------------------------------------------
        // DRIVING PHYSICS
        // --------------------------------------------------------

        this.speed = 0;

        // World units / second.
        this.maxSpeed = 14;
        this.acceleration = 18;
        this.brakeStrength = 30;
        this.friction = 7;

        // Radians / second.
        this.steerSpeed = 1.8;

        // Collision radius around the vehicle.
        this.collisionRadius = 1.2;

        this.createCar();

        // --------------------------------------------------------
        // CAMERA
        // --------------------------------------------------------

        this.cameraPosition = new THREE.Vector3();
        this.cameraLookTarget = new THREE.Vector3();

        this.cameraInitialized = false;

        this.cameraDistance = 8;
        this.cameraHeight = 3.5;
        this.cameraLookAhead = 3;
    }

    // ============================================================
    // CAR CREATION
    // ============================================================

    createCar() {
        const carGroup = new THREE.Group();

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
                color: 0xcc0000,
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

        carGroup.add(body);

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
                color: 0x1a1a1a,
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

        carGroup.add(cabin);

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

            carGroup.add(wheel);
        }

        this.mesh = carGroup;

        this.sceneManager.scene.add(
            this.mesh
        );
    }

    // ============================================================
    // UPDATE
    // ============================================================

    update(delta) {
        if (!this.mesh) {
            return;
        }

        // Prevent giant physics jumps after lag/tab switching.
        delta = Math.min(
            Math.max(delta || 0, 0),
            0.05
        );

        const input =
            this.controls.input;

        // --------------------------------------------------------
        // SPEED
        // --------------------------------------------------------

        if (input.acc) {
            this.speed +=
                this.acceleration * delta;
        } else if (input.brk) {
            /*
             * IMPORTANT:
             *
             * Brake never creates reverse movement.
             *
             * If moving forward:
             *     speed → 0
             *
             * It does NOT become negative.
             */
            this.speed = Math.max(
                0,
                this.speed -
                this.brakeStrength * delta
            );
        } else {
            // Natural rolling resistance.
            if (this.speed > 0) {
                this.speed = Math.max(
                    0,
                    this.speed -
                    this.friction * delta
                );
            }
        }

        this.speed = THREE.MathUtils.clamp(
            this.speed,
            0,
            this.maxSpeed
        );

        if (this.speed < 0.01) {
            this.speed = 0;
        }

        // --------------------------------------------------------
        // STEERING
        // --------------------------------------------------------

        if (this.speed > 0.05) {
            const steeringAmount =
                this.steerSpeed * delta;

            if (input.left) {
                this.mesh.rotation.y +=
                    steeringAmount;
            }

            if (input.right) {
                this.mesh.rotation.y -=
                    steeringAmount;
            }
        }

        // --------------------------------------------------------
        // MOVEMENT
        // --------------------------------------------------------

        if (this.speed > 0) {
            this.moveWithCollision(
                delta
            );
        }

        // Camera is updated here.
        // Game.js should NOT call it a second time.
        this.updateCamera();
    }

    // ============================================================
    // MOVEMENT + COLLISION
    // ============================================================

    moveWithCollision(delta) {
        const distance =
            this.speed * delta;

        if (distance <= 0) {
            return;
        }

        /*
         * Split large movements into smaller steps.
         *
         * This prevents the car from jumping through
         * thin collision boundaries when moving quickly.
         */
        const maxStep = 0.35;

        const steps =
            Math.max(
                1,
                Math.ceil(
                    distance / maxStep
                )
            );

        const stepDistance =
            distance / steps;

        for (let i = 0; i < steps; i++) {
            const rotation =
                this.mesh.rotation.y;

            const nextX =
                this.mesh.position.x -
                Math.sin(rotation) *
                stepDistance;

            const nextZ =
                this.mesh.position.z -
                Math.cos(rotation) *
                stepDistance;

            let collision = null;

            if (
                this.neighborhood &&
                typeof this.neighborhood.checkCollision ===
                    'function'
            ) {
                collision =
                    this.neighborhood.checkCollision(
                        nextX,
                        nextZ,
                        this.collisionRadius
                    );
            }

            if (
                collision &&
                collision.collided
            ) {
                /*
                 * Simple arcade collision response:
                 *
                 * Do not teleport the car.
                 * Do not push using mysterious collision
                 * coordinates.
                 *
                 * Just stop at the last valid position.
                 */
                this.speed = 0;

                return;
            }

            this.mesh.position.x =
                nextX;

            this.mesh.position.z =
                nextZ;
        }
    }

    // ============================================================
    // CAMERA
    // ============================================================

    updateCamera() {
        if (
            !this.mesh ||
            !this.sceneManager ||
            !this.sceneManager.camera
        ) {
            return;
        }

        const camera =
            this.sceneManager.camera;

        const rotation =
            this.mesh.rotation.y;

        /*
         * Vehicle forward direction:
         *
         * rotation 0
         *       ↑
         *       |
         *      CAR
         *
         * Camera sits behind the car.
         */

        const desiredX =
            this.mesh.position.x +
            Math.sin(rotation) *
            this.cameraDistance;

        const desiredZ =
            this.mesh.position.z +
            Math.cos(rotation) *
            this.cameraDistance;

        const desiredCamera =
            new THREE.Vector3(
                desiredX,
                this.mesh.position.y +
                    this.cameraHeight,
                desiredZ
            );

        /*
         * Look slightly ahead of the car so the player
         * can see where they're actually driving.
         */

        const lookAheadX =
            this.mesh.position.x -
            Math.sin(rotation) *
            this.cameraLookAhead;

        const lookAheadZ =
            this.mesh.position.z -
            Math.cos(rotation) *
            this.cameraLookAhead;

        const desiredLook =
            new THREE.Vector3(
                lookAheadX,
                this.mesh.position.y +
                    0.9,
                lookAheadZ
            );

        // First frame after entering a vehicle:
        // snap the camera into position.
        if (!this.cameraInitialized) {
            camera.position.copy(
                desiredCamera
            );

            camera.lookAt(
                desiredLook
            );

            this.cameraPosition.copy(
                desiredCamera
            );

            this.cameraLookTarget.copy(
                desiredLook
            );

            this.cameraInitialized = true;

            return;
        }

        // Smooth follow.
        this.cameraPosition.lerp(
            desiredCamera,
            0.12
        );

        this.cameraLookTarget.lerp(
            desiredLook,
            0.15
        );

        camera.position.copy(
            this.cameraPosition
        );

        camera.lookAt(
            this.cameraLookTarget
        );
    }

    // ============================================================
    // RESET CAMERA
    // ============================================================

    resetCamera() {
        this.cameraInitialized = false;
    }

    // ============================================================
    // POSITION
    // ============================================================

    getPosition() {
        if (this.mesh) {
            return this.mesh.position;
        }

        return new THREE.Vector3();
    }

    // ============================================================
    // CLEANUP
    // ============================================================

    dispose() {
        if (!this.mesh) {
            return;
        }

        this.sceneManager.scene.remove(
            this.mesh
        );

        this.mesh.traverse(
            (object) => {
                if (!object.isMesh) {
                    return;
                }

                if (object.geometry) {
                    object.geometry.dispose();
                }

                if (object.material) {
                    if (
                        Array.isArray(
                            object.material
                        )
                    ) {
                        object.material.forEach(
                            (material) => {
                                material.dispose();
                            }
                        );
                    } else {
                        object.material.dispose();
                    }
                }
            }
        );

        this.mesh.clear();
        this.mesh = null;
    }
}
