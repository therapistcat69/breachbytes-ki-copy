'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Water } from 'three/examples/jsm/objects/Water.js';
import SkyManager from './SkyManager'; // Import the new component

const Ocean = ({ onLoaded }: { onLoaded: () => void }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // State to hold the core three.js objects to pass to children
  const [threeObjects, setThreeObjects] = useState<{
    scene: THREE.Scene | null;
    water: Water | null;
  }>({ scene: null, water: null });

  // Ref to store keyboard input state
  const controls = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    turnLeft: false, 
    turnRight: false,
  });

  // Main useEffect for scene, camera, renderer, and water setup
  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // --- Basic Scene Setup ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 20000);
    camera.position.set(30, 20, 100);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    currentMount.appendChild(renderer.domElement);
    
    // --- Water ---
    const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
    const water = new Water(waterGeometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: new THREE.TextureLoader().load('/waternormals.jpg', (texture) => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      }),
      alpha: 1.0,
      sunDirection: new THREE.Vector3(),
      sunColor: 0xffffff,
      waterColor: 0x005a9c, 
      distortionScale: 3.7,
      fog: scene.fog !== undefined,
    });
    water.rotation.x = -Math.PI / 2;
    scene.add(water);

    // Set state with created objects
    setThreeObjects({ scene, water });

    // --- Event Listeners ---
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key.toLowerCase()) {
        case 'w': controls.current.forward = true; break;
        case 's': controls.current.backward = true; break;
        case 'a': controls.current.right = true; break;
        case 'd': controls.current.left = true; break;
        case 'arrowleft': controls.current.turnLeft = true; break;
        case 'arrowright': controls.current.turnRight = true; break;
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      switch (event.key.toLowerCase()) {
        case 'w': controls.current.forward = false; break;
        case 's': controls.current.backward = false; break;
        case 'a': controls.current.right = false; break;
        case 'd': controls.current.left = false; break;
        case 'arrowleft': controls.current.turnLeft = false; break;
        case 'arrowright': controls.current.turnRight = false; break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // --- Animation Loop ---
    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      const deltaTime = clock.getDelta();
      const moveSpeed = 60.0;
      const turnSpeed = 1.5;

      const moveDirection = new THREE.Vector3();
      const velocity = new THREE.Vector3();
      camera.getWorldDirection(moveDirection);
      if (controls.current.forward) velocity.add(moveDirection);
      if (controls.current.backward) velocity.sub(moveDirection);
      const strafeDirection = new THREE.Vector3().crossVectors(camera.up, moveDirection);
      if (controls.current.left) velocity.sub(strafeDirection);
      if (controls.current.right) velocity.add(strafeDirection);
      camera.position.addScaledVector(velocity, moveSpeed * deltaTime);
      camera.position.y = 20;
      if (controls.current.turnLeft) camera.rotation.y += turnSpeed * deltaTime;
      if (controls.current.turnRight) camera.rotation.y -= turnSpeed * deltaTime;

      water.material.uniforms['time'].value += 3.0 / 60.0;
      renderer.render(scene, camera);
    };
    animate();
    onLoaded();
    
    const onWindowResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onWindowResize);

    // --- Cleanup ---
    return () => {
      window.removeEventListener('resize', onWindowResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (currentMount && currentMount.contains(renderer.domElement)) {
        currentMount.removeChild(renderer.domElement);
      }
      waterGeometry.dispose();
      (water.material as THREE.Material).dispose();
      renderer.dispose();
    };
  }, []);
  
  return (
    <div ref={mountRef} style={{ width: '100%', height: '100vh', cursor: 'crosshair' }}>
      {threeObjects.scene && threeObjects.water && (
        <SkyManager scene={threeObjects.scene} water={threeObjects.water} />
      )}
    </div>
  );
};

export default Ocean;