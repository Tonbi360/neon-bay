class Neighborhood {
    constructor(scene) {
        this.scene = scene;
        this.materials = this.createMaterials();
        this.collisionBoxes = [];
        this.build();
    }

    createMaterials() {
        return {
            road: new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9 }),
            sidewalk: new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.8 }),
            grass: new THREE.MeshStandardMaterial({ color: 0x2d4c1e, roughness: 1.0 }),
            concrete: new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.9 }),
            buildingBase: new THREE.MeshStandardMaterial({ color: 0x3a4a5a, roughness: 0.7 }),
            buildingDark: new THREE.MeshStandardMaterial({ color: 0x1a2a3a, roughness: 0.8 }),
            window: new THREE.MeshStandardMaterial({ color: 0x88ccff, emissive: 0x224466, emissiveIntensity: 0.5 }),
            neonCyan: new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 1.5 }),
            neonMagenta: new THREE.MeshStandardMaterial({ color: 0xff00ff, emissive: 0xff00ff, emissiveIntensity: 1.5 }),
            neonYellow: new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 1.2 }),
            treeTrunk: new THREE.MeshStandardMaterial({ color: 0x4a3020, roughness: 0.9 }),
            treeLeaves: new THREE.MeshStandardMaterial({ color: 0x1a5c1a, roughness: 0.8 }),
            streetlightPole: new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.2 }),
            streetlightGlow: new THREE.MeshStandardMaterial({ color: 0xffffaa, emissive: 0xffffaa, emissiveIntensity: 1.0 })
        };
    }

    build() {
        this.createGround();
        this.createRoads();
        this.createSidewalks();
        
        // Buildings with collision
        this.createNeonDiner(18, 18);
        this.createCornerStore(-18, 18);
        this.createGasStation(18, -25);
        this.createApartments(-20, -20);
        
        // Props (non-collidable for now)
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

    // Helper to add collision box
    addCollisionBox(x, z, width, depth, rotation = 0) {
        const box = {
            x: x,
            z: z,
            width: width,
            depth: depth,
            rotation: rotation
        };
        this.collisionBoxes.push(box);
        return box; // Return the box so it can be removed later
    }

    // Remove a specific collision box
    removeCollisionBox(box) {
        const index = this.collisionBoxes.indexOf(box);
        if (index > -1) {
            this.collisionBoxes.splice(index, 1);
        }
    }

    // Check if point is inside any collision box
    checkCollision(x, z, radius = 1.5) {
        for (let box of this.collisionBoxes) {
            // Transform car position into box's local space
            const dx = x - box.x;
            const dz = z - box.z;
            
            // Rotate point to align with box
            const cos = Math.cos(-box.rotation);
            const sin = Math.sin(-box.rotation);
            const localX = dx * cos - dz * sin;
            const localZ = dx * sin + dz * cos;
            
            // Check AABB collision
            const halfWidth = box.width / 2 + radius;
            const halfDepth = box.depth / 2 + radius;
            
            if (Math.abs(localX) < halfWidth && Math.abs(localZ) < halfDepth) {
                return {
                    collided: true,
                    box: box,
                    localX: localX,
                    localZ: localZ
                };
            }        }
        return { collided: false };
    }

    createGround() {
        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(500, 500),
            this.materials.grass
        );
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        const lot = new THREE.Mesh(
            new THREE.PlaneGeometry(120, 120),
            this.materials.concrete
        );
        lot.rotation.x = -Math.PI / 2;
        lot.position.y = 0.005;
        lot.receiveShadow = true;
        this.scene.add(lot);
    }

    createRoads() {
        const mainRoad = new THREE.Mesh(
            new THREE.PlaneGeometry(12, 400),
            this.materials.road
        );
        mainRoad.rotation.x = -Math.PI / 2;
        mainRoad.position.y = 0.01;
        mainRoad.receiveShadow = true;
        this.scene.add(mainRoad);

        const crossRoad = new THREE.Mesh(
            new THREE.PlaneGeometry(400, 12),
            this.materials.road
        );
        crossRoad.rotation.x = -Math.PI / 2;
        crossRoad.position.y = 0.01;
        crossRoad.receiveShadow = true;
        this.scene.add(crossRoad);

        const lineMat = new THREE.MeshStandardMaterial({ color: 0xffff00 });
        for (let i = -190; i < 200; i += 15) {
            if (Math.abs(i) < 8) continue;
            const line = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 8), lineMat);
            line.rotation.x = -Math.PI / 2;
            line.position.set(0, 0.02, i);
            this.scene.add(line);
            const lineX = new THREE.Mesh(new THREE.PlaneGeometry(8, 0.3), lineMat);
            lineX.rotation.x = -Math.PI / 2;
            lineX.position.set(i, 0.02, 0);
            this.scene.add(lineX);
        }

        const crosswalkMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
        for (let i = -5; i <= 5; i += 2) {
            const cw1 = new THREE.Mesh(new THREE.PlaneGeometry(1, 12), crosswalkMat);
            cw1.rotation.x = -Math.PI / 2;
            cw1.position.set(i, 0.02, 8);
            this.scene.add(cw1);

            const cw2 = new THREE.Mesh(new THREE.PlaneGeometry(1, 12), crosswalkMat);
            cw2.rotation.x = -Math.PI / 2;
            cw2.position.set(i, 0.02, -8);
            this.scene.add(cw2);
        }
    }

    createSidewalks() {
        const swGeo = new THREE.BoxGeometry(3, 0.2, 400);
        const swGeoX = new THREE.BoxGeometry(400, 0.2, 3);
        
        const positions = [
            { pos: [7.5, 0.1, 0], geo: swGeo },
            { pos: [-7.5, 0.1, 0], geo: swGeo },
            { pos: [0, 0.1, 7.5], geo: swGeoX },
            { pos: [0, 0.1, -7.5], geo: swGeoX }
        ];

        positions.forEach(p => {
            const sw = new THREE.Mesh(p.geo, this.materials.sidewalk);
            sw.position.set(...p.pos);
            sw.receiveShadow = true;
            sw.castShadow = true;
            this.scene.add(sw);
        });
    }

    createNeonDiner(x, z) {
        const group = new THREE.Group();
        
        const base = new THREE.Mesh(new THREE.BoxGeometry(10, 4, 12), this.materials.buildingBase);
        base.position.y = 2;
        base.castShadow = true;
        group.add(base);

        const trim = new THREE.Mesh(new THREE.BoxGeometry(10.2, 0.5, 12.2), this.materials.neonCyan);
        trim.position.y = 4.25;        group.add(trim);

        const windowGeo = new THREE.BoxGeometry(8, 2, 0.2);
        const win = new THREE.Mesh(windowGeo, this.materials.window);
        win.position.set(0, 2.5, 6.1);
        group.add(win);

        const sign = new THREE.Mesh(new THREE.BoxGeometry(6, 1.5, 0.5), this.materials.neonMagenta);
        sign.position.set(0, 5, 6);
        group.add(sign);

        group.position.set(x, 0, z);
        const rotation = -Math.PI / 4;
        group.rotation.y = rotation;
        this.scene.add(group);

        // Collision box (rotated to match building)
        this.addCollisionBox(x, z, 10, 12, rotation);
    }

    createCornerStore(x, z) {
        const group = new THREE.Group();
        
        const base = new THREE.Mesh(new THREE.BoxGeometry(8, 3, 8), this.materials.buildingDark);
        base.position.y = 1.5;
        base.castShadow = true;
        group.add(base);

        const awning = new THREE.Mesh(new THREE.BoxGeometry(9, 0.2, 3), this.materials.neonYellow);
        awning.position.set(0, 3, 5.5);
        group.add(awning);

        group.position.set(x, 0, z);
        const rotation = Math.PI / 4;
        group.rotation.y = rotation;
        this.scene.add(group);

        // Collision box
        this.addCollisionBox(x, z, 8, 8, rotation);
    }

    createGasStation(x, z) {
        const group = new THREE.Group();
        
        const canopy = new THREE.Mesh(new THREE.BoxGeometry(12, 0.3, 10), this.materials.concrete);
        canopy.position.y = 4;
        canopy.castShadow = true;
        group.add(canopy);

        const pillarGeo = new THREE.CylinderGeometry(0.3, 0.3, 4);        [[-5, 2, -4], [5, 2, -4], [-5, 2, 4], [5, 2, 4]].forEach(pos => {
            const p = new THREE.Mesh(pillarGeo, this.materials.streetlightPole);
            p.position.set(...pos);
            group.add(p);
        });

        const pumpGeo = new THREE.BoxGeometry(1, 1.5, 1);
        const pump = new THREE.Mesh(pumpGeo, this.materials.neonCyan);
        pump.position.set(0, 0.75, 0);
        group.add(pump);

        group.position.set(x, 0, z);
        this.scene.add(group);

        // Collision box for the whole structure
        this.addCollisionBox(x, z, 12, 10, 0);
    }

    createApartments(x, z) {
        const group = new THREE.Group();
        
        const base = new THREE.Mesh(new THREE.BoxGeometry(12, 8, 10), this.materials.buildingBase);
        base.position.y = 4;
        base.castShadow = true;
        group.add(base);

        const winGeo = new THREE.BoxGeometry(1.5, 1.5, 0.2);
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 4; col++) {
                const win = new THREE.Mesh(winGeo, this.materials.window);
                win.position.set(-4 + col * 2.5, 2 + row * 2.5, 5.1);
                group.add(win);
            }
        }

        group.position.set(x, 0, z);
        this.scene.add(group);

        // Collision box
        this.addCollisionBox(x, z, 12, 10, 0);
    }

    createStreetlight(x, z) {
        const group = new THREE.Group();
        
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 6), this.materials.streetlightPole);
        pole.position.y = 3;
        group.add(pole);

        const arm = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 0.1), this.materials.streetlightPole);        arm.position.set(1, 6, 0);
        group.add(arm);

        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.3), this.materials.streetlightGlow);
        bulb.position.set(2, 5.8, 0);
        group.add(bulb);

        group.position.set(x, 0, z);
        this.scene.add(group);
    }

    createTree(x, z) {
        const group = new THREE.Group();
        
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 2), this.materials.treeTrunk);
        trunk.position.y = 1;
        trunk.castShadow = true;
        group.add(trunk);

        const leaves = new THREE.Mesh(new THREE.ConeGeometry(1.5, 3, 8), this.materials.treeLeaves);
        leaves.position.y = 3;
        leaves.castShadow = true;
        group.add(leaves);

        group.position.set(x, 0, z);
        this.scene.add(group);
    }

    createFireHydrant(x, z) {
        const hydrant = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.2, 0.8, 8),
            new THREE.MeshStandardMaterial({ color: 0xff0000 })
        );
        hydrant.position.set(x, 0.4, z);
        hydrant.castShadow = true;
        this.scene.add(hydrant);
    }
            }
