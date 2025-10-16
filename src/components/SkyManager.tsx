// 'use client';

// import { useEffect, useRef, useState } from 'react';
// import * as THREE from 'three';
// import { Water } from 'three/examples/jsm/objects/Water.js';
// import { Sky } from 'three/examples/jsm/objects/Sky.js';

// type WeatherState = 'sunrise' | 'morning' | 'afternoon' | 'sunset' | 'night';

// interface SkyManagerProps {
//   scene: THREE.Scene | null;
//   water: Water | null;
// }

// // Helper function for linear change of sky
// const lerp = (start: number, end: number, amt: number) => {
//   return (1 - amt) * start + amt * end;
// };

// const SkyManager = ({ scene, water }: SkyManagerProps) => {
//   const weatherConfig = {
//     sunrise: { turbidity: 10, rayleigh: 3, mieCoefficient: 0.005, mieDirectionalG: 0.8, elevation: 2, azimuth: 180, sunColor: 0xffaa00 },
//     morning: { turbidity: 8, rayleigh: 2, mieCoefficient: 0.005, mieDirectionalG: 0.9, elevation: 8, azimuth: 180, sunColor: 0xffffff },
//     afternoon: { turbidity: 5, rayleigh: 1.0, mieCoefficient: 0.003, mieDirectionalG: 0.95, elevation: 35, azimuth: 180, sunColor: 0xffffff },
//     sunset: { turbidity: 22, rayleigh: 15, mieCoefficient: 0.01, mieDirectionalG: 0.7, elevation: 1.5, azimuth: 180, sunColor: 0xd8442e },
//     night: { turbidity: 0, rayleigh: 0, mieCoefficient: 0, mieDirectionalG: 0, elevation: -90, azimuth: 180, sunColor: 0x000000 },
//   };

//   // State and refs for managing transitions of sky
//   const [sourceState, setSourceState] = useState<WeatherState | null>(null);
//   const [targetState, setTargetState] = useState<WeatherState>('afternoon');
//   const transitionProgress = useRef(1);
//   const transitionDuration = 10; // Transition will take 10 seconds
  
//   // Refs to hold three.js objects
//   const skyRef = useRef<Sky | null>(null);
//   const sunRef = useRef<THREE.Vector3 | null>(null);
//   const starsRef = useRef<THREE.Points | null>(null);
//   const moonRef = useRef<THREE.Sprite | null>(null);

//   // Function to determine the state based on the current time
//   const getStateForCurrentTime = (): WeatherState => {
//     const hour = new Date().getHours();
//     if (hour >= 8 && hour < 10) return 'sunrise';
//     if (hour >= 10 && hour < 12) return 'morning';
//     if (hour >= 12 && hour < 14) return 'afternoon';
//     if (hour >= 14 && hour < 16) return 'sunset';
//     return 'night';
//   };

//   // Effect to set up sky, stars, and other related objects
//   useEffect(() => {
//     if (!scene) return;

//     const sun = new THREE.Vector3();
//     sunRef.current = sun;

//     const sky = new Sky();
//     sky.scale.setScalar(10000);
//     scene.add(sky);
//     skyRef.current = sky;
    
//     const loader = new THREE.TextureLoader();
//     const moonTexture = loader.load('/textures/moon.png');
//     const moonMaterial = new THREE.SpriteMaterial({ map: moonTexture, transparent: true, depthWrite: false });
    
//     const moon = new THREE.Sprite(moonMaterial);
//     moon.visible = false;
//     scene.add(moon);
//     moonRef.current = moon;
    
//     const starsCount = 50;
//     const starsGeo = new THREE.BufferGeometry();
//     const starPositions = new Float32Array(starsCount * 3);
//     const starColors = new Float32Array(starsCount * 3);
//     const starSizes = new Float32Array(starsCount);
//     const color = new THREE.Color();

//     for (let i = 0; i < starsCount; i++) {
//       const i3 = i * 3;
//       const vertex = new THREE.Vector3();
//       vertex.setFromSphericalCoords(
//         6000 + Math.random() * 1000,
//         Math.acos(Math.random()),
//         2 * Math.PI * Math.random()
//       );
//       starPositions[i3] = vertex.x;
//       starPositions[i3 + 1] = vertex.y;
//       starPositions[i3 + 2] = vertex.z;
//       starSizes[i] = 0.5 + Math.random() * 2.5;
//       const intensity = Math.random() * 0.7 + 0.3;
//       const tint = Math.random() < 0.1 ? 0xccccff : (Math.random() < 0.05 ? 0xffcccc : 0xffffff);
//       color.set(tint).multiplyScalar(intensity);
//       starColors[i3] = color.r;
//       starColors[i3 + 1] = color.g;
//       starColors[i3 + 2] = color.b;
//     }
//     starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
//     starsGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
//     starsGeo.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));

//     const starsMaterial = new THREE.PointsMaterial({
//       size: 1.0,
//       sizeAttenuation: false,
//       vertexColors: true,
//       transparent: true,
//     });
//     const stars = new THREE.Points(starsGeo, starsMaterial);
//     stars.visible = false;
//     scene.add(stars);
//     starsRef.current = stars;
    
//     return () => {
//       if (sky) scene.remove(sky);
//       if (moon) scene.remove(moon);
//       if (stars) scene.remove(stars);
//       starsGeo.dispose();
//       starsMaterial.dispose();
//       moonMaterial.map?.dispose();
//       moonMaterial.dispose();
//       (sky.material as THREE.Material).dispose();
//     };
//   }, [scene]);

//   // Effect for animating the transition between states
//   useEffect(() => {
//     const sky = skyRef.current;
//     const sun = sunRef.current;
//     const stars = starsRef.current;

//     if (!sky || !sun || !water || !sourceState || !targetState) return;

//     let lastTime = 0;
//     let animationFrameId: number;

//     const animateTransition = (timestamp: number) => {
//       if (lastTime > 0) {
//         const deltaTime = (timestamp - lastTime) / 1000;
//         if (transitionProgress.current < 1) {
//           transitionProgress.current += deltaTime / transitionDuration;
//           transitionProgress.current = Math.min(transitionProgress.current, 1);
//         }

//         const progress = transitionProgress.current;
//         const sourceParams = weatherConfig[sourceState];
//         const targetParams = weatherConfig[targetState];

//         const skyUniforms = sky.material.uniforms;
//         skyUniforms['turbidity'].value = lerp(sourceParams.turbidity, targetParams.turbidity, progress);
//         skyUniforms['rayleigh'].value = lerp(sourceParams.rayleigh, targetParams.rayleigh, progress);
//         skyUniforms['mieCoefficient'].value = lerp(sourceParams.mieCoefficient, targetParams.mieCoefficient, progress);
//         skyUniforms['mieDirectionalG'].value = lerp(sourceParams.mieDirectionalG, targetParams.mieDirectionalG, progress);

//         const elevation = lerp(sourceParams.elevation, targetParams.elevation, progress);
//         const phi = THREE.MathUtils.degToRad(90 - elevation);
//         const theta = THREE.MathUtils.degToRad(180);
//         sun.setFromSphericalCoords(1, phi, theta);
//         sky.material.uniforms['sunPosition'].value.copy(sun);
//         water.material.uniforms['sunDirection'].value.copy(sun).normalize();

//         const sunColor = new THREE.Color().lerpColors(new THREE.Color(sourceParams.sunColor), new THREE.Color(targetParams.sunColor), progress);
//         water.material.uniforms['sunColor'].value.copy(sunColor);

//         if (stars) {
//           stars.visible = targetParams.elevation < 0 || sourceParams.elevation < 0;
//           if (stars.visible) {
//             (stars.material as THREE.PointsMaterial).opacity = Math.min(
//               lerp(sourceParams.elevation < 0 ? 1 : 0, targetParams.elevation < 0 ? 1 : 0, progress),
//               1
//             );
//           }
//         }
//         const moon = moonRef.current;
//         if (moon) {
//             moon.position.set(2000, 2000, -4000);
//             moon.scale.set(400, 400, 1);
//             moon.visible = targetParams.elevation < 0 || sourceParams.elevation < 0;

//             // Fade it in and out along with the stars
//             if (moon.visible) {
//                 const opacity = Math.min(
//                     lerp(sourceParams.elevation < 0 ? 1 : 0, targetParams.elevation < 0 ? 1 : 0, progress),
//                     1
//                 );
//                 moon.material.opacity = opacity;
//             }
//         }
//       }
//       lastTime = timestamp;
//       animationFrameId = requestAnimationFrame(animateTransition);
//     };

//     animateTransition(0);

//     return () => {
//       cancelAnimationFrame(animationFrameId);
//     };
//   }, [sourceState, targetState, water]);

//   // Effect for checking the time and triggering state changes
//   useEffect(() => {
//     const initialState = getStateForCurrentTime();
//     setTargetState(initialState);
//     setSourceState(initialState);
//     transitionProgress.current = 1;

//     const intervalId = setInterval(() => {
//       const newState = getStateForCurrentTime();
//       if (newState !== targetState) {
//         setSourceState(targetState);
//         setTargetState(newState);
//         transitionProgress.current = 0;
//       }
//     }, 60000); 

//     return () => clearInterval(intervalId);
//   }, [targetState]);
'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';

type WeatherState = 'Morning' | 'Evening1' | 'Evening2' | 'Night';

interface SkyManagerProps {
  scene: THREE.Scene | null;
  water: Water | null;
}

const lerp = (start: number, end: number, amt: number) => (1 - amt) * start + amt * end;

// Determine state and a normalized progress inside that state's time window
const getStateForCurrentTime = (): { state: WeatherState; stateProgress: number } => {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const decimalHour = hour + minute / 60;

  // Time windows:
  // Morning: 08:00 - 14:00
  // Evening1: 14:00 - 16:00 (afternoon sun above, sky yellowish-orange, sun gradually coming down)
  // Evening2: 16:00 - 18:00 (sunset, sky orangish-red, sun setting)
  // Night: otherwise (after 18:00, before 08:00)

  if (decimalHour >= 8 && decimalHour < 14) {
    const progress = (decimalHour - 8) / (14 - 8);
    return { state: 'Morning', stateProgress: Math.min(Math.max(progress, 0), 1) };
  }
  if (decimalHour >= 14 && decimalHour < 16) {
    const progress = (decimalHour - 14) / 2; // 0 -> 1 across 14-16
    return { state: 'Evening1', stateProgress: Math.min(Math.max(progress, 0), 1) };
  }
  if (decimalHour >= 16 && decimalHour < 18) {
    const progress = (decimalHour - 16) / 2; // 0 -> 1 across 16-18
    return { state: 'Evening2', stateProgress: Math.min(Math.max(progress, 0), 1) };
  }
  // Night
  // If between 0-8 or >=18
  // Map progress across night optionally, but not required for visuals
  return { state: 'Night', stateProgress: 0 };
};

const SkyManager = ({ scene, water }: SkyManagerProps) => {
  // ---CONFIGURATION UPDATED HERE---
  // Each state includes ranges where appropriate so the component can smoothly move the sun
  const weatherConfig: Record<
    WeatherState,
    {
      turbidity: number;
      rayleigh: number;
      mieCoefficient: number;
      mieDirectionalG: number;
      elevationStart: number; // degrees
      elevationEnd: number; // degrees
      azimuth: number;
      sunColorStart: number;
      sunColorEnd: number;
      isNight: boolean;
    }
  > = {
    Morning: {
      turbidity: 2,
      rayleigh: 1,
      mieCoefficient: 0.003,
      mieDirectionalG: 0.8,
      elevationStart: 45,
      elevationEnd: 25,
      azimuth: 180,
      sunColorStart: 0xfff8e1, // pale warm daylight
      sunColorEnd: 0xfff0b8,
      isNight: false,
    },
    Evening1: {
      // 14:00-16:00: Sun still above, yellowish-orange sky; sun gradually comes down
      turbidity: 12,
      rayleigh: 0.3,
      mieCoefficient: 0.006,
      mieDirectionalG: 0.8,
      elevationStart: 25, // start slightly lower than Morning end
      elevationEnd: 12, // coming down but still above horizon
      azimuth: 180,
      sunColorStart: 0xffe08a, // yellowish-orange start
      sunColorEnd: 0xffb04a, // deeper warm orange by 16:00
      isNight: false,
    },
    Evening2: {
      // 16:00-18:00: Sun setting; sky becomes orangish-red
      turbidity: 30,
      rayleigh: 0.0,
      mieCoefficient: 0.015,
      mieDirectionalG: 0.8,
      elevationStart: 12, // begins where Evening1 ends
      elevationEnd: -4, // goes below horizon by 18:00
      azimuth: 180,
      sunColorStart: 0xff9a4d, // orange
      sunColorEnd: 0xcc2200, // orangish-red at sunset
      isNight: false,
    },
    Night: {
      turbidity: 1,
      rayleigh: 0.01,
      mieCoefficient: 0.0,
      mieDirectionalG: 0.0,
      elevationStart: -5,
      elevationEnd: -10,
      azimuth: 180,
      sunColorStart: 0x000000,
      sunColorEnd: 0x000000,
      isNight: true,
    },
  };

  const [{ state: initialState, stateProgress: initialProgress }] = [getStateForCurrentTime()];

  const [activeState, setActiveState] = useState<WeatherState>(initialState);
  const [sourceState, setSourceState] = useState<WeatherState>(initialState);
  const [targetState, setTargetState] = useState<WeatherState>(initialState);
  const stateProgressRef = useRef<number>(initialProgress);

  const transitionProgress = useRef(0);
  const transitionDuration = 8; // seconds for cross-state transition

  const skyRef = useRef<Sky | null>(null);
  const sunRef = useRef<THREE.Vector3 | null>(null);
  const starsRef = useRef<THREE.Points | null>(null);
  const moonRef = useRef<THREE.Sprite | null>(null);
  const activeStateRef = useRef<WeatherState>(initialState);

  useEffect(() => {
    activeStateRef.current = activeState;
  }, [activeState]);

  useEffect(() => {
    if (!scene) return;

    const sun = new THREE.Vector3();
    sunRef.current = sun;

    const sky = new Sky();
    sky.scale.setScalar(10000);
    scene.add(sky);
    skyRef.current = sky;

    const loader = new THREE.TextureLoader();
    const moonTexture = loader.load('/textures/moon.png');
    const moonMaterial = new THREE.SpriteMaterial({ map: moonTexture, transparent: true, depthWrite: false });

    const moon = new THREE.Sprite(moonMaterial);
    moon.visible = false;
    moon.position.set(2000, 2000, -4000);
    moon.scale.set(500, 500, 1);
    scene.add(moon);
    moonRef.current = moon;

    const starsCount = 100;
    const starsGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starsCount * 3);
    const starColors = new Float32Array(starsCount * 3);
    const starSizes = new Float32Array(starsCount);
    const color = new THREE.Color();

    for (let i = 0; i < starsCount; i++) {
      const i3 = i * 3;
      const vertex = new THREE.Vector3();
      vertex.setFromSphericalCoords(8000 + Math.random() * 4000, Math.acos(Math.random()), 2 * Math.PI * Math.random());
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

    return () => {
      if (sky) scene.remove(sky);
      if (moon) scene.remove(moon);
      if (stars) scene.remove(stars);
      starsGeo.dispose();
      starsMaterial.dispose();
      moonMaterial.map?.dispose();
      moonMaterial.dispose();
      (sky.material as THREE.Material).dispose();
    };
  }, [scene]);

  // Poll every 30 seconds to catch time transitions and update in-state progress
  useEffect(() => {
    const applyCurrentState = () => {
      const { state, stateProgress } = getStateForCurrentTime();
      // If state changed, trigger a transition
      if (state !== activeStateRef.current) {
        setSourceState(activeStateRef.current);
        setTargetState(state);
        setActiveState(state);
        transitionProgress.current = 0;
      }
      stateProgressRef.current = stateProgress;
    };

    applyCurrentState();
    const interval = setInterval(applyCurrentState, 30000);
    return () => clearInterval(interval);
  }, []);

  // Core updater: sets sky uniforms and sun based on current state and in-state progress
  useEffect(() => {
    const sky = skyRef.current;
    const sun = sunRef.current;
    const stars = starsRef.current;
    const moon = moonRef.current;

    if (!sky || !sun || !water) return;
    const skyUniforms = sky.material.uniforms;

    const updateParameters = (crossAmt: number) => {
      // crossAmt blends from sourceState -> targetState (0..1)
      // within the currently active targetState we also respect the state's own stateProgress (time-based)
      const currentState = targetState;
      const sourceParams = weatherConfig[sourceState];
      const targetParams = weatherConfig[targetState];

      // Compute time progress for the active state (0..1)
      const inStateProgress = stateProgressRef.current ?? 0;

      // Elevation: blend source->target based on crossAmt, but also within target state's elevation range use inStateProgress
      const elevationFromCross = lerp(sourceParams.elevationEnd ?? sourceParams.elevationStart, targetParams.elevationStart, crossAmt);
      // Then apply in-state movement across target's elevationStart->elevationEnd
      const elevation = lerp(targetParams.elevationStart, targetParams.elevationEnd, inStateProgress);
      const finalElevation = lerp(elevationFromCross, elevation, crossAmt);

      // turbidity, rayleigh, mie blend across crossAmt
      const turbidity = lerp(sourceParams.turbidity, targetParams.turbidity, crossAmt);
      const rayleigh = lerp(sourceParams.rayleigh, targetParams.rayleigh, crossAmt);
      const mieCoefficient = lerp(sourceParams.mieCoefficient, targetParams.mieCoefficient, crossAmt);
      const mieDirectionalG = lerp(sourceParams.mieDirectionalG, targetParams.mieDirectionalG, crossAmt);

      skyUniforms['turbidity'].value = turbidity;
      skyUniforms['rayleigh'].value = rayleigh;
      skyUniforms['mieCoefficient'].value = mieCoefficient;
      skyUniforms['mieDirectionalG'].value = mieDirectionalG;

      const phi = THREE.MathUtils.degToRad(90 - finalElevation);
      const theta = THREE.MathUtils.degToRad(targetParams.azimuth);
      sun.setFromSphericalCoords(1, phi, theta);
      skyUniforms['sunPosition'].value.copy(sun);
      water.material.uniforms['sunDirection'].value.copy(sun).normalize();

      // Sun color: blend source -> target based on crossAmt, but within target use its own color interpolation by inStateProgress
      const sourceSunColor = new THREE.Color(sourceParams.sunColorEnd ?? sourceParams.sunColorStart);
      const targetColorAtProgress = new THREE.Color(targetParams.sunColorStart).lerp(
        new THREE.Color(targetParams.sunColorEnd),
        inStateProgress
      );
      const sunColor = sourceSunColor.clone().lerp(targetColorAtProgress, crossAmt);
      water.material.uniforms['sunColor'].value.copy(sunColor);

      // Night factors (simple: derived from target state's isNight but softened by crossAmt)
      const nightFactor = lerp(sourceParams.isNight ? 1 : 0, targetParams.isNight ? 1 : 0, crossAmt);
      if (stars) {
        const opacity = nightFactor;
        stars.visible = opacity > 0;
        (stars.material as THREE.PointsMaterial).opacity = opacity;
      }
      if (moon) {
        const opacity = nightFactor;
        moon.visible = opacity > 0;
        (moon.material as THREE.SpriteMaterial).opacity = opacity;
      }
    };

    // If no cross-state needed, just apply parameters with crossAmt=1 (fully target)
    if (sourceState === targetState) {
      updateParameters(1);
    } else {
      // Animate cross-state transition
      const startTime = performance.now();
      const animate = (now: DOMHighResTimeStamp) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / (transitionDuration * 1000), 1);
        transitionProgress.current = progress;
        updateParameters(progress);
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setSourceState(targetState);
        }
      };
      requestAnimationFrame(animate);
    }

    // Also keep updating within the state so the sun moves smoothly as minutes pass
    // small RAF loop to update in-state progress without heavy overhead
    let rafId: number | null = null;
    const tick = () => {
      // only needed when source === target
      if (sourceState === targetState) {
        updateParameters(1);
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [sourceState, targetState, water]);

  return null;
};

export default SkyManager;


//   return null;
// };

// export default SkyManager;
