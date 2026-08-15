class SceneManager {
    constructor(container) {
        this.container = container;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();
        
        this.ground = null;
        this.road = null;
        this.centerLines = [];
        this.edgeLines = [];
        
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
        
        this.setupLights();
        this.setupTestWorld();
        this.setupResizeHandler();
    }
    
    setupLights() {
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(50, 100, 50);
        dirLight.castShadow = true;
        dirLight.shadow.camera.left = -50;
        dirLight.shadow.camera.right = 50;
        dirLight.shadow.camera.top = 50;
        dirLight.shadow.camera.bottom = -50;
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        this.scene.add(dirLight);
        
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);
        
        const hemiLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.3);
        this.scene.add(hemiLight);
    }
    
    setupTestWorld() {
        // Massive Ground Plane
        const groundGeometry = new THREE.PlaneGeometry(4000, 4000);
        const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x3a5f3a, roughness: 0.9 });
        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);
        
        // Massive Road Plane
        const roadGeometry = new THREE.PlaneGeometry(12, 4000);
        const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
        this.road = new THREE.Mesh(roadGeometry, roadMaterial);
        this.road.rotation.x = -Math.PI / 2;
        this.road.position.y = 0.01;
        this.road.receiveShadow = true;
        this.scene.add(this.road);
        
        // Center Lines (Yellow dashed)
        const lineMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
        for (let i = 0; i < 40; i++) {
            const line = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 6), lineMaterial);
            line.rotation.x = -Math.PI / 2;
            line.position.y = 0.02;
            line.position.z = (i - 20) * 20;
            this.scene.add(line);
            this.centerLines.push(line);
        }
        
        // Edge Lines (White solid)
        const edgeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
        [-5.85, 5.85].forEach(x => {
            for (let i = 0; i < 40; i++) {
                const line = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 20), edgeMaterial);
                line.rotation.x = -Math.PI / 2;
                line.position.y = 0.02;
                line.position.x = x;
                line.position.z = (i - 20) * 20;
                this.scene.add(line);
                this.edgeLines.push(line);
            }
        });
    }
    
    // Called every frame to keep the world under the car
    updateEnvironment(carPosition) {
        if (!this.ground || !this.road) return;
        
        // Snap ground and road to car's X/Z so we never fall off
        this.ground.position.x = carPosition.x;
        this.ground.position.z = carPosition.z;
        
        this.road.position.x = carPosition.x;
        this.road.position.z = carPosition.z;
        
        // Update lines to create infinite road illusion
        const segmentLength = 20;
        const baseZ = Math.floor(carPosition.z / segmentLength) * segmentLength;
        
        this.centerLines.forEach((line, i) => {
            line.position.x = carPosition.x;
            line.position.z = baseZ + (i - 20) * segmentLength;
        });
        
        this.edgeLines.forEach((line, i) => {
            const isLeft = i % 2 === 0;
            line.position.x = carPosition.x + (isLeft ? -5.85 : 5.85);
            line.position.z = baseZ + (Math.floor(i / 2) - 10) * segmentLength;
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
        return this.clock.getDelta();
    }
    
    render() {
        this.renderer.render(this.scene, this.camera);
    }
    
    dispose() {
        this.renderer.dispose();
        this.container.removeChild(this.renderer.domElement);
    }
}
