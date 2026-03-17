import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { gsap } from 'gsap';

// SCENE SETUP 

const canvas = document.querySelector('#scene');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// CONTROLS 

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI / 2;
controls.enablePan = false;
controls.enableZoom = true;
controls.rotateSpeed = 0.6;

// LIGHTS 

scene.add(new THREE.AmbientLight(0xffffff, 0.8));

const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

// MODEL LOADING 

const loader = new GLTFLoader();
const clock = new THREE.Clock();

let monitorMesh = null;
let mixer = null;
let interactionEnabled = true;

// Saved after auto-framing so logoutToScene() can restore them.
const initialCameraPosition = new THREE.Vector3();
const initialControlsTarget = new THREE.Vector3();

loader.load(
  './assets/computer.glb',
  (gltf) => {
    scene.add(gltf.scene);

    // Auto-frame the model
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    gltf.scene.position.sub(center);

    // Rotate the model so the screen faces the camera (front view).
    // Adjust the angle below if needed: try Math.PI or -Math.PI / 2 if the
    // screen still appears on the wrong side after this initial 90° turn.
    gltf.scene.rotation.y = -Math.PI / 2;

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    const cameraZ = Math.abs(maxDim / Math.sin(fov / 2)) * 0.8;

    camera.position.set(0, size.y * 0.4, cameraZ);
    camera.lookAt(0, 0, 0);

    controls.minDistance = cameraZ * 0.6;
    controls.maxDistance = cameraZ * 1.8;
    controls.target.set(0, 0, 0);
    controls.update();

    initialCameraPosition.copy(camera.position);
    initialControlsTarget.copy(controls.target);

    // Grab monitor mesh for raycasting
    monitorMesh = gltf.scene.getObjectByName('Monitor');
    if (!monitorMesh) {
      console.warn('Monitor mesh not found in GLB.');
    }

    // Play all animations on loop
    if (gltf.animations?.length) {
      mixer = new THREE.AnimationMixer(gltf.scene);
      gltf.animations.forEach((clip) => {
        mixer.clipAction(clip).play();
      });
    }
  },
  undefined,
  (err) => console.error('GLB load error:', err)
);

// RAYCASTER 

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (e) => {
  if (!monitorMesh || !interactionEnabled) return;

  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  if (raycaster.intersectObject(monitorMesh, true).length > 0) {
    enterScreen();
  }
});

// CAMERA ANIMATION 

function enterScreen() {
  interactionEnabled = false;
  controls.enabled = false;

  const worldPos = new THREE.Vector3();
  monitorMesh.getWorldPosition(worldPos);

  const biosOverlay = document.getElementById('biosOverlay');
  const biosBar = document.getElementById('biosBar');

  gsap.to(camera.position, {
    x: worldPos.x,
    y: worldPos.y + 0.2,
    z: worldPos.z + 0.5,
    duration: 1.5,
    ease: 'power2.inOut',
    onUpdate: () => camera.lookAt(worldPos),
    onComplete: () => {
      biosOverlay.classList.remove('hidden');
      biosBar.style.width = '0%';

      gsap.to(biosBar, {
        width: '100%',
        duration: 2.5,
        ease: 'linear',
        onComplete: () => {
          biosOverlay.classList.add('hidden');
          document.querySelector('#desktop').classList.remove('hidden');
        },
      });
    },
  });
}

// Exposed globally so the desktop "Log Out" button can call it.
window.logoutToScene = function () {
  document.getElementById('desktop').classList.add('hidden');
  controls.enabled = false;

  const animatedTarget = controls.target.clone();

  gsap.to(camera.position, {
    x: initialCameraPosition.x,
    y: initialCameraPosition.y,
    z: initialCameraPosition.z,
    duration: 1.5,
    ease: 'power2.inOut',
  });

  gsap.to(animatedTarget, {
    x: initialControlsTarget.x,
    y: initialControlsTarget.y,
    z: initialControlsTarget.z,
    duration: 1.5,
    ease: 'power2.inOut',
    onUpdate: () => {
      controls.target.copy(animatedTarget);
      controls.update();
    },
    onComplete: () => {
      controls.enabled = true;
      interactionEnabled = true;
    },
  });
};

// RENDER LOOP

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  if (mixer) mixer.update(delta);
  if (controls.enabled) controls.update();
  renderer.render(scene, camera);
}
animate();

// RESIZE

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});