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

        // Reverse is slower than driving forward.
        this.maxReverseSpeed = 6;
        this.reverseAcceleration = 10;

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

        const bodyGeometry = new THREE.BoxGeometry(
            2,
            0.8,
            4.2
        );

        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0xcc0000,
            metalness: 0.6,
            roughness: 0.4
        });

        const body = new THREE.Mesh(
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

        const cabinGeometry = new THREE.BoxGeometry(
            1.8,
            0.7,
            2.2
        );

        const cabinMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.9,
            roughness: 0.1
        });

        const cabin = new THREE.Mesh(
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

        const wheelGeometry = new THREE.CylinderGeometry(
            0.38,
            0.38,
            0.3,
            12
        );

        const wheelMaterial = new THREE.MeshStandardMaterial({
            color: 0x111111
        });

        const wheelPositions = [
            [-1.05, 0.38, 1.4],
            [1.05, 0.38, 1.4],
            [-1.05, 0.38, -1.4],
            [1.05, 0.38, -1.4]
        ];

        for (const position of wheelPositions) {
            const wheel = new THREE.Mesh(
                wheelGeometry,
                wheelMaterial
            );

            wheel.rotation.z = Math.PI / 2;

            wheel.position.set(
                position[0],
                position[1],
                position[2]
            );

            wheel.castShadow = true;
            wheel.receiveShadow = true;

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
            Math.max(Number(delta) || 0, 0),
            0.05
        );

        const input =
            this.controls && this.controls.input
                ? this.controls.input
                : {
                    left: false,
                    right: false,
                    acc: false,
                    brk: false
                };

        // --------------------------------------------------------
        // SPEED
        // --------------------------------------------------------

        if (input.acc) {
            this.speed +=
                this.acceleration * delta;
        } else if (input.brk) {
            /*
             * BRK first brings the car to a stop like a real
             * brake pedal. Once fully stopped, continuing to
             * hold BRK shifts into reverse.
             */

            if (this.speed > 0) {
                this.speed = Math.max(
                    0,
                    this.speed -
                    this.brakeStrength * delta
                );
            } else {
                this.speed -=
                    this.reverseAcceleration * delta;
            }
        } else {
            // Natural rolling resistance toward zero,
            // from either direction.
            if (this.speed > 0) {
                this.speed = Math.max(
                    0,
                    this.speed -
                    this.friction * delta
                );
            } else if (this.speed < 0) {
                this.speed = Math.min(
                    0,
                    this.speed +
                    this.friction * delta
                );
            }
        }

        this.speed = THREE.MathUtils.clamp(
            this.speed,
            -this.maxReverseSpeed,
            this.maxSpeed
        );

        if (Math.abs(this.speed) < 0.01) {
            this.speed = 0;
        }

        // --------------------------------------------------------
        // STEERING
        // --------------------------------------------------------

        if (Math.abs(this.speed) > 0.05) {
            const steeringAmount =
                this.steerSpeed * delta;

            // Steering direction mirrors when reversing,
            // matching how a real car handles in reverse.
            const direction =
                this.speed >= 0 ? 1 : -1;

            if (input.left) {
                this.mesh.rotation.y +=
                    steeringAmount * direction;
            }

            if (input.right) {
                this.mesh.rotation.y -=
                    steeringAmount * direction;
            }
        }

        // --------------------------------------------------------
        // MOVEMENT
        // --------------------------------------------------------

        if (this.speed !== 0) {
            this.moveWithCollision(delta);
        }

        // Camera is normally updated here.
        //
        // Game.js also currently calls updateCamera() after
        // update(). Calling it twice is harmless because the
        // second call simply continues the same smooth follow.
        this.updateCamera();
    }

    // ============================================================
    // MOVEMENT + COLLISION
    // ============================================================

    moveWithCollision(delta) {
        if (
            !this.mesh ||
            this.speed === 0
        ) {
            return;
        }

        const distance =
            this.speed * delta;

        if (distance === 0) {
            return;
        }

        /*
         * Break fast movement into smaller steps.
         *
         * Without this, a fast vehicle could potentially move
         * from one side of a thin collision boundary to the other
         * between frames.
         *
         * distance can be negative when reversing, so step off
         * its magnitude but keep stepDistance signed.
         */

        const maxStep = 0.35;

        const steps = Math.max(
            1,
            Math.ceil(
                Math.abs(distance) / maxStep
            )
        );

        const stepDistance =
            distance / steps;

        for (let i = 0; i < steps; i++) {
            const rotation =
                this.mesh.rotation.y;

            /*
             * -Z is the vehicle's forward direction.
             */

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
                 * Arcade collision response:
                 *
                 * Keep the vehicle at its last valid
                 * position and stop its movement.
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
         * Vehicle forward:
         *
         * rotation = 0
         *
         *       -Z
         *        ↑
         *       CAR
         *
         * Therefore the camera sits on the +Z side,
         * behind the vehicle.
         */

        const desiredCamera =
            new THREE.Vector3(
                this.mesh.position.x +
                    Math.sin(rotation) *
                    this.cameraDistance,

                this.mesh.position.y +
                    this.cameraHeight,

                this.mesh.position.z +
                    Math.cos(rotation) *
                    this.cameraDistance
            );

        /*
         * Look slightly ahead of the vehicle so the player
         * has more visibility in the direction of travel.
         */

        const desiredLook =
            new THREE.Vector3(
                this.mesh.position.x -
                    Math.sin(rotation) *
                    this.cameraLookAhead,

                this.mesh.position.y +
                    0.9,

                this.mesh.position.z -
                    Math.cos(rotation) *
                    this.cameraLookAhead
            );

        // --------------------------------------------------------
        // FIRST FRAME
        // --------------------------------------------------------

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

        // --------------------------------------------------------
        // SMOOTH FOLLOW
        // --------------------------------------------------------

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
        console.log('[PlayerCar] Disposing');

        this.speed = 0;

        if (
            this.mesh &&
            this.sceneManager &&
            this.sceneManager.scene
        ) {
            this.sceneManager.scene.remove(
                this.mesh
            );
        }

        if (this.mesh) {
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
                                    if (material) {
                                        material.dispose();
                                    }
                                }
                            );
                        } else {
                            object.material.dispose();
                        }
                    }
                }
            );

            this.mesh.clear();
        }

        this.mesh = null;

        this.cameraPosition.set(
            0,
            0,
            0
        );

        this.cameraLookTarget.set(
            0,
            0,
            0
        );

        this.cameraInitialized = false;
    }
            }
            
