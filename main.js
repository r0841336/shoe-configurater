import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'; // Import OrbitControls
import * as dat from 'dat.gui'; // dat.GUI

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// Renderer setup
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Load the 360 texture (this will be used for reflections)
const loader = new THREE.TextureLoader();
const texture360 = loader.load('Gemini_Generated_Image_6c9m4b6c9m4b6c9m.jpeg', () => {
  console.log('Texture loaded successfully');
}, undefined, (err) => {
  console.error('Error loading texture:', err);
});

// Create a sphere for the environment (360-degree texture)
const geometry = new THREE.SphereGeometry(500, 60, 40); // Large sphere
const material = new THREE.MeshBasicMaterial({ map: texture360, side: THREE.BackSide }); // Texture on inside
const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

// Ambient Light (for global illumination)
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

// Directional Light (to simulate sunlight)
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 10, 10);
scene.add(directionalLight);

// Set camera position
camera.position.set(0, 10, 30);
camera.lookAt(0, 0, 0);

// Initialize OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.screenSpacePanning = false;

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Load GLB model
const gltfLoader = new GLTFLoader();
let shoe;

gltfLoader.load(
  '/Shoe_compressed.glb',
  (gltf) => {
    shoe = gltf.scene;
    shoe.scale.set(50, 50, 50);
    shoe.position.set(0, 0, 0);
    shoe.rotation.y = Math.PI / 40;

    scene.add(shoe);
    console.log('Model added to the scene:', shoe);

    // Load the cube texture for environment reflection
    const cubeLoader = new THREE.CubeTextureLoader();
    const cubeTexture = cubeLoader.load([ 
      'posx.jpg', 'negx.jpg',
      'posy.jpg', 'negy.jpg',
      'posz.jpg', 'negz.jpg',
    ]);
    scene.background = cubeTexture;
    scene.environment = cubeTexture;

    // Apply a standard material
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: 0xFFFFFF,
          roughness: 0.5,
          metalness: 0.0,
          envMap: cubeTexture,
          envMapIntensity: 1.0
        });
      }
    });

    // Collect part names of the shoe (for example, laces, sole, etc.)
    collectShoeParts(shoe);
  },
  undefined,
  (error) => {
    console.error('Error loading model:', error);
  }
);

// Function to collect the parts of the shoe
const shoeParts = [];

function collectShoeParts(model) {
  model.traverse((child) => {
    if (child.isMesh) {
      // Store part names to display them
      shoeParts.push(child.name);
      console.log('Part name:', child.name); // Log the name of each part
    }
  });
}

// dat.GUI - Adding sliders for adjusting light, camera position, zoom and object rotation
const gui = new dat.GUI();

// Light settings
const lightParams = {
  ambientIntensity: 20,
  directionalIntensity: 30,
  directionalX: 10,
  directionalY: 10,
  directionalZ: 10,
};

// Camera settings
const cameraParams = {
  cameraX: 0,
  cameraY: 10,
  cameraZ: 30,
  fov: 75,
};

// Object rotation settings
const rotationParams = {
  rotateX: 0,
  rotateY: 0,
  rotateZ: 0,
};

// Create folders for light, camera settings, and object rotation in the GUI
const lightFolder = gui.addFolder('Lighting');
lightFolder.add(lightParams, 'ambientIntensity', 0, 100).onChange(updateLighting);
lightFolder.add(lightParams, 'directionalIntensity', 0, 100).onChange(updateLighting);
lightFolder.add(lightParams, 'directionalX', -50, 50).onChange(updateLighting);
lightFolder.add(lightParams, 'directionalY', -50, 50).onChange(updateLighting);
lightFolder.add(lightParams, 'directionalZ', -50, 50).onChange(updateLighting);
lightFolder.open();

// Create camera folder in the GUI
const cameraFolder = gui.addFolder('Camera Position');
cameraFolder.add(cameraParams, 'cameraX', -50, 50).onChange(updateCameraPosition);
cameraFolder.add(cameraParams, 'cameraY', -50, 50).onChange(updateCameraPosition);
cameraFolder.add(cameraParams, 'cameraZ', 1, 100).onChange(updateCameraPosition);
cameraFolder.add(cameraParams, 'fov', 10, 150).onChange(updateCameraPosition);
cameraFolder.open();

// Create object rotation folder in the GUI
const rotationFolder = gui.addFolder('Object Rotation');
rotationFolder.add(rotationParams, 'rotateX', 0, Math.PI * 2).onChange(updateRotation);
rotationFolder.add(rotationParams, 'rotateY', 0, Math.PI * 2).onChange(updateRotation);
rotationFolder.add(rotationParams, 'rotateZ', 0, Math.PI * 2).onChange(updateRotation);
rotationFolder.open();

// Update lighting based on GUI sliders
function updateLighting() {
  ambientLight.intensity = lightParams.ambientIntensity;
  directionalLight.intensity = lightParams.directionalIntensity;
  directionalLight.position.set(lightParams.directionalX, lightParams.directionalY, lightParams.directionalZ);
}

// Update camera position and zoom based on GUI sliders
function updateCameraPosition() {
  camera.position.set(cameraParams.cameraX, cameraParams.cameraY, cameraParams.cameraZ);
  camera.fov = cameraParams.fov;
  camera.updateProjectionMatrix();
}

// Update object rotation based on GUI sliders
function updateRotation() {
  if (shoe) {
    shoe.rotation.x = rotationParams.rotateX;
    shoe.rotation.y = rotationParams.rotateY;
    shoe.rotation.z = rotationParams.rotateZ;
  }
}

// Handle the selection of shoe parts and mark the active button
let activeButton = null; // Keep track of the currently active button
let selectedPart = 'laces'; // Default selected part

// Function to update the active button style
function updateActiveButton(buttonId) {
  if (activeButton) {
    activeButton.classList.remove('active');
  }
  activeButton = document.getElementById(buttonId);
  activeButton.classList.add('active');
}

// Update the title based on the selected part// De beschikbare onderdelen die aangepast kunnen worden
const parts = [
  'laces',          // Laces
  'outside_1',      // Outside part 1
  'outside_2',      // Outside part 2
  'outside_3',      // Outside part 3
  'meshes3_1',      // Meshes part 1
  'sole_top',       // Sole top
  'inside',         // Inside of the shoe
];



// Function om de geselecteerde deel aan te passen in de GUI
function updateTitle() {
  document.getElementById('selected-part-title').innerText = `Adjust ${selectedPart.charAt(0).toUpperCase() + selectedPart.slice(1)} Color`;
}

// Knoppen voor het selecteren van onderdelen
document.getElementById('laces-btn').addEventListener('click', () => { 
  selectedPart = 'laces'; 
  updateTitle();
  updateActiveButton('laces-btn');
});

document.getElementById('outside_1-btn').addEventListener('click', () => { 
  selectedPart = 'outside_1'; 
  updateTitle();
  updateActiveButton('outside_1-btn');
});

document.getElementById('outside_2-btn').addEventListener('click', () => { 
  selectedPart = 'outside_2'; 
  updateTitle();
  updateActiveButton('outside_2-btn');
});

document.getElementById('outside_3-btn').addEventListener('click', () => { 
  selectedPart = 'outside_3'; 
  updateTitle();
  updateActiveButton('outside_3-btn');
});

document.getElementById('meshes3_1-btn').addEventListener('click', () => { 
  selectedPart = 'meshes3_1'; 
  updateTitle();
  updateActiveButton('meshes3_1-btn');
});

document.getElementById('sole_top-btn').addEventListener('click', () => { 
  selectedPart = 'sole_top'; 
  updateTitle();
  updateActiveButton('sole_top-btn');
});

document.getElementById('inside-btn').addEventListener('click', () => { 
  selectedPart = 'inside'; 
  updateTitle();
  updateActiveButton('inside-btn');
});

// Animation loop
function animate() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}



// Start animation loop
animate();

// Handle color change
const colorButtons = document.querySelectorAll('.color-button');
colorButtons.forEach(button => {
  button.addEventListener('click', (event) => {
    const selectedColor = event.target.closest('button').getAttribute('data-color'); // Verkrijg de geselecteerde kleur
    console.log(`Selected color: ${selectedColor}`);

    // Zet de kleur op het geselecteerde onderdeel van de schoen
    if (shoe) {
      shoe.traverse((child) => {
        if (child.isMesh) {
          // Loop door alle delen en pas de kleur toe op het geselecteerde deel
          parts.forEach(part => {
            if (selectedPart === part && child.name === part) {
              child.material.color.set(selectedColor); // Pas de kleur toe
            }
          });
        }
      });
    }
  });
});


