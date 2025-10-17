'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';

type WeatherState = 'Morning' | 'Evening' | 'Night';

interface SkyManagerProps {
  scene: THREE.Scene | null;
  water: Water | null;
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const clamp = (x: number, min: number, max: number): number =>
  Math.min(Math.max(x, min), max);

const getStateForCurrentTime = (): WeatherState => {
  const hour = new Date().getHours();
  if (hour >= 8 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 18) return 'Evening';
  return 'Night';
};

const SkyManager = ({ scene, water }: SkyManagerProps) => {
  const skyRef = useRef<Sky | null>(null);
  const sunRef = useRef<THREE.Vector3 | null>(null);
  const starsRef = useRef<THREE.Points | null>(null);
  const moonRef = useRef<THREE.Sprite | null>(null);
  const sunMeshRef = useRef<THREE.Mesh | null>(null);

  const [activeState, setActiveState] = useState<WeatherState>('Morning');

  useEffect(() => {
    if (!scene) return;

    // Initialize sun position vector
    const sun = new THREE.Vector3();
    sunRef.current = sun;

    // Add procedural sky
    const sky = new Sky();
    sky.scale.setScalar(10000);
    scene.add(sky);
    skyRef.current = sky;

    // Add ambient light for overall scene illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    // Create visible sun as a glowing sphere
    const sunGeometry = new THREE.SphereGeometry(200, 32, 32);
    const sunMaterial = new THREE.MeshStandardMaterial({
      color: 0xffdd66,
      emissive: 0xffaa33,
      emissiveIntensity: 1.5,
    });
    const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sunMesh);
    sunMeshRef.current = sunMesh;

    // Load and add moon sprite
    const loader = new THREE.TextureLoader();
    const moonTex = loader.load('/textures/moon.png');
    const moonMat = new THREE.SpriteMaterial({
      map: moonTex,
      transparent: true,
      depthWrite: false,
    });
    const moon = new THREE.Sprite(moonMat);
    moon.visible = false;
    moon.scale.set(500, 500, 1);
    scene.add(moon);
    moonRef.current = moon;

    // Generate a few stars (reduced count for sparsity)
    const starsCount = 100;
    const starsGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount; i++) {
      const i3 = i * 3;
      const v = new THREE.Vector3();
      v.setFromSphericalCoords(
        8000 + Math.random() * 4000, // Far away placement
        Math.acos(Math.random() * 2 - 1),
        2 * Math.PI * Math.random()
      );
      positions[i3] = v.x;
      positions[i3 + 1] = v.y;
      positions[i3 + 2] = v.z;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starsMat = new THREE.PointsMaterial({
      size: 1.5,
      color: 0xffffff,
      transparent: true,
    });
    const stars = new THREE.Points(starsGeo, starsMat);
    stars.visible = false;
    scene.add(stars);
    starsRef.current = stars;

    // Cleanup function
    return () => {
      scene.remove(sky, moon, stars, sunMesh, ambientLight);
      starsGeo.dispose();
      starsMat.dispose();
      moonMat.dispose();
      sunGeometry.dispose();
      sunMaterial.dispose();
      (sky.material as THREE.Material).dispose();
    };
  }, [scene]);

  // Update active state based on current time every minute
  useEffect(() => {
    const updateTime = () => setActiveState(getStateForCurrentTime());
    updateTime();
    const id = setInterval(updateTime, 60000);
    return () => clearInterval(id);
  }, []);

  // Main animation loop for sky updates
  useEffect(() => {
    if (!scene || !skyRef.current || !sunRef.current || !water) return;

    const sky = skyRef.current;
    const sun = sunRef.current;
    const stars = starsRef.current;
    const moon = moonRef.current;
    const sunMesh = sunMeshRef.current;
    const uniforms = sky.material.uniforms;

    const updateSky = () => {
      const now = new Date();
      const hour = now.getHours() + now.getMinutes() / 60;

      let elevation = 20;
      let sunColor = new THREE.Color(0xffffff);
      let skyColor = new THREE.Color(0x87ceeb);
      let showStars = false;
      let showMoon = false;
      let opacity = 0;

      // --- MORNING (8 AM - 12 PM): Bright sunshine with sun high in the sky ---
      if (hour >= 8 && hour < 12) {
        const t = (hour - 8) / (12 - 8); // Progress from 8 to 12
        elevation = lerp(50, 80, t); // Sun rises to top of sky
        sunColor.set(0xffffff); // Bright white sun
        skyColor.set(0x87ceeb); // Clear blue sky
        uniforms['turbidity'].value = 8;
        uniforms['rayleigh'].value = 3;

        if (sunMesh) {
          const mat = sunMesh.material as THREE.MeshStandardMaterial;
          mat.color.set(0xffffff);
          mat.emissive.set(0xffffcc);
          mat.emissiveIntensity = 2.0; // Strong glow for bright sunshine
          sunMesh.visible = true;
        }
      }

      // --- EVENING (12 PM - 6 PM): Complete orangish-red sky with gradual sunset ---
      else if (hour >= 12 && hour < 18) {
        const t = clamp((hour - 12) / (18 - 12), 0, 1); // Progress from 12 to 18
        elevation = lerp(80, -10, t); // Sun sets gradually from high to horizon

        const c = new THREE.Color(0xffd080).lerp(new THREE.Color(0xff3300), t);
        sunColor.copy(c);

        if (sunMesh) {
          const mat = sunMesh.material as THREE.MeshStandardMaterial;
          mat.color.copy(c);
          mat.emissive.copy(new THREE.Color(0xff6600).lerp(new THREE.Color(0xff2200), t));
          mat.emissiveIntensity = lerp(2.0, 3.0, t); // Intensify glow as it sets
          sunMesh.visible = true;
        }

        // Full orangish-red sky: Vivid, saturated color dominating the entire scene
        const vividOrange = new THREE.Color(0xff4500); // Bright orange-red base
        const deepRedOrange = new THREE.Color(0xcc2200); // Deeper red for late evening
        const skyEvening = vividOrange.lerp(deepRedOrange, t * 0.8); // Bias to keep it bright and saturated
        skyColor.copy(skyEvening);

        // Enhance red atmospheric scattering for complete orangish-red effect
        uniforms['turbidity'].value = 35; // High for red hues
        uniforms['rayleigh'].value = 0.05; // Low for less blue scatter
        if (uniforms['mieCoefficient']) uniforms['mieCoefficient'].value = 0.005; // Fine-tune haze
        if (uniforms['mieDirectionalG']) uniforms['mieDirectionalG'].value = 0.8;
      }

      // --- NIGHT (6 PM - 8 AM): Dark sky with sparse stars and moon ---
      else {
        elevation = -10; // Sun below horizon
        sunColor.set(0x000000);
        skyColor.set(0x000011); // Very dark blue-black for subtle depth
        showStars = true;
        showMoon = true;
        opacity = 1;
        uniforms['turbidity'].value = 2;
        uniforms['rayleigh'].value = 0.01;

        if (sunMesh) sunMesh.visible = false;
      }

      // Update sun position and uniforms
      const phi = THREE.MathUtils.degToRad(90 - elevation);
      const theta = THREE.MathUtils.degToRad(180);
      sun.setFromSphericalCoords(1, phi, theta);
      uniforms['sunPosition'].value.copy(sun);
      water.material.uniforms['sunDirection'].value.copy(sun).normalize();
      water.material.uniforms['sunColor'].value.copy(sunColor);

      // Position the visible sun mesh
      if (sunMesh) {
        const sunDistance = 7000;
        sunMesh.position.set(
          Math.cos(theta) * sunDistance,
          Math.sin(phi) * sunDistance,
          0
        );
      }

      // Set scene background color
      scene.background = skyColor;

      // Update stars visibility and opacity
      if (stars) {
        stars.visible = showStars;
        (stars.material as THREE.PointsMaterial).opacity = opacity;
      }

      // Update moon visibility, opacity, and position (simple orbital path)
      if (moon) {
        moon.visible = showMoon;
        (moon.material as THREE.SpriteMaterial).opacity = opacity;
        const moonAngle = ((now.getHours() % 24) / 24) * Math.PI * 2 - Math.PI / 2;
        const moonDistance = 5000;
        const moonHeight = 2200;
        moon.position.set(
          Math.cos(moonAngle) * moonDistance,
          moonHeight + Math.sin(moonAngle) * 800,
          -4000
        );
      }

      requestAnimationFrame(updateSky);
    };

    updateSky();
  }, [scene, water]);

  return null;
};

export default SkyManager;

