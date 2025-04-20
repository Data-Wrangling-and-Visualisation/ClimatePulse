import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.117.1/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.117.1/examples/jsm/controls/OrbitControls.js';
import { fetchData, getColorForValue } from '../utils/helpers.js';

export class GlobeVisualization {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.countryData = null;
        this.countryMeshes = {};
        this.highlightedCountry = null;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);

        this.initScene();
        this.initGlobe();
        this.addLights();
        this.setupEventListeners();

        this.loadData().then(() => {
            this.createCountryMeshes();
            this.animate();
        });
    }

    initScene() {
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        this.camera.position.z = 2;

        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.25;
        this.controls.rotateSpeed = 0.5;
    }

    initGlobe() {
        const geometry = new THREE.SphereGeometry(1, 64, 64);

        const textureLoader = new THREE.TextureLoader();
        const texture = textureLoader.load('assets/images/earth-texture.jpg');
        const bumpMap = textureLoader.load('assets/images/earth-bump.jpg');

        const material = new THREE.MeshPhongMaterial({
            map: texture,
            bumpMap: bumpMap,
            bumpScale: 0.05,
            specular: new THREE.Color('grey'),
            shininess: 5
        });

        this.globe = new THREE.Mesh(geometry, material);
        this.scene.add(this.globe);

        const atmosphereGeometry = new THREE.SphereGeometry(1.02, 64, 64);
        const atmosphereMaterial = new THREE.MeshPhongMaterial({
            color: 0x3399ff,
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide
        });
        this.atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        this.scene.add(this.atmosphere);
    }

    addLights() {
        const ambientLight = new THREE.AmbientLight(0x333333);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 3, 5);
        this.scene.add(directionalLight);
    }

    async loadData() {
        const data = await fetchData('/api/wb/metric?metric=co2');
        if (data) {
            this.countryData = {};
            Object.keys(data).forEach(country => {
                const years = Object.keys(data[country]).map(Number).sort((a, b) => b - a);
                if (years.length > 0) {
                    const latestYear = years[0];
                    this.countryData[country] = {
                        value: data[country][latestYear],
                        year: latestYear
                    };
                }
            });

            this.minValue = Infinity;
            this.maxValue = -Infinity;
            Object.values(this.countryData).forEach(item => {
                if (item.value < this.minValue) this.minValue = item.value;
                if (item.value > this.maxValue) this.maxValue = item.value;
            });
        }
    }

    createCountryMeshes() {
        if (!this.countryData) return;
        this.countryGroup = new THREE.Group();
        this.scene.add(this.countryGroup);
    
        const countries = Object.entries(this.countryData);
        const segments = Math.ceil(Math.sqrt(countries.length));
        const deltaPhi = Math.PI / segments;
        const deltaTheta = (2 * Math.PI) / segments;
    
        countries.forEach(([countryCode, data], index) => {
            const i = Math.floor(index / segments);
            const j = index % segments;
    
            const phiStart = i * deltaPhi;
            const thetaStart = j * deltaTheta;
    
            const geometry = new THREE.SphereGeometry(
                1.01,
                8, 
                8,
                thetaStart,
                deltaTheta * 0.9,
                phiStart,
                deltaPhi * 0.9
            );
    
            const color = getColorForValue(data.value, this.minValue, this.maxValue);
            
            // Use Phong material for better lighting interaction
            const material = new THREE.MeshPhongMaterial({
                color: new THREE.Color(color),
                transparent: true,
                opacity: 0.4,
                side: THREE.DoubleSide,
                specular: 0x111111,
                shininess: 20
            });
    
            const segment = new THREE.Mesh(geometry, material);
            
    
            segment.userData = {
                id: countryCode,
                value: data.value,
                name: countryCode
            };
    
            this.countryGroup.add(segment);
            this.countryMeshes[countryCode] = segment;
        });
    }
    
        

    setupEventListeners() {
        this.renderer.domElement.addEventListener('mousemove', (event) => {
            const mouse = new THREE.Vector2();
            mouse.x = (event.clientX / this.renderer.domElement.clientWidth) * 1.5 - 1;
            mouse.y = -(event.clientY / this.renderer.domElement.clientHeight) * 1.5 + 1;

            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, this.camera);

            const intersects = raycaster.intersectObjects(this.countryGroup.children);

            if (this.highlightedCountry) {
                this.highlightedCountry.material.opacity = 0.6;
                this.highlightedCountry.scale.set(1, 1, 1);
            }

            if (intersects.length > 0) {
                const country = intersects[0].object;
                country.material.opacity = 0.6;
                country.scale.set(1.2, 1.2, 1.2);
                this.highlightedCountry = country;

                const tooltip = document.getElementById('globe-tooltip');
                tooltip.style.opacity = '0.6';
                tooltip.innerHTML = `
                    <strong>${country.userData.name}</strong><br>
                    CO₂ Emissions: ${formatNumber(country.userData.value)} Mt<br>
                    (Simulated data - replace with real country data)
                `;
                tooltip.style.left = `${event.clientX + 10}px`;
                tooltip.style.top = `${event.clientY - 10}px`;
            } else {
                document.getElementById('globe-tooltip').style.opacity = '0';
            }
        });

        window.addEventListener('resize', () => {
            this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        this.controls.update();

        this.renderer.render(this.scene, this.camera);
    }
}
