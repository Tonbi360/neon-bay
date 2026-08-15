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
        this.scene.fog = new THREE.Fog(0x87CEEB, 100, 400);
        
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
        dirLight.shadow.camera.left = -100;
        dirLight.shadow.camera.right = 100;
        dirLight.shadow.camera.top = 100;
        dirLight.shadow.camera.bottom = -100;
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        this.scene.add(dirLight);
        
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);
        
        const hemiLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.3);
        this.scene.add(hemiLight);
    }
    
    setupTestWorld() {
        // FINITE Ground (500x500 units - large but finite)
        const groundGeometry = new THREE.PlaneGeometry(500, 500);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x3a5f3a, 
            roughness: 0.9 
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // FINITE Road (12 wide x 400 long)
        const roadGeometry = new THREE.PlaneGeometry(12, 400);
        const roadMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333, 
            roughness: 0.8 
        });
        const road = new THREE.Mesh(roadGeometry, roadMaterial);
        road.rotation.x = -Math.PI / 2;
        road.position.y = 0.01;
        road.receiveShadow = true;
        this.scene.add(road);
        
        // Center Lines (Yellow dashed) - Only 20 segments total
        const lineMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
        for (let i = -190; i < 200; i += 20) {
            const line = new THREE.Mesh(
                new THREE.PlaneGeometry(0.3, 8),
                lineMaterial
            );
            line.rotation.x = -Math.PI / 2;
            line.position.set(0, 0.02, i);
            this.scene.add(line);
        }
        
        // Edge Lines (White solid) - Just 2 long lines
        const edgeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
        [-5.85, 5.85].forEach(x => {
            const line = new THREE.Mesh(
                new THREE.PlaneGeometry(0.25, 400),
                edgeMaterial
            );
            line.rotation.x = -Math.PI / 2;
            line.position.set(x, 0.02, 0);
            this.scene.add(line);
        });
        
        // Visual boundary markers (simple fences at edges)
        const fenceMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const fencePositions = [
            [-250, 0, -250], [250, 0, -250],
            [-250, 0, 250], [250, 0, 250]
        ];
        
        fencePositions.forEach(pos => {
            const fence = new THREE.Mesh(
                new THREE.BoxGeometry(2, 3, 2),
                fenceMaterial
            );
            fence.position.set(...pos);
            fence.position.y = 1.5;
            fence.castShadow = true;
            this.scene.add(fence);
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
