import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Load the 360 texture (used for reflections)
const textureLoader = new THREE.TextureLoader();
const texture360 = textureLoader.load(
  '/Gemini_Generated_Image_6c9m4b6c9m4b6c9m.jpeg',
  () => console.log('Texture loaded successfully'),
  undefined,
  (err) => console.error('Error loading texture:', err)
);

// Create a sphere for the environment (360-degree texture)
const sphereGeometry = new THREE.SphereGeometry(500, 60, 40);
const sphereMaterial = new THREE.MeshBasicMaterial({ map: texture360, side: THREE.BackSide });
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
scene.add(sphere);

// Ambient Light (global illumination)
const ambientLight = new THREE.AmbientLight(0xffffff, 3);
scene.add(ambientLight);

// Directional Light (simulate sunlight)
const directionalLight = new THREE.DirectionalLight(0xffffff, 5);
directionalLight.position.set(10, 10, 10);
scene.add(directionalLight);

// Spotlight for extra lighting
const spotLight = new THREE.SpotLight(0xffffff, 5);
spotLight.position.set(10, 10, 10);
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
spotLight.shadow.camera.far = 1000;
scene.add(spotLight);

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

    // Collect part names of the shoe (for example, laces, sole, etc.)
    collectShoeParts(shoe);
  },
  undefined,
  (error) => {
    console.error('Error loading model:', error);
  }
);

// Function to collect shoe parts and allow them to be customized
function collectShoeParts(shoe) {
  shoe.traverse((child) => {
    if (child.isMesh) {
      console.log('Part found:', child.name);
    }
  });
}

// Raycaster setup
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedMesh = null;

// Store the original color and texture of the selected part
let originalColor = null;
let originalTexture = null;

// Handle mouse click for selecting parts
window.addEventListener('click', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  if (shoe) {
    const intersects = raycaster.intersectObjects(shoe.children, true);
    if (intersects.length > 0) {
      if (selectedMesh) {
        selectedMesh.material.emissive.set(0x000000);
      }
      selectedMesh = intersects[0].object;
      console.log('Selected part:', selectedMesh.name);

      // Update the span with the selected part name
      const partTitleElement = document.getElementById('selected-part-title');
      if (partTitleElement) {
        const spanElement = partTitleElement.querySelector('.specific-part');
        if (spanElement) {
          spanElement.textContent = selectedMesh.name;
        }
      }

      // Store the original color and texture
      originalColor = selectedMesh.material.color.getHex();
      originalTexture = selectedMesh.material.map;

      selectedMesh.material.emissive.set(0x333333);

      // Focus the camera on the selected part
      focusOnPart(selectedMesh);
    }
  }
});

// Function to focus the camera on a part
function focusOnPart(part) {
  if (!part) return;

  const partPosition = new THREE.Vector3();
  part.getWorldPosition(partPosition);

  const targetPosition = new THREE.Vector3(
    partPosition.x + 30,
    partPosition.y + 10,
    partPosition.z + 10
  );

  const duration = 1.5;
  const startTime = performance.now();

  const initialCameraPosition = camera.position.clone();
  const initialCameraTarget = controls.target.clone();

  controls.enabled = false;

  function animateCamera() {
    const elapsedTime = (performance.now() - startTime) / 1000;
    const t = Math.min(elapsedTime / duration, 1);

    camera.position.lerpVectors(initialCameraPosition, targetPosition, t);
    controls.target.lerpVectors(initialCameraTarget, partPosition, t);

    if (t < 1) {
      requestAnimationFrame(animateCamera);
    } else {
      controls.enabled = true;
    }

    controls.update();
  }

  animateCamera();
}

// Function to change the color of the selected part
function changeColor(color) {
  if (selectedMesh) {
    selectedMesh.material.color.set(color);
    selectedMesh.material.needsUpdate = true;
  }
}

// Add event listeners for color buttons
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.color-button').forEach(button => {
    button.addEventListener('click', () => {
      const color = button.getAttribute('data-color');
      changeColor(color);
    });
  });
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
