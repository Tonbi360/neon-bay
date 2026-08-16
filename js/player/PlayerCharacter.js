class PlayerCharacter {
    constructor(scene, neighborhood) {
        this.scene = scene;
        this.neighborhood = neighborhood;
        this.mesh = new THREE.Group();
        
        // Simple placeholder character (Green Capsule)
        const bodyGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.8, 8);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.9;
        body.castShadow = true;
        this.mesh.add(body);
        
        // Head
        const headGeo = new THREE.SphereGeometry(0.35, 8, 8);
        const head = new THREE.Mesh(headGeo, bodyMat);
        head.position.y = 1.9;
        head.castShadow = true;
        this.mesh.add(head);
        
        this.scene.add(this.mesh);
        this.mesh.visible = false; // Start hidden
        
        this.speed = 0;
        this.maxSpeed = 0.15; // Walking speed
        this.accelRate = 0.01;
        this.friction = 0.85;
        this.turnSpeed = 0.05;
    }
    
    update(input, delta) {
        if (!this.mesh.visible) return;
        
        // Movement (tank controls for simplicity)
        if (input.acc) {
            this.speed += this.accelRate;
        } else if (input.brk) {
            this.speed -= this.accelRate;
        } else {
            this.speed *= this.friction;
        }
        
        this.speed = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, this.speed));
        if (Math.abs(this.speed) < 0.001) this.speed = 0;
        
        // Turning
        if (Math.abs(this.speed) > 0.01) {
            if (input.left) this.mesh.rotation.y += this.turnSpeed;
            if (input.right) this.mesh.rotation.y -= this.turnSpeed;
        }
        
        // Calculate intended position
        const nextX = this.mesh.position.x - Math.sin(this.mesh.rotation.y) * this.speed;
        const nextZ = this.mesh.position.z - Math.cos(this.mesh.rotation.y) * this.speed;
        
        // Collision (smaller radius for player)
        const collision = this.neighborhood.checkCollision(nextX, nextZ, 0.5);
        
        if (!collision.collided) {
            this.mesh.position.x = nextX;
            this.mesh.position.z = nextZ;
        } else {
            this.speed = 0;
        }
    }
    
    updateCamera(camera) {
        if (!this.mesh.visible) return;
        
        // Camera follows behind and above player
        const relativeOffset = new THREE.Vector3(0, 3, 6);
        const cameraTarget = relativeOffset.applyMatrix4(this.mesh.matrixWorld);
        
        camera.position.lerp(cameraTarget, 0.1);
        
        const lookTarget = new THREE.Vector3(0, 1.5, 0);
        lookTarget.applyMatrix4(this.mesh.matrixWorld);
        camera.lookAt(lookTarget);
    }
    
    // Spawn player beside the vehicle (driver's side)
    setPositionFromVehicle(vehiclePosition, vehicleRotation) {
        // Calculate offset to the left of the vehicle (driver's side)
        const offset = 2.5; // Distance from vehicle
        const sideOffset = 1.2; // To the left side
        
        const cos = Math.cos(vehicleRotation);
        const sin = Math.sin(vehicleRotation);
        
        // Position to the left and slightly behind
        const x = vehiclePosition.x + (sin * offset) + (cos * sideOffset);
        const z = vehiclePosition.z + (cos * offset) - (sin * sideOffset);
        
        this.mesh.position.set(x, 0.9, z);
        this.mesh.rotation.y = vehicleRotation;
    }
    
    getPosition() {
        return this.mesh.position;
    }
    
    setVisible(visible) {
        this.mesh.visible = visible;
    }
    
    dispose() {
        this.scene.remove(this.mesh);
    }
}
