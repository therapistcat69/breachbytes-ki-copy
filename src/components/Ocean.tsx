'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';

const Ocean = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  
  // Ref to store the state of all keyboard inputs
  const controls = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    turnLeft: false,
    turnRight: false,
  });

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) {
      return;
    }

    // --- Scene, Camera, Renderer, Ocean, and Sky Setup (Unchanged) ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      1,
      20000
    );
    camera.position.set(30, 20, 100);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    currentMount.appendChild(renderer.domElement);
    
    const sun = new THREE.Vector3();
    const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
    const water = new Water(waterGeometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: new THREE.TextureLoader().load('/waternormals.jpg', (texture) => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      }),
      alpha: 1.0,
      sunDirection: new THREE.Vector3(),
      sunColor: 0xffa500,
      waterColor: 0x001e0f,
      distortionScale: 3.7,
      fog: scene.fog !== undefined,
    });
    water.rotation.x = -Math.PI / 2;
    scene.add(water);

    const sky = new Sky();
    sky.scale.setScalar(10000);
    scene.add(sky);
    
    const skyUniforms = sky.material.uniforms;
    skyUniforms['turbidity'].value = 20;
    skyUniforms['rayleigh'].value = 1;
    skyUniforms['mieCoefficient'].value = 0.002;
    skyUniforms['mieDirectionalG'].value = 0.8;
    
    const parameters = { elevation: 1, azimuth: 180 };
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    let renderTarget: THREE.WebGLRenderTarget;

    function updateSun() {
      const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
      const theta = THREE.MathUtils.degToRad(parameters.azimuth);
      sun.setFromSphericalCoords(1, phi, theta);
      sky.material.uniforms['sunPosition'].value.copy(sun);
      water.material.uniforms['sunDirection'].value.copy(sun).normalize();
      if (renderTarget) renderTarget.dispose();
      renderTarget = pmremGenerator.fromScene(sky);
      scene.environment = renderTarget.texture;
    }
    updateSun();

    const light = new THREE.HemisphereLight(0xffa500, 0x003954, 0.5);
    scene.add(light);
    
    // --- Keyboard Event Listeners for Game Controls ---
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key.toLowerCase()) {
        case 'w': controls.current.forward = true; break;
        case 's': controls.current.backward = true; break;
        case 'a': controls.current.left = true; break;
        case 'd': controls.current.right = true; break;
        case 'arrowleft': controls.current.turnLeft = true; break;
        case 'arrowright': controls.current.turnRight = true; break;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      switch (event.key.toLowerCase()) {
        case 'w': controls.current.forward = false; break;
        case 's': controls.current.backward = false; break;
        case 'a': controls.current.left = false; break;
        case 'd': controls.current.right = false; break;
        case 'arrowleft': controls.current.turnLeft = false; break;
        case 'arrowright': controls.current.turnRight = false; break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // --- Animation loop with corrected game movement logic ---
    const clock = new THREE.Clock();
    const moveDirection = new THREE.Vector3();
    const velocity = new THREE.Vector3();

    const animate = () => {
      requestAnimationFrame(animate);
      
      const deltaTime = clock.getDelta();
      const moveSpeed = 60.0;
      const turnSpeed = 1.5;

      // Reset velocity vector
      velocity.set(0, 0, 0);

      // Get the direction the camera is facing on the horizontal plane
      camera.getWorldDirection(moveDirection);
      
      // === MOVEMENT LOGIC FIX ===
      if (controls.current.forward) velocity.add(moveDirection);
      if (controls.current.backward) velocity.sub(moveDirection);
      
      // Calculate the strafe direction (90 degrees to the right of the look direction)
      const strafeDirection = new THREE.Vector3().crossVectors(camera.up, moveDirection);
      
      if (controls.current.left) velocity.sub(strafeDirection);
      if (controls.current.right) velocity.add(strafeDirection);

      // Apply movement to the camera's position
      camera.position.addScaledVector(velocity, moveSpeed * deltaTime);

      // Keep camera at a fixed height
      camera.position.y = 20;

      // Apply rotation based on arrow keys
      if (controls.current.turnLeft) camera.rotation.y += turnSpeed * deltaTime;
      if (controls.current.turnRight) camera.rotation.y -= turnSpeed * deltaTime;

      water.material.uniforms['time'].value += 1.0 / 60.0;
      renderer.render(scene, camera);
    };
    animate();

    const onWindowResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onWindowResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', onWindowResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (currentMount.contains(renderer.domElement)) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      if (renderTarget) renderTarget.dispose();
    };
  }, []);
  
  // === CURSOR FIX ===
  // Removed cursor: 'none' from the style
  return <div ref={mountRef} style={{ width: '100%', height: '100vh' }} />;
};

export default Ocean;