class PlayerCharacter {
    constructor(scene, neighborhood) {
        this.scene = scene;
        this.neighborhood = neighborhood;

        // --------------------------------------------------------
        // CHARACTER ROOT
        // --------------------------------------------------------

        this.mesh = new THREE.Group();

        // Root represents the character's feet/world position.
        this.mesh.position.set(0, 0, 0);

        // --------------------------------------------------------
        // PLACEHOLDER BODY
        // --------------------------------------------------------

        const bodyGeometry = new THREE.CylinderGeometry(
            0.4,
            0.4,
            1.8,
            8
        );

        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ff00
        });

        const body = new THREE.Mesh(
            bodyGeometry,
            bodyMaterial
        );

        body.position.y = 0.9;
        body.castShadow = true;
        body.receiveShadow = true;

        this.mesh.add(body);

        // --------------------------------------------------------
        // HEAD
        // --------------------------------------------------------

        const headGeometry = new THREE.SphereGeometry(
            0.35,
            8,
            8
        );

        const head = new THREE.Mesh(
            headGeometry,
            bodyMaterial
        );

        head.position.y = 1.9;
        head.castShadow = true;
        head.receiveShadow = true;

        this.mesh.add(head);

        // Add character to world.
        this.scene.add(this.mesh);

        // Character starts inside the vehicle.
        this.mesh.visible = false;

        // --------------------------------------------------------
        // MOVEMENT
        // --------------------------------------------------------

        this.speed = 0;

        this.maxSpeed = 3.0;
        this.acceleration = 10.0;
        this.deceleration = 14.0;
        this.turnSpeed = 2.8;

        this.collisionRadius = 0.5;

        // --------------------------------------------------------
        // CAMERA
        // --------------------------------------------------------

        this.cameraPosition = new THREE.Vector3();
        this.cameraLookTarget = new THREE.Vector3();

        this.cameraInitialized = false;
    }

    // ------------------------------------------------------------
    // UPDATE
    // ------------------------------------------------------------

    update(input, delta) {
        if (!this.mesh.visible) {
            return;
        }

        // Protect against invalid or unusually large frame times.
        delta = Math.min(
            Math.max(Number(delta) || 0, 0),
            0.05
        );

        // Make sure input always has the expected shape.
        input = input || {};

        // --------------------------------------------------------
        // MOVEMENT INPUT
        // --------------------------------------------------------

        if (input.acc) {
            this.speed += this.acceleration * delta;
        } else if (input.brk) {
            // In on-foot mode, BRK acts as backward movement.
            this.speed -= this.deceleration * delta;
        } else {
            this.applyFriction(delta);
        }

        this.speed = THREE.MathUtils.clamp(
            this.speed,
            -this.maxSpeed,
            this.maxSpeed
        );

        if (Math.abs(this.speed) < 0.01) {
            this.speed = 0;
        }

        // --------------------------------------------------------
        // TURNING
        // --------------------------------------------------------

        if (Math.abs(this.speed) > 0.01) {
            const direction =
                this.speed >= 0 ? 1 : -1;

            if (input.left) {
                this.mesh.rotation.y +=
                    this.turnSpeed *
                    delta *
                    direction;
            }

            if (input.right) {
                this.mesh.rotation.y -=
                    this.turnSpeed *
                    delta *
                    direction;
            }
        }

        // --------------------------------------------------------
        // MOVEMENT VECTOR
        // --------------------------------------------------------

        const movement = this.speed * delta;

        /*
         * Neon Bay uses -Z as the character/vehicle forward
         * direction.
         */

        const nextX =
            this.mesh.position.x -
            Math.sin(this.mesh.rotation.y) *
            movement;

        const nextZ =
            this.mesh.position.z -
            Math.cos(this.mesh.rotation.y) *
            movement;

        // --------------------------------------------------------
        // WORLD COLLISION
        // --------------------------------------------------------

        if (
            this.neighborhood &&
            typeof this.neighborhood.checkCollision ===
                'function'
        ) {
            const collision =
                this.neighborhood.checkCollision(
                    nextX,
                    nextZ,
                    this.collisionRadius
                );

            if (collision && collision.collided) {
                // Stop immediately when hitting an obstacle.
                this.speed = 0;
                return;
            }
        }

        // --------------------------------------------------------
        // APPLY POSITION
        // --------------------------------------------------------

        this.mesh.position.x = nextX;
        this.mesh.position.z = nextZ;
    }

    // ------------------------------------------------------------
    // FRICTION
    // ------------------------------------------------------------

    applyFriction(delta) {
        const amount =
            this.deceleration * delta;

        if (this.speed > 0) {
            this.speed = Math.max(
                0,
                this.speed - amount
            );
        } else if (this.speed < 0) {
            this.speed = Math.min(
                0,
                this.speed + amount
            );
        }
    }

    // ------------------------------------------------------------
    // CAMERA
    // ------------------------------------------------------------

    updateCamera(camera) {
        if (
            !this.mesh.visible ||
            !camera
        ) {
            return;
        }

        this.mesh.updateMatrixWorld(true);

        const rotation =
            this.mesh.rotation.y;

        // Camera follows behind the character.
        const distance = 6;
        const height = 3;

        const desiredCamera =
            new THREE.Vector3(
                this.mesh.position.x +
                    Math.sin(rotation) * distance,

                this.mesh.position.y +
                    height,

                this.mesh.position.z +
                    Math.cos(rotation) * distance
            );

        const desiredLook =
            new THREE.Vector3(
                this.mesh.position.x,
                this.mesh.position.y + 1.2,
                this.mesh.position.z
            );

        // --------------------------------------------------------
        // FIRST CAMERA FRAME
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
        // SMOOTH CAMERA
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

    // ------------------------------------------------------------
    // VEHICLE EXIT POSITION
    // ------------------------------------------------------------

    setPositionFromVehicle(
        vehiclePosition,
        vehicleRotation
    ) {
        if (!vehiclePosition) {
            return;
        }

        /*
         * Vehicle forward direction:
         *
         *              -Z
         *               ↑
         *             [CAR]
         *
         * Place the character beside the vehicle and
         * slightly toward its rear.
         */

        const sideDistance = 1.8;
        const rearDistance = 0.7;

        const forwardX =
            -Math.sin(vehicleRotation);

        const forwardZ =
            -Math.cos(vehicleRotation);

        const sideX =
            Math.cos(vehicleRotation);

        const sideZ =
            -Math.sin(vehicleRotation);

        const x =
            vehiclePosition.x +
            sideX * sideDistance -
            forwardX * rearDistance;

        const z =
            vehiclePosition.z +
            sideZ * sideDistance -
            forwardZ * rearDistance;

        this.mesh.position.set(
            x,
            0,
            z
        );

        this.mesh.rotation.y =
            vehicleRotation;

        this.speed = 0;

        // Force the next camera update to snap into
        // the correct character position.
        this.cameraInitialized = false;
    }

    // ------------------------------------------------------------
    // POSITION
    // ------------------------------------------------------------

    getPosition() {
        return this.mesh.position;
    }

    // ------------------------------------------------------------
    // VISIBILITY
    // ------------------------------------------------------------

    setVisible(visible) {
        this.mesh.visible = Boolean(visible);

        if (this.mesh.visible) {
            this.cameraInitialized = false;
        } else {
            this.speed = 0;
        }
    }

    // ------------------------------------------------------------
    // CLEANUP
    // ------------------------------------------------------------

    dispose() {
        console.log('[PlayerCharacter] Disposing');

        this.speed = 0;

        if (this.scene && this.mesh) {
            this.scene.remove(this.mesh);
        }

        this.mesh.traverse((object) => {
            if (!object.isMesh) {
                return;
            }

            if (object.geometry) {
                object.geometry.dispose();
            }

            if (object.material) {
                if (Array.isArray(object.material)) {
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
        });

        this.mesh.clear();

        this.cameraPosition.set(0, 0, 0);
        this.cameraLookTarget.set(0, 0, 0);
        this.cameraInitialized = false;
    }
}
