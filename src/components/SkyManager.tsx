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

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (x: number, min: number, max: number) => Math.min(Math.max(x, min), max);

const getStateForCurrentTime = (): WeatherState => {
  const hour = new Date().getHours();
  if (hour >= 8 && hour < 14) return 'Morning';
  if (hour >= 14 && hour < 21) return 'Evening';
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

    const sun = new THREE.Vector3();
    sunRef.current = sun;

    const sky = new Sky();
    sky.scale.setScalar(10000);
    scene.add(sky);
    skyRef.current = sky;

    // --- Add Ambient Light (for emissive sun glow)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    // --- Visible Sun Sphere (Standard Material supports emissive) ---
    const sunGeometry = new THREE.SphereGeometry(200, 32, 32);
    const sunMaterial = new THREE.MeshStandardMaterial({
      color: 0xffdd66,
      emissive: 0xffaa33,
      emissiveIntensity: 1.5,
    });
    const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sunMesh);
    sunMeshRef.current = sunMesh;

    // --- Moon ---
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

    // --- Stars ---
    const starsCount = 300;
    const starsGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount; i++) {
      const i3 = i * 3;
      const v = new THREE.Vector3();
      v.setFromSphericalCoords(
        8000 + Math.random() * 4000,
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

  // --- Watch time ---
  useEffect(() => {
    const updateTime = () => setActiveState(getStateForCurrentTime());
    updateTime();
    const id = setInterval(updateTime, 60000);
    return () => clearInterval(id);
  }, []);

  // --- Animation Loop ---
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

      // --- MORNING ---
      if (hour >= 8 && hour < 14) {
        const t = (hour - 8) / (14 - 8);
        elevation = lerp(15, 40, t);
        sunColor.set(0xffffff);
        skyColor.set(0x87ceeb);
        uniforms['turbidity'].value = 8;
        uniforms['rayleigh'].value = 3;

        if (sunMesh) {
          const mat = sunMesh.material as THREE.MeshStandardMaterial;
          mat.color.set(0xfff5d6);
          mat.emissive.set(0xfff5b0);
          mat.emissiveIntensity = 1.5;
          sunMesh.visible = true;
        }
      }

      // --- EVENING (Visible Sunset) ---
      else if (hour >= 14 && hour <= 21) {
        const t = clamp((hour - 14) / (21 - 14), 0, 1);
        elevation = lerp(35, -3, t);

        const c = new THREE.Color(0xffd080).lerp(new THREE.Color(0xff3300), t);
        sunColor.copy(c);

        if (sunMesh) {
          const mat = sunMesh.material as THREE.MeshStandardMaterial;
          mat.color.copy(c);
          mat.emissive.copy(new THREE.Color(0xff6600).lerp(new THREE.Color(0xff2200), t));
          mat.emissiveIntensity = lerp(1.5, 3.0, 1 - t);
          sunMesh.visible = true;
        }

        // Strong bright orangish-red full sky that dominates the scene
        // Use vivid high-value orange-red and blend very little to darker tones so sky remains bright
        const bright1 = new THREE.Color(0xff4500); // vivid orange-red
        const bright2 = new THREE.Color(0xff3300); // intense red-orange
        // bias t so early evening is already vivid and late evening stays saturated
        const biasT = Math.min(1, t * 0.9 + 0.25);
        const skyEvening = bright1.clone().lerp(bright2, biasT);
        skyColor.copy(skyEvening);

        // Increase atmospheric scattering to enhance saturation across the sky
        uniforms['turbidity'].value = 30;
        uniforms['rayleigh'].value = 0.1;
        if (uniforms['mieCoefficient']) uniforms['mieCoefficient'].value = 0.01;
      }

      // --- NIGHT ---
      else {
        elevation = -5;
        sunColor.set(0x000000);
        skyColor.set(0x000000);
        showStars = true;
        showMoon = true;
        opacity = 1;
        uniforms['turbidity'].value = 2;
        uniforms['rayleigh'].value = 0.01;
        if (sunMesh) sunMesh.visible = false;
      }

      // --- Apply Sun Movement ---
      const phi = THREE.MathUtils.degToRad(90 - elevation);
      const theta = THREE.MathUtils.degToRad(180);
      sun.setFromSphericalCoords(1, phi, theta);
      uniforms['sunPosition'].value.copy(sun);
      water.material.uniforms['sunDirection'].value.copy(sun).normalize();
      water.material.uniforms['sunColor'].value.copy(sunColor);

      // Position visible sun mesh
      if (sunMesh) {
        const sunDistance = 7000;
        sunMesh.position.set(Math.cos(theta) * sunDistance, Math.sin(phi) * sunDistance, 0);
      }

      // Background color
      scene.background = skyColor;

      // Stars
      if (stars) {
        stars.visible = showStars;
        (stars.material as THREE.PointsMaterial).opacity = opacity;
      }

      // Moon
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

