class PlayerCar {
    constructor(sceneManager, controls, neighborhood) {
        this.sceneManager = sceneManager; // Store the whole manager, not just the scene
        this.controls = controls;
        this.neighborhood = neighborhood;
        this.mesh = null;
        
        this.speed = 0;
        this.maxSpeed = 0.35;
        this.accelRate = 0.008;
        this.brakeRate = 0.02;
        this.friction = 0.98;
        this.steerSpeed = 0.03;
        
        this.createCar();
    }
    
    createCar() {
        const carGroup = new THREE.Group();
        
        const bodyGeo = new THREE.BoxGeometry(2, 0.8, 4.2);
        const bodyMat = new THREE.MeshStandardMaterial({ 
            color: 0xcc0000, 
            metalness: 0.6, 
            roughness: 0.4 
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.6;
        body.castShadow = true;
        carGroup.add(body);
        
        const cabinGeo = new THREE.BoxGeometry(1.8, 0.7, 2.2);
        const cabinMat = new THREE.MeshStandardMaterial({ 
            color: 0x1a1a1a, 
            metalness: 0.9, 
            roughness: 0.1 
        });
        const cabin = new THREE.Mesh(cabinGeo, cabinMat);
        cabin.position.set(0, 1.3, 0.2);
        cabin.castShadow = true;
        carGroup.add(cabin);
        
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
            carGroup.add(wheel);
        });
        
        this.mesh = carGroup;
        // Add to the scene via the manager
        this.sceneManager.scene.add(this.mesh);
    }
    
    update(delta) {
        if (!this.mesh) return;
        
        const input = this.controls.input;
        
        // Calculate intended movement
        let intendedSpeed = this.speed;
        
        if (input.acc) {
            intendedSpeed += this.accelRate;
        } else if (input.brk) {
            if (intendedSpeed > 0) {
                intendedSpeed -= this.brakeRate;
                if (intendedSpeed < 0) intendedSpeed = 0;
            }
        } else {
            intendedSpeed *= this.friction;
            if (Math.abs(intendedSpeed) < 0.001) intendedSpeed = 0;
        }
        
        intendedSpeed = Math.max(0, Math.min(this.maxSpeed, intendedSpeed));
        
        // Calculate intended new position
        const nextX = this.mesh.position.x - Math.sin(this.mesh.rotation.y) * intendedSpeed;
        const nextZ = this.mesh.position.z - Math.cos(this.mesh.rotation.y) * intendedSpeed;
        
        // Check collision
        const collision = this.neighborhood.checkCollision(nextX, nextZ, 1.2);
        
        if (collision.collided) {
            // Collision response: stop and push back slightly
            this.speed = 0;
            
            // Push car away from building
            const pushDir = Math.atan2(
                collision.localZ,
                collision.localX
            );
            const pushAmount = 0.2;
            this.mesh.position.x += Math.cos(pushDir) * pushAmount;
            this.mesh.position.z += Math.sin(pushDir) * pushAmount;
        } else {
            // No collision - apply movement
            this.speed = intendedSpeed;
            this.mesh.position.x = nextX;
            this.mesh.position.z = nextZ;
        }
        
        // Steering (only if moving)
        if (this.speed > 0.01) {
            if (input.left) this.mesh.rotation.y += this.steerSpeed;
            if (input.right) this.mesh.rotation.y -= this.steerSpeed;
        }
        
        // Ensure matrix is up to date before camera calculation
        this.mesh.updateMatrixWorld();
        
        this.updateCamera();
    }
    
    updateCamera() {
        // Fix: Access camera through sceneManager
        if (!this.mesh || !this.sceneManager.camera) return;
        
        const relativeOffset = new THREE.Vector3(0, 3.5, 8);
        const cameraTarget = relativeOffset.applyMatrix4(this.mesh.matrixWorld);
        
        this.sceneManager.camera.position.lerp(cameraTarget, 0.1);
        
        const lookTarget = new THREE.Vector3(0, 1, -5);
        lookTarget.applyMatrix4(this.mesh.matrixWorld);
        this.sceneManager.camera.lookAt(lookTarget);
    }
    
    getPosition() {
        return this.mesh ? this.mesh.position : new THREE.Vector3(0, 0, 0);
    }
    
    dispose() {
        if (this.mesh) this.sceneManager.scene.remove(this.mesh);
    }
}
