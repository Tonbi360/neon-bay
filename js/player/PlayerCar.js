class PlayerCar {
    constructor(scene) {
        this.scene = scene;
        this.mesh = null;
        this.wheels = [];
        
        // Physics
        this.speed = 0;
        this.acceleration = 0;
        this.maxSpeed = 2.0;
        this.maxReverseSpeed = -0.5;
        this.accelRate = 0.02;
        this.brakeRate = 0.04;
        this.friction = 0.98;
        this.steerAngle = 0;
        this.maxSteerAngle = 0.03;
        
        // Input
        this.input = {
            left: false,
            right: false,
            up: false,
            down: false,
            brake: false
        };
        
        this.createCar();
        this.setupControls();
    }
    
    createCar() {
        // Replace placeholder with better box car
        const carGroup = new THREE.Group();
        
        // Main body
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
        
        // Cabin (top)
        const cabinGeo = new THREE.BoxGeometry(1.8, 0.7, 2.2);
        const cabinMat = new THREE.MeshStandardMaterial({ 
            color: 0x1a1a1a,            metalness: 0.9,
            roughness: 0.1
        });
        const cabin = new THREE.Mesh(cabinGeo, cabinMat);
        cabin.position.set(0, 1.3, -0.2);
        cabin.castShadow = true;
        carGroup.add(cabin);
        
        // Windshield
        const windGeo = new THREE.BoxGeometry(1.85, 0.5, 0.1);
        const glassMat = new THREE.MeshStandardMaterial({ 
            color: 0x88ccff,
            metalness: 0.9,
            roughness: 0.1,
            transparent: true,
            opacity: 0.6
        });
        const windshield = new THREE.Mesh(windGeo, glassMat);
        windshield.position.set(0, 1.3, 0.9);
        carGroup.add(windshield);
        
        // Wheels
        const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.3, 12);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
        
        const wheelPositions = [
            [-1.05, 0.38, 1.4],
            [1.05, 0.38, 1.4],
            [-1.05, 0.38, -1.4],
            [1.05, 0.38, -1.4]
        ];
        
        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(...pos);
            wheel.castShadow = true;
            carGroup.add(wheel);
            this.wheels.push(wheel);
        });
        
        // Headlights
        const lightGeo = new THREE.BoxGeometry(0.4, 0.3, 0.1);
        const lightMat = new THREE.MeshStandardMaterial({ 
            color: 0xffffcc,
            emissive: 0xffffaa,
            emissiveIntensity: 0.5
        });
        
        [[-0.7, 0.7, 2.1], [0.7, 0.7, 2.1]].forEach(pos => {            const light = new THREE.Mesh(lightGeo, lightMat);
            light.position.set(...pos);
            carGroup.add(light);
        });
        
        // Taillights
        const tailMat = new THREE.MeshStandardMaterial({ 
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.3
        });
        
        [[-0.7, 0.7, -2.1], [0.7, 0.7, -2.1]].forEach(pos => {
            const tail = new THREE.Mesh(lightGeo, tailMat);
            tail.position.set(...pos);
            carGroup.add(tail);
        });
        
        this.mesh = carGroup;
        this.mesh.position.set(0, 0, 0);
        this.scene.scene.add(this.mesh);
    }
    
    setupControls() {
        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            switch(e.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.input.up = true;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.input.down = true;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.input.left = true;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.input.right = true;
                    break;
                case 'Space':
                    this.input.brake = true;
                    break;
            }
        });
        
        window.addEventListener('keyup', (e) => {            switch(e.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.input.up = false;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.input.down = false;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.input.left = false;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.input.right = false;
                    break;
                case 'Space':
                    this.input.brake = false;
                    break;
            }
        });
        
        // Touch controls
        this.setupTouchControls();
    }
    
    setupTouchControls() {
        const canvas = this.scene.renderer.domElement;
        const touchZones = {
            left: false,
            right: false,
            brake: false
        };
        
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            
            for (let touch of e.touches) {
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;
                const width = rect.width;
                const height = rect.height;
                
                // Bottom 30% is brake zone (center)
                if (y > height * 0.7 && x > width * 0.3 && x < width * 0.7) {
                    touchZones.brake = true;
                    this.input.brake = true;
                }                // Left side = steer left
                else if (x < width / 2) {
                    touchZones.left = true;
                    this.input.left = true;
                }
                // Right side = steer right
                else {
                    touchZones.right = true;
                    this.input.right = true;
                }
            }
        }, { passive: false });
        
        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            
            // Reset all touch inputs
            touchZones.left = false;
            touchZones.right = false;
            touchZones.brake = false;
            
            this.input.left = false;
            this.input.right = false;
            this.input.brake = false;
            
            // Re-check remaining touches
            for (let touch of e.touches) {
                const rect = canvas.getBoundingClientRect();
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;
                const width = rect.width;
                const height = rect.height;
                
                if (y > height * 0.7 && x > width * 0.3 && x < width * 0.7) {
                    touchZones.brake = true;
                    this.input.brake = true;
                } else if (x < width / 2) {
                    touchZones.left = true;
                    this.input.left = true;
                } else {
                    touchZones.right = true;
                    this.input.right = true;
                }
            }
        }, { passive: false });
        
        canvas.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.input.left = false;
            this.input.right = false;            this.input.brake = false;
        }, { passive: false });
    }
    
    update(delta) {
        if (!this.mesh) return;
        
        // Acceleration
        if (this.input.up) {
            this.speed += this.accelRate;
        } else if (this.input.down) {
            this.speed -= this.accelRate;
        } else {
            // Friction when no input
            this.speed *= this.friction;
        }
        
        // Braking
        if (this.input.brake) {
            if (this.speed > 0) {
                this.speed -= this.brakeRate;
            } else if (this.speed < 0) {
                this.speed += this.brakeRate;
            }
            // Stop completely if slow enough
            if (Math.abs(this.speed) < 0.01) {
                this.speed = 0;
            }
        }
        
        // Clamp speed
        this.speed = Math.max(this.maxReverseSpeed, Math.min(this.maxSpeed, this.speed));
        
        // Steering (more responsive at low speeds)
        const steerFactor = Math.abs(this.speed) / this.maxSpeed;
        const currentSteer = this.maxSteerAngle * (0.5 + 0.5 * steerFactor);
        
        if (this.input.left) {
            this.mesh.rotation.y += currentSteer;
            this.steerAngle = -1;
        } else if (this.input.right) {
            this.mesh.rotation.y -= currentSteer;
            this.steerAngle = 1;
        } else {
            this.steerAngle = 0;
        }
        
        // Move car forward based on rotation
        this.mesh.position.x += Math.sin(this.mesh.rotation.y) * this.speed;
        this.mesh.position.z += Math.cos(this.mesh.rotation.y) * this.speed;        
        // Rotate wheels
        this.wheels.forEach(wheel => {
            wheel.rotation.x += this.speed * 0.5;
        });
        
        // Update camera to follow car
        this.updateCamera();
    }
    
    updateCamera() {
        if (!this.mesh || !this.scene.camera) return;
        
        // Camera position behind and above car
        const offsetDistance = 8;
        const offsetHeight = 4;
        
        const targetX = this.mesh.position.x - Math.sin(this.mesh.rotation.y) * offsetDistance;
        const targetZ = this.mesh.position.z - Math.cos(this.mesh.rotation.y) * offsetDistance;
        const targetY = this.mesh.position.y + offsetHeight;
        
        // Smooth camera follow
        this.scene.camera.position.x += (targetX - this.scene.camera.position.x) * 0.1;
        this.scene.camera.position.z += (targetZ - this.scene.camera.position.z) * 0.1;
        this.scene.camera.position.y += (targetY - this.scene.camera.position.y) * 0.1;
        
        // Camera looks at car
        this.scene.camera.lookAt(
            this.mesh.position.x,
            this.mesh.position.y + 1,
            this.mesh.position.z
        );
    }
    
    getPosition() {
        return this.mesh ? this.mesh.position : new THREE.Vector3(0, 0, 0);
    }
    
    dispose() {
        if (this.mesh) {
            this.scene.scene.remove(this.mesh);
        }
    }
          }
