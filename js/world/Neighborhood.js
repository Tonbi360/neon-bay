class Neighborhood {
    constructor(scene) {
        this.scene = scene;

        this.materials = this.createMaterials();

        // World collision objects.
        this.collisionBoxes = [];

        // Keep references to generated world objects so they
        // can be removed cleanly during dispose().
        this.objects = [];

        this.isDisposed = false;

        this.build();
    }

    // ============================================================
    // MATERIALS
    // ============================================================

    createMaterials() {
        return {
            road: new THREE.MeshStandardMaterial({
                color: 0x2a2a2a,
                roughness: 0.9
            }),

            sidewalk: new THREE.MeshStandardMaterial({
                color: 0x999999,
                roughness: 0.8
            }),

            grass: new THREE.MeshStandardMaterial({
                color: 0x2d4c1e,
                roughness: 1.0
            }),

            concrete: new THREE.MeshStandardMaterial({
                color: 0x777777,
                roughness: 0.9
            }),

            buildingBase: new THREE.MeshStandardMaterial({
                color: 0x3a4a5a,
                roughness: 0.7
            }),

            buildingDark: new THREE.MeshStandardMaterial({
                color: 0x1a2a3a,
                roughness: 0.8
            }),

            window: new THREE.MeshStandardMaterial({
                color: 0x88ccff,
                emissive: 0x224466,
                emissiveIntensity: 0.5
            }),

            neonCyan: new THREE.MeshStandardMaterial({
                color: 0x00ffff,
                emissive: 0x00ffff,
                emissiveIntensity: 1.5
            }),

            neonMagenta: new THREE.MeshStandardMaterial({
                color: 0xff00ff,
                emissive: 0xff00ff,
                emissiveIntensity: 1.5
            }),

            neonYellow: new THREE.MeshStandardMaterial({
                color: 0xffff00,
                emissive: 0xffff00,
                emissiveIntensity: 1.2
            }),

            treeTrunk: new THREE.MeshStandardMaterial({
                color: 0x4a3020,
                roughness: 0.9
            }),

            treeLeaves: new THREE.MeshStandardMaterial({
                color: 0x1a5c1a,
                roughness: 0.8
            }),

            streetlightPole: new THREE.MeshStandardMaterial({
                color: 0x222222,
                metalness: 0.8,
                roughness: 0.2
            }),

            streetlightGlow: new THREE.MeshStandardMaterial({
                color: 0xffffaa,
                emissive: 0xffffaa,
                emissiveIntensity: 1.0
            }),

            roadLine: new THREE.MeshStandardMaterial({
                color: 0xffff00
            }),

            crosswalk: new THREE.MeshStandardMaterial({
                color: 0xeeeeee
            }),

            hydrant: new THREE.MeshStandardMaterial({
                color: 0xff0000
            })
        };
    }

    // ============================================================
    // BUILD WORLD
    // ============================================================

    build() {
        if (this.isDisposed) {
            return;
        }

        this.createGround();
        this.createRoads();
        this.createSidewalks();

        // --------------------------------------------------------
        // BUILDINGS
        // --------------------------------------------------------

        this.createNeonDiner(18, 18);
        this.createCornerStore(-18, 18);
        this.createGasStation(18, -25);
        this.createApartments(-20, -20);

        // --------------------------------------------------------
        // STREET PROPS
        // --------------------------------------------------------

        this.createStreetlight(8, 8);
        this.createStreetlight(-8, 8);
        this.createStreetlight(8, -8);
        this.createStreetlight(-8, -8);

        this.createTree(12, 30);
        this.createTree(-12, 30);
        this.createTree(12, -30);
        this.createTree(-12, -30);
        this.createTree(25, 5);

        this.createFireHydrant(7, 15);
        this.createFireHydrant(-7, -15);
    }

    // ============================================================
    // OBJECT REGISTRATION
    // ============================================================

    addObject(object) {
        if (!object) {
            return object;
        }

        this.objects.push(object);
        this.scene.add(object);

        return object;
    }

    // ============================================================
    // COLLISION
    // ============================================================

    addCollisionBox(
        x,
        z,
        width,
        depth,
        rotation = 0
    ) {
        const box = {
            x,
            z,
            width,
            depth,
            rotation
        };

        this.collisionBoxes.push(box);

        return box;
    }

    removeCollisionBox(box) {
        if (!box) {
            return;
        }

        const index =
            this.collisionBoxes.indexOf(box);

        if (index !== -1) {
            this.collisionBoxes.splice(
                index,
                1
            );
        }
    }

    checkCollision(
        x,
        z,
        radius = 1.5
    ) {
        if (this.isDisposed) {
            return {
                collided: false
            };
        }

        for (const box of this.collisionBoxes) {
            const dx =
                x - box.x;

            const dz =
                z - box.z;

            // Convert world position into the
            // collision box's local coordinate space.
            const cos =
                Math.cos(-box.rotation);

            const sin =
                Math.sin(-box.rotation);

            const localX =
                dx * cos -
                dz * sin;

            const localZ =
                dx * sin +
                dz * cos;

            const halfWidth =
                box.width / 2 +
                radius;

            const halfDepth =
                box.depth / 2 +
                radius;

            if (
                Math.abs(localX) < halfWidth &&
                Math.abs(localZ) < halfDepth
            ) {
                return {
                    collided: true,
                    box,
                    localX,
                    localZ
                };
            }
        }

        return {
            collided: false
        };
    }

    // ============================================================
    // GROUND
    // ============================================================

    createGround() {
        const ground =
            new THREE.Mesh(
                new THREE.PlaneGeometry(
                    500,
                    500
                ),
                this.materials.grass
            );

        ground.rotation.x =
            -Math.PI / 2;

        ground.receiveShadow = true;

        this.addObject(ground);

        const lot =
            new THREE.Mesh(
                new THREE.PlaneGeometry(
                    120,
                    120
                ),
                this.materials.concrete
            );

        lot.rotation.x =
            -Math.PI / 2;

        lot.position.y =
            0.005;

        lot.receiveShadow = true;

        this.addObject(lot);
    }

    // ============================================================
    // ROADS
    // ============================================================

    createRoads() {
        const mainRoad =
            new THREE.Mesh(
                new THREE.PlaneGeometry(
                    12,
                    400
                ),
                this.materials.road
            );

        mainRoad.rotation.x =
            -Math.PI / 2;

        mainRoad.position.y =
            0.01;

        mainRoad.receiveShadow = true;

        this.addObject(mainRoad);

        const crossRoad =
            new THREE.Mesh(
                new THREE.PlaneGeometry(
                    400,
                    12
                ),
                this.materials.road
            );

        crossRoad.rotation.x =
            -Math.PI / 2;

        crossRoad.position.y =
            0.01;

        crossRoad.receiveShadow = true;

        this.addObject(crossRoad);

        // --------------------------------------------------------
        // ROAD LINES
        // --------------------------------------------------------

        for (
            let i = -190;
            i < 200;
            i += 15
        ) {
            if (Math.abs(i) < 8) {
                continue;
            }

            const line =
                new THREE.Mesh(
                    new THREE.PlaneGeometry(
                        0.3,
                        8
                    ),
                    this.materials.roadLine
                );

            line.rotation.x =
                -Math.PI / 2;

            line.position.set(
                0,
                0.02,
                i
            );

            this.addObject(line);

            const lineX =
                new THREE.Mesh(
                    new THREE.PlaneGeometry(
                        8,
                        0.3
                    ),
                    this.materials.roadLine
                );

            lineX.rotation.x =
                -Math.PI / 2;

            lineX.position.set(
                i,
                0.02,
                0
            );

            this.addObject(lineX);
        }

        // --------------------------------------------------------
        // CROSSWALKS
        // --------------------------------------------------------

        for (
            let i = -5;
            i <= 5;
            i += 2
        ) {
            const cw1 =
                new THREE.Mesh(
                    new THREE.PlaneGeometry(
                        1,
                        12
                    ),
                    this.materials.crosswalk
                );

            cw1.rotation.x =
                -Math.PI / 2;

            cw1.position.set(
                i,
                0.02,
                8
            );

            this.addObject(cw1);

            const cw2 =
                new THREE.Mesh(
                    new THREE.PlaneGeometry(
                        1,
                        12
                    ),
                    this.materials.crosswalk
                );

            cw2.rotation.x =
                -Math.PI / 2;

            cw2.position.set(
                i,
                0.02,
                -8
            );

            this.addObject(cw2);
        }
    }

    // ============================================================
    // SIDEWALKS
    // ============================================================

    createSidewalks() {
        const swGeo =
            new THREE.BoxGeometry(
                3,
                0.2,
                400
            );

        const swGeoX =
            new THREE.BoxGeometry(
                400,
                0.2,
                3
            );

        const positions = [
            {
                pos: [7.5, 0.1, 0],
                geo: swGeo
            },
            {
                pos: [-7.5, 0.1, 0],
                geo: swGeo
            },
            {
                pos: [0, 0.1, 7.5],
                geo: swGeoX
            },
            {
                pos: [0, 0.1, -7.5],
                geo: swGeoX
            }
        ];

        for (const item of positions) {
            const sidewalk =
                new THREE.Mesh(
                    item.geo,
                    this.materials.sidewalk
                );

            sidewalk.position.set(
                ...item.pos
            );

            sidewalk.receiveShadow = true;
            sidewalk.castShadow = true;

            this.addObject(sidewalk);
        }
    }

    // ============================================================
    // NEON DINER
    // ============================================================

    createNeonDiner(x, z) {
        const group =
            new THREE.Group();

        const base =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    10,
                    4,
                    12
                ),
                this.materials.buildingBase
            );

        base.position.y = 2;
        base.castShadow = true;

        group.add(base);

        const trim =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    10.2,
                    0.5,
                    12.2
                ),
                this.materials.neonCyan
            );

        trim.position.y = 4.25;

        group.add(trim);

        const windowGeo =
            new THREE.BoxGeometry(
                8,
                2,
                0.2
            );

        const win =
            new THREE.Mesh(
                windowGeo,
                this.materials.window
            );

        win.position.set(
            0,
            2.5,
            6.1
        );

        group.add(win);

        const sign =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    6,
                    1.5,
                    0.5
                ),
                this.materials.neonMagenta
            );

        sign.position.set(
            0,
            5,
            6
        );

        group.add(sign);

        group.position.set(
            x,
            0,
            z
        );

        const rotation =
            -Math.PI / 4;

        group.rotation.y =
            rotation;

        this.addObject(group);

        this.addCollisionBox(
            x,
            z,
            10,
            12,
            rotation
        );
    }

    // ============================================================
    // CORNER STORE
    // ============================================================

    createCornerStore(x, z) {
        const group =
            new THREE.Group();

        const base =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    8,
                    3,
                    8
                ),
                this.materials.buildingDark
            );

        base.position.y = 1.5;
        base.castShadow = true;

        group.add(base);

        const awning =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    9,
                    0.2,
                    3
                ),
                this.materials.neonYellow
            );

        awning.position.set(
            0,
            3,
            5.5
        );

        group.add(awning);

        group.position.set(
            x,
            0,
            z
        );

        const rotation =
            Math.PI / 4;

        group.rotation.y =
            rotation;

        this.addObject(group);

        this.addCollisionBox(
            x,
            z,
            8,
            8,
            rotation
        );
    }

    // ============================================================
    // GAS STATION
    // ============================================================

    createGasStation(x, z) {
        const group =
            new THREE.Group();

        const canopy =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    12,
                    0.3,
                    10
                ),
                this.materials.concrete
            );

        canopy.position.y = 4;
        canopy.castShadow = true;

        group.add(canopy);

        // --------------------------------------------------------
        // PILLARS
        // --------------------------------------------------------

        const pillarGeo =
            new THREE.CylinderGeometry(
                0.3,
                0.3,
                4
            );

        const pillarPositions = [
            [-5, 2, -4],
            [5, 2, -4],
            [-5, 2, 4],
            [5, 2, 4]
        ];

        for (const position of pillarPositions) {
            const pillar =
                new THREE.Mesh(
                    pillarGeo,
                    this.materials.streetlightPole
                );

            pillar.position.set(
                ...position
            );

            group.add(pillar);
        }

        // --------------------------------------------------------
        // PUMP
        // --------------------------------------------------------

        const pump =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    1,
                    1.5,
                    1
                ),
                this.materials.neonCyan
            );

        pump.position.set(
            0,
            0.75,
            0
        );

        group.add(pump);

        group.position.set(
            x,
            0,
            z
        );

        this.addObject(group);

        this.addCollisionBox(
            x,
            z,
            12,
            10,
            0
        );
    }

    // ============================================================
    // APARTMENTS
    // ============================================================

    createApartments(x, z) {
        const group =
            new THREE.Group();

        const base =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    12,
                    8,
                    10
                ),
                this.materials.buildingBase
            );

        base.position.y = 4;
        base.castShadow = true;

        group.add(base);

        const winGeo =
            new THREE.BoxGeometry(
                1.5,
                1.5,
                0.2
            );

        for (
            let row = 0;
            row < 3;
            row++
        ) {
            for (
                let col = 0;
                col < 4;
                col++
            ) {
                const win =
                    new THREE.Mesh(
                        winGeo,
                        this.materials.window
                    );

                win.position.set(
                    -4 + col * 2.5,
                    2 + row * 2.5,
                    5.1
                );

                group.add(win);
            }
        }

        group.position.set(
            x,
            0,
            z
        );

        this.addObject(group);

        this.addCollisionBox(
            x,
            z,
            12,
            10,
            0
        );
    }

    // ============================================================
    // STREETLIGHT
    // ============================================================

    createStreetlight(x, z) {
        const group =
            new THREE.Group();

        const pole =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    0.1,
                    0.1,
                    6
                ),
                this.materials.streetlightPole
            );

        pole.position.y = 3;

        group.add(pole);

        const arm =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    2,
                    0.1,
                    0.1
                ),
                this.materials.streetlightPole
            );

        arm.position.set(
            1,
            6,
            0
        );

        group.add(arm);

        const bulb =
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    0.3
                ),
                this.materials.streetlightGlow
            );

        bulb.position.set(
            2,
            5.9,
            0
        );

        group.add(bulb);

        group.position.set(
            x,
            0,
            z
        );

        this.addObject(group);
    }

    // ============================================================
    // TREE
    // ============================================================

    createTree(x, z) {
        const group =
            new THREE.Group();

        const trunk =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    0.2,
                    0.3,
                    2
                ),
                this.materials.treeTrunk
            );

        trunk.position.y = 1;
        trunk.castShadow = true;

        group.add(trunk);

        const leaves =
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    1.4,
                    8,
                    8
                ),
                this.materials.treeLeaves
            );

        leaves.position.y = 2.8;
        leaves.castShadow = true;

        group.add(leaves);

        group.position.set(
            x,
            0,
            z
        );

        this.addObject(group);

        this.addCollisionBox(
            x,
            z,
            0.8,
            0.8,
            0
        );
    }

    // ============================================================
    // FIRE HYDRANT
    // ============================================================

    createFireHydrant(x, z) {
        const group =
            new THREE.Group();

        const body =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    0.15,
                    0.2,
                    0.6
                ),
                this.materials.hydrant
            );

        body.position.y = 0.3;
        body.castShadow = true;

        group.add(body);

        const cap =
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    0.18,
                    8,
                    8
                ),
                this.materials.hydrant
            );

        cap.position.y = 0.65;
        cap.castShadow = true;

        group.add(cap);

        group.position.set(
            x,
            0,
            z
        );

        this.addObject(group);

        this.addCollisionBox(
            x,
            z,
            0.5,
            0.5,
            0
        );
    }

    // ============================================================
    // CLEANUP
    // ============================================================

    dispose() {
        if (this.isDisposed) {
            return;
        }

        this.isDisposed = true;

        console.log('[Neighborhood] Disposing');

        // --------------------------------------------------------
        // REMOVE + DISPOSE OBJECTS
        // --------------------------------------------------------

        for (const object of this.objects) {
            if (!object) {
                continue;
            }

            if (this.scene) {
                this.scene.remove(object);
            }

            object.traverse((child) => {
                if (!child.isMesh) {
                    return;
                }

                if (child.geometry) {
                    child.geometry.dispose();
                }
            });
        }

        this.objects = [];

        // --------------------------------------------------------
        // DISPOSE SHARED MATERIALS
        // --------------------------------------------------------

        if (this.materials) {
            for (const key of Object.keys(this.materials)) {
                const material = this.materials[key];

                if (material && typeof material.dispose === 'function') {
                    material.dispose();
                }
            }
        }

        this.materials = null;

        // --------------------------------------------------------
        // CLEAR COLLISION DATA
        // --------------------------------------------------------

        this.collisionBoxes = [];
        this.scene = null;
    }
}
