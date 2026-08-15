class SceneManager {
    constructor(container) {
        this.container = container;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();
        
        this.init();
    }
    
    init() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 300);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        this.container.appendChild(this.renderer.domElement);
        
        // Setup
        this.setupLights();
        this.setupTestWorld();
        this.setupResizeHandler();
    }
    
    setupLights() {
        // Directional light (sun)
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(50, 100, 50);
        dirLight.castShadow = true;        dirLight.shadow.camera.left = -50;
        dirLight.shadow.camera.right = 50;
        dirLight.shadow.camera.top = 50;
        dirLight.shadow.camera.bottom = -50;
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        this.scene.add(dirLight);
        
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);
        
        // Hemisphere light
        const hemiLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.3);
        this.scene.add(hemiLight);
    }
    
    setupTestWorld() {
        // Ground
        const groundGeometry = new THREE.PlaneGeometry(200, 200);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x3a5f3a,
            roughness: 0.9
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Road
        const roadGeometry = new THREE.PlaneGeometry(12, 200);
        const roadMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            roughness: 0.8
        });
        const road = new THREE.Mesh(roadGeometry, roadMaterial);
        road.rotation.x = -Math.PI / 2;
        road.position.y = 0.01;
        road.receiveShadow = true;
        this.scene.add(road);
        
        // Lane markings
        const lineMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
        for (let i = -90; i < 90; i += 10) {
            const line = new THREE.Mesh(
                new THREE.PlaneGeometry(0.3, 6),
                lineMaterial
            );
            line.rotation.x = -Math.PI / 2;
            line.position.set(0, 0.02, i);            this.scene.add(line);
        }
        
        // Edge lines
        const edgeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
        [-5.85, 5.85].forEach(x => {
            for (let i = -90; i < 90; i += 10) {
                const line = new THREE.Mesh(
                    new THREE.PlaneGeometry(0.2, 8),
                    edgeMaterial
                );
                line.rotation.x = -Math.PI / 2;
                line.position.set(x, 0.02, i);
                this.scene.add(line);
            }
        });
        
        // Placeholder car (simple box)
        const carGeometry = new THREE.BoxGeometry(2, 1, 4);
        const carMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xcc0000,
            metalness: 0.6,
            roughness: 0.4
        });
        this.testCar = new THREE.Mesh(carGeometry, carMaterial);
        this.testCar.position.set(0, 0.5, 0);
        this.testCar.castShadow = true;
        this.scene.add(this.testCar);
        
        // Simple wheels
        const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 8);
        const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
        [[-1, 0.4, 1.5], [1, 0.4, 1.5], [-1, 0.4, -1.5], [1, 0.4, -1.5]].forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(...pos);
            this.testCar.add(wheel);
        });
    }
    
    setupResizeHandler() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    
    getDelta() {
        return this.clock.getDelta();    }
    
    render() {
        this.renderer.render(this.scene, this.camera);
    }
    
    dispose() {
        this.renderer.dispose();
        this.container.removeChild(this.renderer.domElement);
    }
}
