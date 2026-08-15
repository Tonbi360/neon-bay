class Vehicle {
    constructor(scene, neighborhood, config) {
        this.scene = scene;
        this.neighborhood = neighborhood;
        this.mesh = new THREE.Group();
        this.config = config; // { x, z, rotY, color, width, depth }
        
        this.build();
        
        this.mesh.position.set(config.x, 0, config.z);
        this.mesh.rotation.y = config.rotY || 0;
        this.scene.add(this.mesh);

        // Register collision box with the world
        this.neighborhood.addCollisionBox(
            config.x, 
            config.z, 
            config.width || 2.2, 
            config.depth || 4.5, 
            config.rotY || 0
        );
    }

    build() {
        // Main body
        const bodyGeo = new THREE.BoxGeometry(2, 0.8, 4.2);
        const bodyMat = new THREE.MeshStandardMaterial({ 
            color: this.config.color, 
            metalness: 0.6, 
            roughness: 0.4 
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.6;
        body.castShadow = true;
        this.mesh.add(body);

        // Cabin
        const cabinGeo = new THREE.BoxGeometry(1.8, 0.7, 2.2);
        const cabinMat = new THREE.MeshStandardMaterial({ 
            color: 0x111111, 
            metalness: 0.9, 
            roughness: 0.1 
        });
        const cabin = new THREE.Mesh(cabinGeo, cabinMat);
        cabin.position.set(0, 1.3, 0.2);
        cabin.castShadow = true;
        this.mesh.add(cabin);

        // Wheels
        const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.3, 12);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
        const wheelPositions = [
            [-1.05, 0.38, 1.4], [1.05, 0.38, 1.4],
            [-1.05, 0.38, -1.4], [1.05, 0.38, -1.4]
        ];
        
        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(...pos);
            wheel.castShadow = true;
            this.mesh.add(wheel);
        });
    }

    dispose() {
        this.scene.remove(this.mesh);
    }
}
