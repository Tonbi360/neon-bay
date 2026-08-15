class PlayerCar {
    constructor(scene, controls) {
        this.scene = scene;
        this.controls = controls;
        this.mesh = null;
        
        // Physics
        this.speed = 0;
        this.maxSpeed = 0.8; // Tuned for arcade feel
        this.accelRate = 0.015;
        this.brakeRate = 0.03;
        this.friction = 0.96;
        this.steerSpeed = 0.04;
        
        this.createCar();
    }
    
    createCar() {
        const carGroup = new THREE.Group();
        
        // Main body (Facing -Z by default for translateZ)
        const bodyGeo = new THREE.BoxGeometry(2, 0.8, 4.2);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, metalness: 0.6, roughness: 0.4 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.6;
        body.castShadow = true;
        carGroup.add(body);
        
        // Cabin
        const cabinGeo = new THREE.BoxGeometry(1.8, 0.7, 2.2);
        const cabinMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.9, roughness: 0.1 });
        const cabin = new THREE.Mesh(cabinGeo, cabinMat);
        cabin.position.set(0, 1.3, 0.2); // Shifted slightly back
        cabin.castShadow = true;
        carGroup.add(cabin);
        
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
            carGroup.add(wheel);
        });
        
        this.mesh = carGroup;
        this.scene.scene.add(this.mesh);
    }
    
    update(delta) {
        if (!this.mesh) return;
        
        const input = this.controls.input;
        
        // Acceleration / Braking
        if (input.acc) {
            this.speed += this.accelRate;
        } else if (input.brk) {
            this.speed -= this.brakeRate;
        } else {
            this.speed *= this.friction; // Natural slowdown
        }
        
        // Clamp speed
        this.speed = Math.max(-this.maxSpeed / 2, Math.min(this.maxSpeed, this.speed));
        if (Math.abs(this.speed) < 0.001) this.speed = 0;
        
        // Steering (only steer if moving)
        if (Math.abs(this.speed) > 0.01) {
            const direction = this.speed > 0 ? 1 : -1;
            if (input.left) this.mesh.rotation.y += this.steerSpeed * direction;
            if (input.right) this.mesh.rotation.y -= this.steerSpeed * direction;
        }
        
        // Move car forward/backward based on rotation
        this.mesh.translateZ(-this.speed);
        
        // Update Camera
        this.updateCamera();
    }
    
    updateCamera() {
        if (!this.mesh || !this.scene.camera) return;
        
        // Calculate desired camera position (behind and above car)
        const relativeOffset = new THREE.Vector3(0, 4, 10);
        const cameraTarget = relativeOffset.applyMatrix4(this.mesh.matrixWorld);
        
        // Smoothly interpolate camera position
        this.scene.camera.position.lerp(cameraTarget, 0.1);
        
        // Look slightly ahead of the car
        const lookTarget = new THREE.Vector3(0, 1, -5);
        lookTarget.applyMatrix4(this.mesh.matrixWorld);
        this.scene.camera.lookAt(lookTarget);
    }
    
    dispose() {
        if (this.mesh) this.scene.scene.remove(this.mesh);
    }
}
