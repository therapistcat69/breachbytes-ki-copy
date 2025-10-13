
'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';

// Define types for weather states
type WeatherState = 'day' | 'sunset' | 'night';

const Ocean = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  
  // State to manage the current weather condition
  const [weather, setWeather] = useState<WeatherState>('day');
  
  // Refs to hold three.js objects
  const moonRef = useRef<THREE.Sprite>();
  const moonHaloRef = useRef<THREE.Sprite>();
  const starsRef = useRef<THREE.Points>();
  const skyRef = useRef<Sky>();
  const sunRef = useRef<THREE.Vector3>();
  const waterRef = useRef<Water>();

  // Ref to store keyboard input state
  const controls = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    turnLeft: false, 
    turnRight: false,
  });

  // Main useEffect for scene setup
  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // --- Basic Scene Setup ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 20000);
    camera.position.set(30, 20, 100);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    currentMount.appendChild(renderer.domElement);
    
    // --- Sun, Water, and Sky ---
    const sun = new THREE.Vector3();
    sunRef.current = sun;

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
    waterRef.current = water;

    const sky = new Sky();
    sky.scale.setScalar(10000);
    scene.add(sky);
    skyRef.current = sky;
    
    // --- Moon Setup (Kept in code but always hidden) ---
    const loader = new THREE.TextureLoader();
    const moonTexture = loader.load('/textures/moon.png');
    const moonMaterial = new THREE.SpriteMaterial({ map: moonTexture, transparent: true, depthWrite: false });
    const moon = new THREE.Sprite(moonMaterial);
    moon.visible = false;
    scene.add(moon);
    moonRef.current = moon;

    const haloMaterial = new THREE.SpriteMaterial({ map: moonTexture, color: 0xffffff, transparent: true, opacity: 0.12, depthWrite: false });
    const moonHalo = new THREE.Sprite(haloMaterial);
    moonHalo.visible = false;
    scene.add(moonHalo);
    moonHaloRef.current = moonHalo;

    // --- Stars Particle System ---
    const starsCount = 800; // **REDUCED STAR COUNT**
    const starsGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starsCount * 3);
    const starColors = new Float32Array(starsCount * 3);
    const starSizes = new Float32Array(starsCount);
    const color = new THREE.Color();

    for (let i = 0; i < starsCount; i++) {
      const i3 = i * 3;
      const vertex = new THREE.Vector3();
      vertex.setFromSphericalCoords(
        6000 + Math.random() * 1000,
        Math.acos(2 * Math.random() - 1),
        2 * Math.PI * Math.random()
      );
      starPositions[i3] = vertex.x;
      starPositions[i3 + 1] = vertex.y;
      starPositions[i3 + 2] = vertex.z;

      starSizes[i] = 0.5 + Math.random() * 2.5;

      const intensity = Math.random() * 0.7 + 0.3;
      const tint = Math.random() < 0.1 ? 0xccccff : (Math.random() < 0.05 ? 0xffcccc : 0xffffff);
      color.set(tint).multiplyScalar(intensity);
      starColors[i3] = color.r;
      starColors[i3 + 1] = color.g;
      starColors[i3 + 2] = color.b;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starsGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    starsGeo.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));

    const starsMaterial = new THREE.PointsMaterial({
      size: 1.0,
      sizeAttenuation: false,
      vertexColors: true,
      transparent: true,
    });
    const stars = new THREE.Points(starsGeo, starsMaterial);
    stars.visible = false;
    scene.add(stars);
    starsRef.current = stars;

    // --- Event Listeners ---
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
    
    // --- Animation Loop ---
    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      const deltaTime = clock.getDelta();
      const time = clock.getElapsedTime();
      const moveSpeed = 60.0;
      const turnSpeed = 1.5;

      const moveDirection = new THREE.Vector3();
      const velocity = new THREE.Vector3();
      velocity.set(0, 0, 0);
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

      if (waterRef.current) {
        waterRef.current.material.uniforms['time'].value += 1.0 / 60.0;
      }

      if (starsRef.current && starsRef.current.visible) {
        (starsRef.current.material as THREE.PointsMaterial).opacity = 0.8 + Math.sin(time * 2) * 0.1;
      }

      renderer.render(scene, camera);
    };
    animate();

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
      starsGeo.dispose();
      starsMaterial.dispose();
      moonMaterial.map?.dispose();
      moonMaterial.dispose();
      (moonHaloRef.current?.material as THREE.Material | undefined)?.dispose();
      waterGeometry.dispose();
      (water.material as THREE.Material).dispose();
      (sky.material as THREE.Material).dispose();
      renderer.dispose();
    };
  }, []);

  // Effect for handling visual changes based on weather state
  useEffect(() => {
    const weatherConfig = {
      day: {
        turbidity: 5,
        rayleigh: 1.0,
        mieCoefficient: 0.003,
        mieDirectionalG: 0.9,
        elevation: 15,
        azimuth: 180,
      },
      sunset: {
        turbidity: 20,         // **BRIGHTER SUNSET**
        rayleigh: 4,           // **BRIGHTER SUNSET**
        mieCoefficient: 0.005,
        mieDirectionalG: 0.95, // **BRIGHTER SUNSET**
        elevation: 2,
        azimuth: 180,
      },
      night: {
        turbidity: 0,
        rayleigh: 0,
        mieCoefficient: 0,
        mieDirectionalG: 0,
        elevation: -90,
        azimuth: 180,
      },
    };

    const updateSceneForWeather = (state: WeatherState) => {
      const sky = skyRef.current;
      const water = waterRef.current;
      const sun = sunRef.current;
      const moon = moonRef.current;
      const moonHalo = moonHaloRef.current;
      const stars = starsRef.current;

      if (!sky || !water || !sun || !moon || !moonHalo || !stars) return;
      
      const params = weatherConfig[state];
      const skyUniforms = sky.material.uniforms;
      skyUniforms['turbidity'].value = params.turbidity;
      skyUniforms['rayleigh'].value = params.rayleigh;
      skyUniforms['mieCoefficient'].value = params.mieCoefficient;
      skyUniforms['mieDirectionalG'].value = params.mieDirectionalG;

      const phi = THREE.MathUtils.degToRad(90 - params.elevation);
      const theta = THREE.MathUtils.degToRad(params.azimuth);
      sun.setFromSphericalCoords(1, phi, theta);
      sky.material.uniforms['sunPosition'].value.copy(sun);
      water.material.uniforms['sunDirection'].value.copy(sun).normalize();

      moon.visible = false;
      moonHalo.visible = false;
      stars.visible = state === 'night';

      if (state === 'day' && water.material.uniforms['sunColor']) {
        water.material.uniforms['sunColor'].value.setHex(0xffffff);
        water.material.uniforms['sunColor'].value.multiplyScalar(2.0);
      }

      if (state === 'sunset' && water.material.uniforms['sunColor']) {
        water.material.uniforms['sunColor'].value.setHex(0xff6a00); // **BRIGHTER ORANGE**
        water.material.uniforms['sunColor'].value.multiplyScalar(2.5); // **INCREASED BRIGHTNESS**
      }

      if (state === 'night' && water.material.uniforms['sunColor']) {
        water.material.uniforms['sunColor'].value.setHex(0x000000);
      }
    };

    updateSceneForWeather(weather);
  }, [weather]);

  // Effect for cycling through weather states
  useEffect(() => {
    const weatherCycle: WeatherState[] = ['day', 'sunset', 'night'];
    let currentIndex = 0;
    
    const intervalId = setInterval(() => {
      currentIndex = (currentIndex + 1) % weatherCycle.length;
      setWeather(weatherCycle[currentIndex]);
    }, 40000); // Cycle every 5 minutes

    return () => clearInterval(intervalId);
  }, []);
  
  return <div ref={mountRef} style={{ width: '100%', height: '100vh', cursor: 'crosshair' }} />;
};

export default Ocean;
