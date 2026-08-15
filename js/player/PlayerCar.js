class PlayerCar {
    constructor(scene, controls) {
        this.scene = scene;
        this.controls = controls;
        this.mesh = null;
        
        // --- TUNED PHYSICS VALUES ---
        this.speed = 0;
        this.maxSpeed = 0.35;       // Reduced from 0.8 (approx 40-50% of previous)
        this.accelRate = 0.008;     // Progressive acceleration
        this.brakeRate = 0.02;      // Deceleration only
        this.friction = 0.98;       // Natural drag (coasting)
        this.steerSpeed = 0.03;     // Slightly reduced for stability
        
        this.createCar();
    }
    
    createCar() {
        const carGroup = new THREE.Group();
        
        // Main body
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
        cabin.position.set(0, 1.3, 0.2);
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
        
        // Acceleration
        if (input.acc) {
            this.speed += this.accelRate;
        } 
        // Braking (FIXED: Decelerates to 0, does NOT reverse)
        else if (input.brk) {
            if (this.speed > 0) {
                this.speed -= this.brakeRate;
                if (this.speed < 0) this.speed = 0;
            } else if (this.speed < 0) {
                this.speed += this.brakeRate;
                if (this.speed > 0) this.speed = 0;
            }
        } 
        // Natural drag
        else {
            this.speed *= this.friction;
            if (Math.abs(this.speed) < 0.001) this.speed = 0;
        }
        
        // Clamp speed
        this.speed = Math.max(-this.maxSpeed / 2, Math.min(this.maxSpeed, this.speed));
        
        // Steering (only steer if moving)
        if (Math.abs(this.speed) > 0.01) {
            const direction = this.speed > 0 ? 1 : -1;
            // Steering is slightly less sensitive at high speeds for stability
            const currentSteer = this.steerSpeed * (0.7 + 0.3 * (Math.abs(this.speed) / this.maxSpeed));
            
            if (input.left) this.mesh.rotation.y += currentSteer * direction;
            if (input.right) this.mesh.rotation.y -= currentSteer * direction;
        }
        
        // Move car forward/backward based on rotation
        this.mesh.translateZ(-this.speed);
        
        // Update Camera
        this.updateCamera();
    }
    
    updateCamera() {
        if (!this.mesh || !this.scene.camera) return;
        
        // Calculate desired camera position (behind and above car)
        const relativeOffset = new THREE.Vector3(0, 3.5, 8); // Tuned for better view
        const cameraTarget = relativeOffset.applyMatrix4(this.mesh.matrixWorld);
        
        // Smoothly interpolate camera position
        this.scene.camera.position.lerp(cameraTarget, 0.1);
        
        // Look slightly ahead of the car
        const lookTarget = new THREE.Vector3(0, 1, -5);
        lookTarget.applyMatrix4(this.mesh.matrixWorld);
        this.scene.camera.lookAt(lookTarget);
    }
    
    getPosition() {
        return this.mesh ? this.mesh.position : new THREE.Vector3(0, 0, 0);
    }
    
    dispose() {
        if (this.mesh) this.scene.scene.remove(this.mesh);
    }
}
