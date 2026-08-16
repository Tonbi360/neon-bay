class PlayerCharacter {
    constructor(scene, neighborhood) {
        this.scene = scene;
        this.neighborhood = neighborhood;

        // --------------------------------------------------------
        // CHARACTER ROOT
        // --------------------------------------------------------

        this.mesh = new THREE.Group();

        // The root represents the character's feet/world position.
        this.mesh.position.set(0, 0, 0);

        // --------------------------------------------------------
        // PLACEHOLDER BODY
        // --------------------------------------------------------

        const bodyGeometry =
            new THREE.CylinderGeometry(
                0.4,
                0.4,
                1.8,
                8
            );

        const bodyMaterial =
            new THREE.MeshStandardMaterial({
                color: 0x00ff00
            });

        const body =
            new THREE.Mesh(
                bodyGeometry,
                bodyMaterial
            );

        body.position.y = 0.9;
        body.castShadow = true;

        this.mesh.add(body);

        // --------------------------------------------------------
        // HEAD
        // --------------------------------------------------------

        const headGeometry =
            new THREE.SphereGeometry(
                0.35,
                8,
                8
            );

        const head =
            new THREE.Mesh(
                headGeometry,
                bodyMaterial
            );

        head.position.y = 1.9;
        head.castShadow = true;

        this.mesh.add(head);

        this.scene.add(this.mesh);

        // Hidden while driving.
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

        // Camera
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

        // Protect against invalid time values.
        delta = Math.min(
            Math.max(delta || 0, 0),
            0.05
        );

        // --------------------------------------------------------
        // FORWARD / BACKWARD
        // --------------------------------------------------------

        if (input.acc) {
            this.speed +=
                this.acceleration * delta;
        } else if (input.brk) {
            this.speed -=
                this.deceleration * delta;
        } else {
            // Natural slowing.
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
        // MOVEMENT
        // --------------------------------------------------------

        const movement =
            this.speed * delta;

        const nextX =
            this.mesh.position.x -
            Math.sin(this.mesh.rotation.y) *
            movement;

        const nextZ =
            this.mesh.position.z -
            Math.cos(this.mesh.rotation.y) *
            movement;

        // --------------------------------------------------------
        // COLLISION
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
                this.speed = 0;
                return;
            }
        }

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

        // Make sure world transforms are current.
        this.mesh.updateMatrixWorld(true);

        const rotation =
            this.mesh.rotation.y;

        // Camera follows behind the character.
        const distance = 6;
        const height = 3;

        const targetX =
            this.mesh.position.x +
            Math.sin(rotation) *
            distance;

        const targetZ =
            this.mesh.position.z +
            Math.cos(rotation) *
            distance;

        const desiredCamera =
            new THREE.Vector3(
                targetX,
                this.mesh.position.y + height,
                targetZ
            );

        const desiredLook =
            new THREE.Vector3(
                this.mesh.position.x,
                this.mesh.position.y + 1.2,
                this.mesh.position.z
            );

        // First frame: avoid the camera slowly travelling from
        // wherever the vehicle camera happened to be.
        if (!this.cameraInitialized) {
            camera.position.copy(
                desiredCamera
            );

            camera.lookAt(desiredLook);

            this.cameraPosition.copy(
                desiredCamera
            );

            this.cameraLookTarget.copy(
                desiredLook
            );

            this.cameraInitialized = true;

            return;
        }

        // Smooth camera movement.
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
        /*
         * Put the character beside the vehicle.
         *
         * Vehicle forward direction:
         *
         *          ↑
         *          |
         *        CAR
         *
         * We place the character slightly to the
         * driver's side and slightly toward the rear.
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
        this.mesh.visible = visible;

        if (visible) {
            this.cameraInitialized = false;
        }
    }

    // ------------------------------------------------------------
    // CLEANUP
    // ------------------------------------------------------------

    dispose() {
        this.scene.remove(this.mesh);

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
                        (material) => material.dispose()
                    );
                } else {
                    object.material.dispose();
                }
            }
        });

        this.mesh.clear();
    }
    }
