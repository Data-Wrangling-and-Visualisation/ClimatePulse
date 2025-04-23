import { fetchData } from '../utils/helpers.js';

export class BurningBalanceLeft {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`Container #${containerId} not found!`);
        }
        this.container.style.width = '100%';
        this.container.style.height = '500px';
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.globeMesh = null;
        this.data = null;
        // this.container.style.border = '2px solid red';
        // this.container.style.backgroundColor = 'green';
        this.lights = [];
        this.starfield = null;

        // Globe settings
        this.radius = 200;
        this.segments = 64;
        this.rotationSpeed = 0.001;

        // Slider settings
        this.currentYear = 2000;
        this.minYear = 2000;
        this.maxYear = 2020;

        this.init();
    }

    async init() {
        try {
            // Initialize Three.js scene
            this.setupScene();

            // Add lights
            this.addLights();

            // Create globe
            await this.createGlobe();

            // Start rendering loop
            this.animate();
        } catch (error) {
            console.error('Error initializing BurningBalance:', error);
        }
    }

    setupScene() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);

        // Camera
        const aspectRatio = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(45, aspectRatio, 0.1, 10000);
        this.camera.position.z = this.radius * 3;


        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.container.appendChild(this.renderer.domElement);

        // Controls
        const controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = this.radius * 1.5;
        controls.maxDistance = this.radius * 6;

        this.addStarfield();
    }
    
    addStarfield() {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        for (let i = 0; i < 10000; i++) {
            vertices.push(
                Math.random() * 2000 - 1000,
                Math.random() * 2000 - 1000,
                Math.random() * 2000 - 1000
            );
        }
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        const material = new THREE.PointsMaterial({ color: 0xFFFFFF, size: 1 });
        const stars = new THREE.Points(geometry, material);
        this.scene.add(stars);
        this.starfield = stars;
    }

    addLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1).normalize();
        this.scene.add(directionalLight);
        this.lights.push(ambientLight, directionalLight);

    }

    async createGlobe() {
        // Fetch data for the initial year
        this.data = await this.fetchDataForYear(this.currentYear);

        // Sphere geometry
        const geometry = new THREE.SphereGeometry(this.radius, this.segments, this.segments);
        const textureLoader = new THREE.TextureLoader();
        const worldTexture = textureLoader.load('https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg');
        const bumpMap = textureLoader.load('https://threejs.org/examples/textures/planets/earth_normal_2048.jpg');
        const specularMap = textureLoader.load('https://threejs.org/examples/textures/planets/earth_specular_2048.jpg');
        // Material
        const material = new THREE.MeshPhongMaterial({
            map: worldTexture,
            bumpMap: bumpMap,
            bumpScale: 0.05,
            specularMap: specularMap,
            specular: new THREE.Color('grey'),
            shininess: 5
        });

        // Globe mesh
        this.globeMesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.globeMesh);

        // Add countries as extruded geometries
        this.addCountriesToGlobe();
    }

    async fetchDataForYear(year) {
        try {
            const response = await fetchData(`/api/balance/${year}`);
            return await response;
        } catch (error) {
            console.error('Error fetching data:', error);
            return [];
        }
    }

    addCountriesToGlobe() {
        this.data.forEach(country => {
            const { air_pollution, co2_emissions, coordinates, c, forest_area } = country;

            // Convert lat/lng to 3D position on the globe
            const [lat, lng] = coordinates;
            const phi = (90 - lat) * (Math.PI / 180);
            const theta = (lng + 180) * (Math.PI / 180);
            const x = -(this.radius * Math.sin(phi) * Math.cos(theta));
            const y = this.radius * Math.cos(phi);
            const z = this.radius * Math.sin(phi) * Math.sin(theta);

            // Extrude height based on CO₂ emissions
            const height = co2_emissions * 250; // Scale factor for visualization

            // Create a box geometry for the country
            const geometry = new THREE.BoxGeometry(10, height, 10);
            const material = new THREE.MeshPhongMaterial({
                color: this.getColorForCO2(co2_emissions)
            });

            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(x, y, z);
            this.scene.add(mesh);
        });
    }

    getColorForCO2(value) {
        const r = 255;
        const g = Math.floor(255 * (1 - value)-150);
        const b = Math.floor(255 * (1 - value) - 150);
        return new THREE.Color(`rgb(${r},${g},${b})`);
    }

    async updateYear(newYear) {
        this.currentYear = newYear;
        this.data = await this.fetchDataForYear(this.currentYear);
        this.updateGlobe();
    }

    updateGlobe() {
        // Remove old country meshes and clean up tooltips
        const newChildren = [];
        this.scene.children.forEach(child => {
            if (child === this.globeMesh || child === this.starfield || this.lights.includes(child)) {
                // Keep permanent objects like the globe, starfield, and lights
                newChildren.push(child);
            } else if (child.userData && child.userData.tooltip) {
                // Clean up tooltips for removed country markers
                document.body.removeChild(child.userData.tooltip);
            }
        });
    
        // Update the scene with only the permanent objects
        this.scene.children = newChildren;
    
        // Add new country markers based on updated data
        this.addCountriesToGlobe();
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Rotate the globe
        this.scene.rotation.y += this.rotationSpeed; 
        this.renderer.render(this.scene, this.camera);
    }
    
}

export class BurningBalanceRight {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`Container #${containerId} not found!`);
        }
        this.container.style.width = '100%';
        this.container.style.height = '500px';
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.globeMesh = null;
        this.data = null;
        // this.container.style.border = '2px solid red';
        // this.container.style.backgroundColor = 'green';
        this.lights = [];
        this.starfield = null;

        // Globe settings
        this.radius = 200;
        this.segments = 64;
        this.rotationSpeed = 0.001;

        // Slider settings
        this.currentYear = 2000;
        this.minYear = 2000;
        this.maxYear = 2020;

        this.init();
    }

    async init() {
        try {
            // Initialize Three.js scene
            this.setupScene();

            // Add lights
            this.addLights();

            // Create globe
            await this.createGlobe();

            // Add slider
            // this.addSlider();

            // Start rendering loop
            this.animate();
        } catch (error) {
            console.error('Error initializing BurningBalance:', error);
        }
    }

    setupScene() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);

        // Camera
        const aspectRatio = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(45, aspectRatio, 0.1, 10000);
        this.camera.position.z = this.radius * 3;


        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.container.appendChild(this.renderer.domElement);

        // Controls
        const controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = this.radius * 1.5;
        controls.maxDistance = this.radius * 6;

        this.addStarfield();
    }
    
    addStarfield() {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        for (let i = 0; i < 10000; i++) {
            vertices.push(
                Math.random() * 2000 - 1000,
                Math.random() * 2000 - 1000,
                Math.random() * 2000 - 1000
            );
        }
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        const material = new THREE.PointsMaterial({ color: 0xFFFFFF, size: 1 });
        const stars = new THREE.Points(geometry, material);
        this.scene.add(stars);
        this.starfield = stars;
    }

    addLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1).normalize();
        this.scene.add(directionalLight);
        this.lights.push(ambientLight, directionalLight);

    }

    async createGlobe() {
        // Fetch data for the initial year
        this.data = await this.fetchDataForYear(this.currentYear);

        // Sphere geometry
        const geometry = new THREE.SphereGeometry(this.radius, this.segments, this.segments);
        const textureLoader = new THREE.TextureLoader();
        const worldTexture = textureLoader.load('https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg');
        const bumpMap = textureLoader.load('https://threejs.org/examples/textures/planets/earth_normal_2048.jpg');
        const specularMap = textureLoader.load('https://threejs.org/examples/textures/planets/earth_specular_2048.jpg');
        // Material
        const material = new THREE.MeshPhongMaterial({
            map: worldTexture,
            bumpMap: bumpMap,
            bumpScale: 0.05,
            specularMap: specularMap,
            specular: new THREE.Color('grey'),
            shininess: 5
        });

        // Globe mesh
        this.globeMesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.globeMesh);

        // Add countries as extruded geometries
        this.addCountriesToGlobe();
    }

    async fetchDataForYear(year) {
        try {
            const response = await fetchData(`/api/balance/${year}`);
            return await response;
        } catch (error) {
            console.error('Error fetching data:', error);
            return [];
        }
    }

    addCountriesToGlobe() {
        this.data.forEach(country => {
            const { air_pollution, co2_emissions, coordinates, c, forest_area } = country;

            // Convert lat/lng to 3D position on the globe
            const [lat, lng] = coordinates;
            const phi = (90 - lat) * (Math.PI / 180);
            const theta = (lng + 180) * (Math.PI / 180);
            const x = -(this.radius * Math.sin(phi) * Math.cos(theta));
            const y = this.radius * Math.cos(phi);
            const z = this.radius * Math.sin(phi) * Math.sin(theta);

            // Extrude height based on CO₂ emissions
            const size = forest_area * 10; // Scale factor for visualization

            // Create a box geometry for the country
            const geometry = new THREE.SphereGeometry(size);
            const material = new THREE.MeshBasicMaterial({
                color: this.getColorForForest(forest_area)
            });

            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(x, y, z);
            this.scene.add(mesh);
        });
    }

    getColorForForest(value) {
        value = Math.max(0, Math.min(1, value));
        const r = 0;
        const g =  Math.floor(255 * value); 
        const b = Math.floor(255 * (1 - value));
        return new THREE.Color(`rgb(${r},${g},${b})`);
    }

    async updateYear(newYear) {
        this.currentYear = newYear;
        this.data = await this.fetchDataForYear(this.currentYear);
        this.updateGlobe();
    }

    updateGlobe() {
        // Remove old country meshes and clean up tooltips
        const newChildren = [];
        this.scene.children.forEach(child => {
            if (child === this.globeMesh || child === this.starfield || this.lights.includes(child)) {
                // Keep permanent objects like the globe, starfield, and lights
                newChildren.push(child);
            } else if (child.userData && child.userData.tooltip) {
                // Clean up tooltips for removed country markers
                document.body.removeChild(child.userData.tooltip);
            }
        });
    
        // Update the scene with only the permanent objects
        this.scene.children = newChildren;
    
        // Add new country markers based on updated data
        this.addCountriesToGlobe();
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Rotate the globe
        this.scene.rotation.y += this.rotationSpeed; 
        this.renderer.render(this.scene, this.camera);
    }
    
}
